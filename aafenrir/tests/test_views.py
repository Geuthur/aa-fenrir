"""Tests for the App Views."""

# Standard Library
from http import HTTPStatus
from unittest.mock import Mock, patch

# Django
from django.contrib.messages import get_messages
from django.urls import reverse

# Alliance Auth
from allianceauth.eveonline.models import EveCharacter

# AA Fenrir
from aafenrir.models import ContractHandler, EveEntity
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory
from aafenrir.tests.testdata.fenrir import EveEntityFactory

VIEWS_PATH = "aafenrir.views"


class TestAddContractHandler(AuthTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.url = reverse("aafenrir:add_contract_handler")
        cls.manager = UserMainFactory(permissions__=["aafenrir.manage_access"])
        cls.admin = UserMainFactory(permissions__=["aafenrir.full_access"])
        cls.ownership = cls.manager.profile.main_character.character_ownership
        cls.character = cls.ownership.character

    def _get_with_token(self, user, character=None):
        """Call the view as if the user came back from SSO with a token."""
        character = character or user.profile.main_character
        self.client.force_login(user)
        with patch(
            "esi.decorators._check_callback",
            return_value=Mock(character_id=character.character_id),
        ):
            return self.client.get(self.url)

    def test_should_redirect_anonymous_to_login(self):
        # Test Action
        response = self.client.get(self.url)

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.FOUND)
        self.assertIn("login", response.url)

    @patch(f"{VIEWS_PATH}.update_freight")
    def test_should_deny_user_without_management_access(self, mock_task):
        # Test Action
        response = self._get_with_token(self.user)

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.FOUND)
        self.assertFalse(ContractHandler.objects.exists())
        mock_task.apply_async.assert_not_called()

    @patch(f"{VIEWS_PATH}.update_freight")
    def test_should_create_handler_and_start_update(self, mock_task):
        # Test Action
        response = self._get_with_token(self.manager)

        # Expected Result
        self.assertRedirects(
            response, reverse("aafenrir:index"), fetch_redirect_response=False
        )
        handler = ContractHandler.objects.get(
            organization_id=self.character.corporation_id
        )
        self.assertEqual(handler.character, self.ownership)
        self.assertEqual(handler.organization.name, self.character.corporation_name)
        self.assertEqual(handler.organization.category, "corporation")
        mock_task.apply_async.assert_called_once_with(
            args=[self.character.corporation_id]
        )

    @patch(f"{VIEWS_PATH}.update_freight")
    def test_should_accept_full_access(self, mock_task):
        # Test Action
        response = self._get_with_token(self.admin)

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.FOUND)
        self.assertEqual(ContractHandler.objects.count(), 1)
        mock_task.apply_async.assert_called_once()

    @patch(f"{VIEWS_PATH}.update_freight")
    def test_should_replace_character_of_existing_handler(self, mock_task):
        # Test Data
        organization = EveEntityFactory(eve_id=self.character.corporation_id)
        ContractHandler.objects.create(organization=organization, character=None)

        # Test Action
        self._get_with_token(self.manager)

        # Expected Result
        handler = ContractHandler.objects.get(organization=organization)
        self.assertEqual(handler.character, self.ownership)
        mock_task.apply_async.assert_called_once()

    @patch(f"{VIEWS_PATH}.update_freight")
    def test_should_reject_character_of_other_user(self, mock_task):
        # Test Action
        response = self._get_with_token(
            self.manager, character=self.admin.profile.main_character
        )

        # Expected Result
        self.assertRedirects(
            response, reverse("aafenrir:index"), fetch_redirect_response=False
        )
        self.assertFalse(ContractHandler.objects.exists())
        mock_task.apply_async.assert_not_called()
        self.assertEqual(len(list(get_messages(response.wsgi_request))), 1)

    @patch(f"{VIEWS_PATH}.update_freight")
    def test_should_reject_npc_corporation(self, mock_task):
        # Test Data
        EveCharacter.objects.filter(pk=self.character.pk).update(
            corporation_id=1_000_125
        )

        # Test Action
        response = self._get_with_token(self.manager)

        # Expected Result
        self.assertRedirects(
            response, reverse("aafenrir:index"), fetch_redirect_response=False
        )
        self.assertFalse(ContractHandler.objects.exists())
        self.assertFalse(EveEntity.objects.filter(eve_id=1_000_125).exists())
        mock_task.apply_async.assert_not_called()
        self.assertEqual(len(list(get_messages(response.wsgi_request))), 1)

    def test_get_menu_should_link_to_view_for_management_only(self):
        # Test Action
        self.client.force_login(self.manager)
        manager_menu = self.client.get(reverse("aafenrir:api:get_menu")).json()
        self.client.force_login(self.user)
        user_menu = self.client.get(reverse("aafenrir:api:get_menu")).json()

        # Expected Result
        links = {link["name"]: link for link in manager_menu["right_links"]}
        self.assertEqual(links["Add Company"]["link"], self.url)
        self.assertTrue(links["Add Company"]["is_external"])
        self.assertNotIn(
            "Add Company", [link["name"] for link in user_menu["right_links"]]
        )
