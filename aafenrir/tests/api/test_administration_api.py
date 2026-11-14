"""Tests for the Administration API."""

# Standard Library
from datetime import timedelta
from http import HTTPStatus
from unittest.mock import patch

# Django
from django.db import IntegrityError, connection
from django.db.models import ProtectedError
from django.db.models.signals import pre_delete
from django.urls import reverse
from django.utils import timezone

# Alliance Auth
from esi.errors import TokenError
from esi.models import Token

# AA Fenrir
from aafenrir.helpers.choice import Status
from aafenrir.models import ContractHandler
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory
from aafenrir.tests.testdata.fenrir import (
    ContractCustomerNotificationFactory,
    ContractFactory,
    ContractHandlerFactory,
    EveEntityFactory,
)

API_URL = "aafenrir:api"
TASK_PATH = "aafenrir.tasks"
TOKEN_PATH = "esi.models.Token"


class TestAdministrationApi(AuthTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.admin = UserMainFactory(permissions__=["aafenrir.full_access"])
        cls.manager = UserMainFactory(permissions__=["aafenrir.manage_access"])

    def _get(self, user, name, **kwargs):
        self.client.force_login(user)
        return self.client.get(reverse(f"{API_URL}:{name}", kwargs=kwargs))

    def test_list_handlers_should_forbid_user_without_admin_access(self):
        # Test Data
        ContractHandlerFactory()

        # Test Action
        response_user = self._get(self.user, "list_administration_handlers")
        response_manager = self._get(self.manager, "list_administration_handlers")

        # Expected Result
        self.assertEqual(response_user.status_code, HTTPStatus.FORBIDDEN)
        self.assertEqual(response_manager.status_code, HTTPStatus.FORBIDDEN)

    def test_list_handlers_should_return_handlers_with_counts(self):
        # Test Data
        handler = ContractHandlerFactory()
        ContractFactory(handler=handler, status=Status.OUTSTANDING)
        ContractFactory(handler=handler, status=Status.IN_PROGRESS)
        ContractFactory(handler=handler, status=Status.FINISHED)

        # Test Action
        response = self._get(self.admin, "list_administration_handlers")

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.OK)
        row = next(r for r in response.json() if r["id"] == handler.organization_id)
        self.assertEqual(row["contracts_total"], 3)
        self.assertEqual(row["contracts_pending"], 1)
        self.assertEqual(row["contracts_in_progress"], 1)
        self.assertEqual(row["status"], "no_character")

    def _handler_with_expired_token(self) -> ContractHandler:
        """Return a handler whose token is expired and needs a refresh."""
        handler_user = UserMainFactory(scopes=ContractHandler.get_esi_scopes())
        handler = ContractHandlerFactory(
            character=handler_user.character_ownerships.get()
        )
        Token.objects.filter(user=handler_user).update(
            created=timezone.now() - timedelta(days=1)
        )
        return handler

    def _assert_token_error_without_breaking_list(self, delete_error):
        # Test Data
        broken = self._handler_with_expired_token()
        other = ContractHandlerFactory()

        def block_delete(**kwargs):
            # Raised inside Django's delete transaction, like a DB constraint
            raise delete_error

        pre_delete.connect(block_delete, sender=Token)
        self.addCleanup(pre_delete.disconnect, block_delete, sender=Token)

        # Test Action
        with patch(f"{TOKEN_PATH}.refresh", side_effect=TokenError("invalid_grant")):
            response = self._get(self.admin, "list_administration_handlers")

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.OK)
        rows = {row["id"]: row for row in response.json()}
        self.assertEqual(rows[broken.organization_id]["status"], "token_error")
        self.assertEqual(rows[other.organization_id]["status"], "no_character")
        # The request transaction is still usable and the token was kept
        self.assertFalse(connection.needs_rollback)
        self.assertTrue(
            Token.objects.filter(user=broken.character.user)
            .require_scopes(ContractHandler.get_esi_scopes())
            .exists()
        )

    def test_list_handlers_should_report_token_error_when_token_delete_fails(self):
        """django-esi deletes a token that fails to refresh; a foreign key of
        another app (e.g. orphaned corpstats tables) rejects the delete."""
        self._assert_token_error_without_breaking_list(
            IntegrityError(
                1451, "Cannot delete or update a parent row: a foreign key fails"
            )
        )

    def test_list_handlers_should_report_token_error_when_token_is_protected(self):
        self._assert_token_error_without_breaking_list(
            ProtectedError("Token is protected", set())
        )

    def test_list_handlers_should_delete_token_and_report_token_error_when_refresh_fails(
        self,
    ):
        # Test Data
        broken = self._handler_with_expired_token()

        # Test Action
        with patch(f"{TOKEN_PATH}.refresh", side_effect=TokenError("invalid_grant")):
            response = self._get(self.admin, "list_administration_handlers")

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.OK)
        row = next(r for r in response.json() if r["id"] == broken.organization_id)
        self.assertEqual(row["status"], "token_error")
        self.assertFalse(
            Token.objects.filter(user=broken.character.user)
            .require_scopes(ContractHandler.get_esi_scopes())
            .exists()
        )

    def test_list_handlers_should_not_count_expired_contracts_as_pending(self):
        # Test Data
        handler = ContractHandlerFactory()
        ContractFactory(handler=handler, status=Status.OUTSTANDING)
        ContractFactory(
            handler=handler,
            status=Status.OUTSTANDING,
            date_expired=timezone.now() - timedelta(minutes=1),
        )

        # Test Action
        response = self._get(self.admin, "list_administration_handlers")

        # Expected Result
        row = next(r for r in response.json() if r["id"] == handler.organization_id)
        self.assertEqual(row["contracts_total"], 2)
        self.assertEqual(row["contracts_pending"], 1)

    def test_list_handlers_should_exclude_npc_corporations(self):
        # Test Data
        npc = ContractHandlerFactory(organization=EveEntityFactory(eve_id=1000125))
        player = ContractHandlerFactory()

        # Test Action
        response = self._get(self.superuser, "list_administration_handlers")

        # Expected Result
        ids = [row["id"] for row in response.json()]
        self.assertNotIn(npc.organization_id, ids)
        self.assertIn(player.organization_id, ids)

    def test_get_handler_should_return_contract_statistics(self):
        # Test Data
        handler = ContractHandlerFactory()
        first = ContractFactory(
            handler=handler,
            status=Status.FINISHED,
            reward=10.0,
            collateral=100.0,
            volume=5.0,
            date_issued=timezone.now() - timedelta(days=2),
        )
        ContractFactory(
            handler=handler,
            status=Status.FINISHED,
            reward=20.0,
            collateral=200.0,
            volume=7.0,
        )
        ContractFactory(handler=handler, status=Status.OUTSTANDING)
        ContractCustomerNotificationFactory(contract=first, status=Status.FINISHED)

        # Test Action
        response = self._get(
            self.admin, "get_administration_handler", corporation_id=handler.pk
        )

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.OK)
        data = response.json()
        finished = next(s for s in data["stats"] if s["status"] == Status.FINISHED)
        self.assertEqual(finished["count"], 2)
        self.assertEqual(finished["reward"], 30.0)
        self.assertEqual(finished["collateral"], 300.0)
        self.assertEqual(finished["volume"], 12.0)
        self.assertEqual(data["contracts_total"], 3)
        self.assertEqual(len(data["recent_notifications"]), 1)
        self.assertEqual(
            data["recent_notifications"][0]["contract_id"], first.contract_id
        )

    def test_get_handler_should_count_expired_pending_contracts_as_failed(self):
        # Test Data
        handler = ContractHandlerFactory()
        ContractFactory(handler=handler, status=Status.OUTSTANDING, reward=1.0)
        ContractFactory(handler=handler, status=Status.FAILED, reward=2.0)
        ContractFactory(
            handler=handler,
            status=Status.OUTSTANDING,
            reward=4.0,
            date_expired=timezone.now() - timedelta(minutes=1),
        )

        # Test Action
        response = self._get(
            self.admin, "get_administration_handler", corporation_id=handler.pk
        )

        # Expected Result
        data = response.json()
        stats = {s["status"]: s for s in data["stats"]}
        self.assertEqual(stats[Status.OUTSTANDING]["count"], 1)
        self.assertEqual(stats[Status.OUTSTANDING]["reward"], 1.0)
        self.assertEqual(stats[Status.FAILED]["count"], 2)
        self.assertEqual(stats[Status.FAILED]["reward"], 6.0)
        self.assertEqual(data["contracts_total"], 3)
        self.assertEqual(data["contracts_pending"], 1)

    def test_get_handler_should_return_404_for_npc_corporation(self):
        # Test Data
        npc = ContractHandlerFactory(organization=EveEntityFactory(eve_id=1000125))

        # Test Action
        response = self._get(
            self.admin, "get_administration_handler", corporation_id=npc.pk
        )

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.NOT_FOUND)

    def test_get_handler_should_forbid_user_without_admin_access(self):
        # Test Data
        handler = ContractHandlerFactory()

        # Test Action
        response = self._get(
            self.manager, "get_administration_handler", corporation_id=handler.pk
        )

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.FORBIDDEN)

    @patch(f"{TASK_PATH}.update_freight")
    def test_update_handler_should_queue_task(self, mock_task):
        # Test Data
        handler = ContractHandlerFactory()
        self.client.force_login(self.admin)

        # Test Action
        response = self.client.post(
            reverse(
                f"{API_URL}:update_administration_handler",
                kwargs={"corporation_id": handler.pk},
            )
        )

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.OK)
        mock_task.apply_async.assert_called_once_with(
            args=[handler.pk], kwargs={"force_refresh": False}
        )

    @patch(f"{TASK_PATH}.update_freight")
    def test_update_handler_force_refresh_should_work_for_superuser(self, mock_task):
        # Test Data
        handler = ContractHandlerFactory()
        url = reverse(
            f"{API_URL}:update_administration_handler",
            kwargs={"corporation_id": handler.pk},
        )

        # Test Action
        self.client.force_login(self.superuser)
        response_superuser = self.client.post(f"{url}?force_refresh=true")

        # Expected Result
        self.assertEqual(response_superuser.status_code, HTTPStatus.OK)
        mock_task.apply_async.assert_called_once_with(
            args=[handler.pk], kwargs={"force_refresh": True}
        )

    @patch(f"{TASK_PATH}.update_freight")
    def test_update_handler_with_force_refresh_should_forbid_admin(self, mock_task):
        # Test Data
        handler = ContractHandlerFactory()
        self.client.force_login(self.admin)

        # Test Action
        response = self.client.post(
            reverse(
                f"{API_URL}:update_administration_handler",
                kwargs={"corporation_id": handler.pk},
            )
            + "?force_refresh=true"
        )

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.FORBIDDEN)
        mock_task.apply_async.assert_not_called()

    def test_delete_handler_should_remove_handler_and_contracts(self):
        # Test Data
        handler = ContractHandlerFactory()
        ContractFactory(handler=handler)
        self.client.force_login(self.admin)

        # Test Action
        response = self.client.delete(
            reverse(
                f"{API_URL}:delete_administration_handler",
                kwargs={"corporation_id": handler.pk},
            )
        )

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertFalse(ContractHandler.objects.filter(pk=handler.pk).exists())

    def test_delete_handler_should_forbid_user_without_admin_access(self):
        # Test Data
        handler = ContractHandlerFactory()
        self.client.force_login(self.manager)

        # Test Action
        response = self.client.delete(
            reverse(
                f"{API_URL}:delete_administration_handler",
                kwargs={"corporation_id": handler.pk},
            )
        )

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.FORBIDDEN)
        self.assertTrue(ContractHandler.objects.filter(pk=handler.pk).exists())

    @patch(f"{TASK_PATH}.aafenrir_task")
    def test_update_all_should_be_superuser_only(self, mock_task):
        # Test Data
        url = reverse(f"{API_URL}:update_administration_all")

        # Test Action
        self.client.force_login(self.admin)
        response_admin = self.client.post(url)
        self.client.force_login(self.superuser)
        response_superuser = self.client.post(url)

        # Expected Result
        self.assertEqual(response_admin.status_code, HTTPStatus.FORBIDDEN)
        self.assertEqual(response_superuser.status_code, HTTPStatus.OK)
        mock_task.apply_async.assert_called_once_with(kwargs={"force_refresh": False})

    def test_get_menu_should_include_administration_for_admin_only(self):
        # Test Data / Test Action
        admin_menu = self._get(self.admin, "get_menu").json()
        user_menu = self._get(self.user, "get_menu").json()

        # Expected Result
        names_admin = [link["name"] for link in admin_menu["right_links"]]
        names_user = [link["name"] for link in user_menu["right_links"]]
        self.assertIn("Administration", names_admin)
        self.assertNotIn("Administration", names_user)
