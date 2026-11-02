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
