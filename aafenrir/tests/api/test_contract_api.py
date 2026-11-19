"""Tests for the Contract API."""

# Standard Library
from datetime import timedelta
from http import HTTPStatus

# Django
from django.urls import reverse
from django.utils import timezone

# AA Fenrir
from aafenrir.helpers.choice import Status
from aafenrir.models import Contract
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.fenrir import ContractFactory, ContractHandlerFactory

API_URL = "aafenrir:api"


class TestContractQueueApi(AuthTestCase):
    def _get_queue(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse(f"{API_URL}:get_contract_queue"))
        self.assertEqual(response.status_code, HTTPStatus.OK)
        return {row["contract_id"]: row for row in response.json()}

    def test_should_report_expired_pending_contract_as_failed(self):
        # Test Data
        expired = ContractFactory(
            handler=ContractHandlerFactory(),
            status=Status.OUTSTANDING,
            date_expired=timezone.now() - timedelta(minutes=1),
        )

        # Test Action
        row = self._get_queue()[expired.contract_id]

        # Expected Result
        self.assertEqual(row["status"], Status.FAILED)
        self.assertEqual(row["status_display"], "Expired")

    def test_should_not_change_stored_status_of_expired_pending_contract(self):
        # Test Data
        expired = ContractFactory(
            handler=ContractHandlerFactory(),
            status=Status.OUTSTANDING,
            date_expired=timezone.now() - timedelta(minutes=1),
        )

        # Test Action
        self._get_queue()

        # Expected Result
        self.assertEqual(Contract.objects.get(pk=expired.pk).status, Status.OUTSTANDING)

    def test_should_keep_pending_contract_which_has_not_expired(self):
        # Test Data
        pending = ContractFactory(
            handler=ContractHandlerFactory(),
            status=Status.OUTSTANDING,
            date_expired=timezone.now() + timedelta(minutes=1),
        )

        # Test Action
        row = self._get_queue()[pending.contract_id]

        # Expected Result
        self.assertEqual(row["status"], Status.OUTSTANDING)
        self.assertEqual(row["status_display"], "Pending")

    def test_should_keep_in_progress_contract_past_its_expiry(self):
        # Test Data
        in_progress = ContractFactory(
            handler=ContractHandlerFactory(),
            status=Status.IN_PROGRESS,
            date_expired=timezone.now() - timedelta(days=1),
        )

        # Test Action
        row = self._get_queue()[in_progress.contract_id]

        # Expected Result
        self.assertEqual(row["status"], Status.IN_PROGRESS)
        self.assertEqual(row["status_display"], "In Progress")


class TestNotFoundErrorFormat(AuthTestCase):
    """The 404 answers carry the message below `error`, like every other error."""

    def _assert_not_found(self, method, name, message, **kwargs):
        self.client.force_login(self.superuser)

        response = getattr(self.client, method)(
            reverse(f"{API_URL}:{name}", kwargs=kwargs),
            **(
                {"data": "{}", "content_type": "application/json"}
                if method == "put"
                else {}
            ),
        )

        self.assertEqual(response.status_code, HTTPStatus.NOT_FOUND)
        self.assertEqual(response.json(), {"error": message})

    def test_get_route_preset_should_return_error_body(self):
        self._assert_not_found(
            "get", "get_route_preset", "Route preset not found.", preset_id=999_999
        )

    def test_delete_route_preset_should_return_error_body(self):
        self._assert_not_found(
            "delete",
            "delete_route_preset",
            "Route preset not found.",
            preset_id=999_999,
        )

    def test_delete_route_system_should_return_error_body(self):
        self._assert_not_found(
            "delete",
            "delete_route_system",
            "Route system not found.",
            system_id=999_999,
        )

    def test_get_solar_system_should_return_error_body(self):
        self._assert_not_found(
            "get", "get_solar_system", "Solar system not found.", eve_id=999_999
        )
