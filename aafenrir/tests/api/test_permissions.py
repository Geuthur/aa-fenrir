"""Tests for the higher permissions of the API endpoints.

`test_auth.py` covers that every endpoint requires `aafenrir.basic_access`.
"""

# Standard Library
import json
import re
from http import HTTPStatus
from unittest.mock import patch

# Third Party
from evesde_factory.eve_sde import SolarSystemFactory

# Django
from django.urls import reverse

# AA Fenrir
from aafenrir.api import api
from aafenrir.models import ContractHandler, RoutePreset, RouteSystem
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory
from aafenrir.tests.testdata.fenrir import ContractHandlerFactory, RoutePresetFactory

ADMINISTRATION_PATH = "aafenrir.api.administration"

# Endpoints which need more than `basic_access`
MANAGE_ENDPOINTS = {
    "get_route_preset_coverage",
    "create_route_preset",
    "update_route_preset",
    "delete_route_preset",
    "add_route_system",
    "delete_route_system",
}
ADMIN_ENDPOINTS = {
    "list_administration_handlers",
    "get_administration_handler",
    "update_administration_handler",
    "delete_administration_handler",
}
SUPERUSER_ENDPOINTS = {"update_administration_all"}


def _api_operations():
    """Return (method, path, name) of every operation registered in the API."""
    operations = []
    for _prefix, router in api._routers:  # pylint: disable=protected-access
        for path, path_view in router.path_operations.items():
            for operation in path_view.operations:
                for method in operation.methods:
                    operations.append((method, path, operation.view_func.__name__))
    return operations


class TestApiHigherPermissions(AuthTestCase):
    """Endpoints for route admins and the Administration need their permission on top."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.operations = _api_operations()
        cls.api_url = f"{reverse('aafenrir:index')}api/"
        cls.origin = SolarSystemFactory()
        cls.destination = SolarSystemFactory()
        cls.preset = RoutePresetFactory(
            origin_system=cls.origin, destination_system=cls.destination
        )
        cls.route_system = RouteSystem.objects.create(system=cls.origin)
        cls.handler = ContractHandlerFactory()
        cls.path_params = {
            "preset_id": cls.preset.id,
            "system_id": cls.origin.id,
            "eve_id": cls.origin.id,
            "corporation_id": cls.handler.organization_id,
        }
        preset_payload = {
            "name": "New Route",
            "origin_system_id": cls.destination.id,
            "destination_system_id": cls.origin.id,
        }
        cls.payloads = {
            "create_route_preset": preset_payload,
            "update_route_preset": preset_payload,
            "add_route_system": {"system_id": cls.destination.id},
            "update_user_settings": {"disable_notifications": True},
        }
        cls.manager = UserMainFactory(
            permissions__=["aafenrir.basic_access", "aafenrir.manage_access"]
        )
        cls.admin = UserMainFactory(
            permissions__=["aafenrir.basic_access", "aafenrir.full_access"]
        )

    def _call(self, user, method, path, name):
        self.client.force_login(user)
        url = self.api_url + path.format(**self.path_params)
        kwargs = {}
        if name in self.payloads:
            kwargs = {
                "data": json.dumps(self.payloads[name]),
                "content_type": "application/json",
            }
        return getattr(self.client, method.lower())(url, **kwargs)

    def _state(self):
        return (
            list(RoutePreset.objects.values_list("id", "name")),
            list(RouteSystem.objects.values_list("id", flat=True)),
            list(ContractHandler.objects.values_list("pk", flat=True)),
        )

    def test_operations_should_be_known(self):
        """A new endpoint must be listed here, so that it is covered by these tests."""
        names = {name for _method, _path, name in self.operations}
        self.assertEqual(len(names), len(self.operations))
        self.assertEqual(
            names,
            MANAGE_ENDPOINTS
            | ADMIN_ENDPOINTS
            | SUPERUSER_ENDPOINTS
            | {
                "get_menu",
                "get_user",
                "get_user_settings",
                "update_user_settings",
                "get_contract_handlers",
                "get_route_presets",
                "get_route_preset",
                "get_route_systems",
                "get_contract_queue",
                "get_solar_system",
                "search_solar_systems",
            },
        )
        for _method, path, name in self.operations:
            for param in re.findall(r"{(\w+)}", path):
                with self.subTest(endpoint=name, param=param):
                    self.assertIn(param, self.path_params)

    def test_basic_access_alone_should_only_reach_basic_endpoints(self):
        higher = MANAGE_ENDPOINTS | ADMIN_ENDPOINTS | SUPERUSER_ENDPOINTS
        state = self._state()
        for method, path, name in self.operations:
            with self.subTest(method=method, endpoint=name):
                response = self._call(self.user, method, path, name)

                if name in higher:
                    self.assertEqual(response.status_code, HTTPStatus.FORBIDDEN)
                    self.assertEqual(self._state(), state)
                else:
                    self.assertNotEqual(response.status_code, HTTPStatus.FORBIDDEN)

    @patch(f"{ADMINISTRATION_PATH}.tasks")
    def test_manager_with_basic_access_should_keep_access(self, _mock_tasks):
        denied = ADMIN_ENDPOINTS | SUPERUSER_ENDPOINTS
        # Deleting endpoints last, the others need the objects
        for method, path, name in sorted(
            self.operations, key=lambda o: o[0] == "DELETE"
        ):
            with self.subTest(method=method, endpoint=name):
                response = self._call(self.manager, method, path, name)

                if name in denied:
                    self.assertEqual(response.status_code, HTTPStatus.FORBIDDEN)
                else:
                    self.assertNotEqual(response.status_code, HTTPStatus.FORBIDDEN)

    @patch(f"{ADMINISTRATION_PATH}.tasks")
    def test_admin_with_basic_access_should_keep_access(self, _mock_tasks):
        for method, path, name in sorted(
            self.operations, key=lambda o: o[0] == "DELETE"
        ):
            with self.subTest(method=method, endpoint=name):
                response = self._call(self.admin, method, path, name)

                if name in SUPERUSER_ENDPOINTS:
                    self.assertEqual(response.status_code, HTTPStatus.FORBIDDEN)
                else:
                    self.assertNotEqual(response.status_code, HTTPStatus.FORBIDDEN)

    def test_get_menu_should_return_links_by_permission(self):
        expected = {"user": 0, "manager": 2, "admin": 3}
        users = {"user": self.user, "manager": self.manager, "admin": self.admin}
        for label, user in users.items():
            with self.subTest(user=label):
                self.client.force_login(user)

                response = self.client.get(reverse("aafenrir:api:get_menu"))

                self.assertEqual(response.status_code, HTTPStatus.OK)
                self.assertEqual(len(response.json()["left_links"]), 3)
                self.assertEqual(len(response.json()["right_links"]), expected[label])
