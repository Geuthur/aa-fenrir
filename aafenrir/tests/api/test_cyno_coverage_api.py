"""Tests for the cyno coverage of route presets."""

# Standard Library
from datetime import datetime, timezone
from http import HTTPStatus
from unittest import skipUnless
from unittest.mock import patch

# Third Party
from evesde_factory.eve_sde import SolarSystemFactory

# Django
from django.contrib.auth.models import Group, Permission
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

# AA Fenrir
from aafenrir.helpers.cyno_coverage import corptools_installed
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory
from aafenrir.tests.testdata.fenrir import RoutePresetFactory

# corptools is optional and not available for every Alliance Auth version
if corptools_installed():
    # AA Fenrir
    from aafenrir.tests.testdata.corptools import create_character_location

COVERAGE_PATH = "aafenrir.helpers.cyno_coverage"


@skipUnless(corptools_installed(), "corptools is not installed")
class TestRoutePresetCoverageApi(AuthTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.origin = SolarSystemFactory(name="Jita")
        cls.waypoint = SolarSystemFactory(name="Hykkota")
        cls.destination = SolarSystemFactory(name="1DQ1-A")
        cls.elsewhere = SolarSystemFactory(name="Amarr")
        cls.preset = RoutePresetFactory(
            origin_system=cls.origin,
            destination_system=cls.destination,
            cyno_waypoints=[cls.waypoint],
        )
        cls.manager = UserMainFactory(
            permissions__=["aafenrir.basic_access", "aafenrir.manage_access"]
        )
        cls.admin = UserMainFactory(
            permissions__=["aafenrir.basic_access", "aafenrir.full_access"]
        )

    def _get_coverage(self, user, preset_id=None):
        self.client.force_login(user)
        return self.client.get(
            reverse(
                "aafenrir:api:get_route_preset_coverage",
                kwargs={"preset_id": preset_id or self.preset.id},
            )
        )

    def test_coverage_should_list_route_admin_character_in_waypoint(self):
        # Test Data
        updated = datetime(2026, 11, 7, 12, 0, tzinfo=timezone.utc)
        location = create_character_location(
            self.manager,
            self.waypoint,
            location_name="Hykkota - Fortizar",
            ship_name="Beacon",
            updated=updated,
        )
        character = location.character.character

        # Test Action
        response = self._get_coverage(self.manager)

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "system_id": self.waypoint.id,
                    "system_name": "Hykkota",
                    "characters": [
                        {
                            "character_id": character.character_id,
                            "character_name": character.character_name,
                            "portrait": (
                                "https://images.evetech.net/characters/"
                                f"{character.character_id}/portrait?size=64"
                            ),
                            "location_name": "Hykkota - Fortizar",
                            "ship_type_name": "Arazu",
                            "ship_name": "Beacon",
                            "last_update": "2026-11-07T12:00:00Z",
                            "is_own": True,
                        }
                    ],
                }
            ],
        )

    def test_coverage_should_list_systems_in_route_order(self):
        # Test Data
        create_character_location(self.admin, self.destination)
        create_character_location(self.manager, self.origin)

        # Test Action
        response = self._get_coverage(self.admin)

        # Expected Result
        self.assertEqual(
            [row["system_name"] for row in response.json()], ["Jita", "1DQ1-A"]
        )

    def test_coverage_should_show_manage_access_only_own_characters(self):
        # Test Data
        create_character_location(self.admin, self.waypoint)
        create_character_location(self.admin, self.origin)
        own = create_character_location(self.manager, self.origin)

        # Test Action
        response = self._get_coverage(self.manager)

        # Expected Result
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["system_name"], "Jita")
        characters = response.json()[0]["characters"]
        self.assertEqual(
            [c["character_id"] for c in characters],
            [own.character.character.character_id],
        )
        self.assertTrue(characters[0]["is_own"])

    def test_coverage_should_show_full_access_all_characters_marked_by_owner(self):
        # Test Data
        own = create_character_location(self.admin, self.waypoint)
        other = create_character_location(self.manager, self.waypoint)

        # Test Action
        response = self._get_coverage(self.admin)

        # Expected Result
        is_own = {
            c["character_id"]: c["is_own"] for c in response.json()[0]["characters"]
        }
        self.assertEqual(
            is_own,
            {
                own.character.character.character_id: True,
                other.character.character.character_id: False,
            },
        )

    def test_coverage_should_include_permission_from_group(self):
        # Test Data
        group = Group.objects.create(name="Cyno Pilots")
        group.permissions.add(
            Permission.objects.get(
                content_type__app_label="aafenrir", codename="manage_access"
            )
        )
        pilot = UserMainFactory()
        pilot.groups.add(group)
        create_character_location(pilot, self.waypoint)

        # Test Action
        response = self._get_coverage(self.admin)

        # Expected Result
        self.assertEqual(len(response.json()), 1)

    def test_coverage_should_ignore_characters_of_other_users(self):
        # Test Data
        create_character_location(self.user, self.waypoint)

        # Test Action
        response = self._get_coverage(self.admin)

        # Expected Result
        self.assertEqual(response.json(), [])

    def test_coverage_should_ignore_systems_outside_the_route(self):
        # Test Data
        create_character_location(self.manager, self.elsewhere)

        # Test Action
        response = self._get_coverage(self.manager)

        # Expected Result
        self.assertEqual(response.json(), [])

    def test_coverage_should_return_null_without_location_update_time(self):
        # Test Data
        create_character_location(self.manager, self.waypoint)

        # Test Action
        response = self._get_coverage(self.manager)

        # Expected Result
        self.assertIsNone(response.json()[0]["characters"][0]["last_update"])

    def test_coverage_should_use_constant_number_of_queries(self):
        # Test Data
        create_character_location(self.manager, self.waypoint)
        # Warm up: the first request also creates the session
        self._get_coverage(self.admin)

        # Test Action
        with CaptureQueriesContext(connection) as one_character:
            self._get_coverage(self.admin)
        create_character_location(self.admin, self.waypoint)
        create_character_location(self.admin, self.origin)
        with CaptureQueriesContext(connection) as three_characters:
            self._get_coverage(self.admin)

        # Expected Result
        self.assertEqual(
            len(one_character.captured_queries),
            len(three_characters.captured_queries),
        )

    def test_coverage_should_be_empty_without_corptools(self):
        # Test Data
        create_character_location(self.manager, self.waypoint)

        # Test Action
        with patch(f"{COVERAGE_PATH}.corptools_installed", return_value=False):
            response = self._get_coverage(self.manager)

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(response.json(), [])

    def test_coverage_should_be_forbidden_without_manage_access(self):
        # Test Data
        create_character_location(self.manager, self.waypoint)

        # Test Action
        response = self._get_coverage(self.user)

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.FORBIDDEN)
        self.assertNotIn("characters", response.content.decode())

    def test_coverage_should_return_not_found_for_unknown_preset(self):
        # Test Action
        response = self._get_coverage(self.manager, preset_id=999_999)

        # Expected Result
        self.assertEqual(response.status_code, HTTPStatus.NOT_FOUND)
