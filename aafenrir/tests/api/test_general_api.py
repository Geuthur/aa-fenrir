"""Tests for the General API."""

# Standard Library
from http import HTTPStatus
from unittest.mock import patch

# Django
from django.urls import reverse

# AA Fenrir
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory

GENERAL_API_PATH = "aafenrir.api.general"


class TestUserApi(AuthTestCase):
    def _get_user(self):
        self.client.force_login(
            UserMainFactory(permissions__=["aafenrir.basic_access"])
        )
        return self.client.get(reverse("aafenrir:api:get_user"))

    def test_get_user_should_return_default_calculator_limits(self):
        response = self._get_user()

        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(response.json()["calculator_max_volume"], 10_000_000)
        self.assertEqual(
            response.json()["calculator_max_collateral"], 1_000_000_000_000
        )

    @patch(f"{GENERAL_API_PATH}.AA_FENRIR_MAX_COLLATERAL", 5_000)
    @patch(f"{GENERAL_API_PATH}.AA_FENRIR_MAX_VOLUME", 2_000)
    def test_get_user_should_return_configured_calculator_limits(self):
        response = self._get_user()

        self.assertEqual(response.json()["calculator_max_volume"], 2_000)
        self.assertEqual(response.json()["calculator_max_collateral"], 5_000)

    def test_get_user_should_return_contract_fields(self):
        user = UserMainFactory(permissions__=["aafenrir.basic_access"])
        self.client.force_login(user)

        response = self.client.get(reverse("aafenrir:api:get_user"))

        data = response.json()
        main = user.profile.main_character
        self.assertEqual(data["corporation_id"], main.corporation_id)
        self.assertEqual(data["corporation_name"], main.corporation_name)
        self.assertIn("alliance_id", data)
        self.assertIn("alliance_name", data)
        self.assertFalse(data["is_admin"])

    def test_get_user_should_flag_superuser_as_admin(self):
        self.client.force_login(self.superuser)

        response = self.client.get(reverse("aafenrir:api:get_user"))

        self.assertTrue(response.json()["is_admin"])

    def test_get_user_should_deny_without_access(self):
        self.client.force_login(UserMainFactory(permissions__=[]))

        response = self.client.get(reverse("aafenrir:api:get_user"))

        self.assertEqual(response.status_code, HTTPStatus.FORBIDDEN)


class TestUserSettingsApi(AuthTestCase):
    def setUp(self):
        self.user = UserMainFactory(permissions__=["aafenrir.basic_access"])
        self.client.force_login(self.user)
        self.url = reverse("aafenrir:api:get_user_settings")

    def test_get_settings_should_return_defaults(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(
            response.json(),
            {"disable_notifications": False, "quick_select_presets": []},
        )

    def test_put_settings_should_update_notifications_only(self):
        response = self.client.put(
            reverse("aafenrir:api:update_user_settings"),
            data={"disable_notifications": True},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertTrue(response.json()["disable_notifications"])
        self.assertEqual(response.json()["quick_select_presets"], [])

    def test_put_settings_should_update_quick_select_presets_limited_to_five(self):
        response = self.client.put(
            reverse("aafenrir:api:update_user_settings"),
            data={"quick_select_presets": [1, 2, 3, 4, 5, 6]},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(response.json()["quick_select_presets"], [1, 2, 3, 4, 5])
        self.assertFalse(response.json()["disable_notifications"])

    def test_settings_should_deny_without_access(self):
        self.client.force_login(UserMainFactory(permissions__=[]))

        get_response = self.client.get(self.url)
        put_response = self.client.put(
            reverse("aafenrir:api:update_user_settings"),
            data={"disable_notifications": True},
            content_type="application/json",
        )

        self.assertEqual(get_response.status_code, HTTPStatus.FORBIDDEN)
        self.assertEqual(put_response.status_code, HTTPStatus.FORBIDDEN)
