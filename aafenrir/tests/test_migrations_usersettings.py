"""Tests for the UserSettings data migration."""

# Standard Library
from importlib import import_module

# Django
from django.db import IntegrityError, connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase

# Alliance Auth
from allianceauth.authentication.models import User

migration = import_module("aafenrir.migrations.0009_usersettings_user_onetoone")

MIGRATE_FROM = [("aafenrir", "0008_contract_status_esi_values")]
MIGRATE_TO = [("aafenrir", "0009_usersettings_user_onetoone")]


class TestUserSettingsOneToOne(TransactionTestCase):
    """Run migration 0009 on a database state with duplicates."""

    def setUp(self):
        executor = MigrationExecutor(connection)
        executor.migrate(MIGRATE_FROM)
        self.old_apps = executor.loader.project_state(MIGRATE_FROM).apps

    def tearDown(self):
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(executor.loader.graph.leaf_nodes())

    def _migrate(self):
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(MIGRATE_TO)
        return executor.loader.project_state(MIGRATE_TO).apps

    def test_should_keep_newest_row_per_user_and_drop_rows_without_user(self):
        # Test Data
        old_settings = self.old_apps.get_model("aafenrir", "UserSettings")
        user_a = User.objects.create_user("user_a")
        user_b = User.objects.create_user("user_b")
        old_settings.objects.create(user_id=user_a.pk, disable_notifications=False)
        newest_a = old_settings.objects.create(
            user_id=user_a.pk, disable_notifications=True
        )
        single_b = old_settings.objects.create(user_id=user_b.pk)
        old_settings.objects.create(user_id=None)

        # Test Action
        new_apps = self._migrate()

        # Expected Result
        new_settings = new_apps.get_model("aafenrir", "UserSettings")
        self.assertEqual(
            sorted(new_settings.objects.values_list("pk", flat=True)),
            sorted([newest_a.pk, single_b.pk]),
        )
        self.assertTrue(
            new_settings.objects.get(user_id=user_a.pk).disable_notifications
        )

    def test_should_reject_second_row_for_user_after_migration(self):
        # Test Data
        user = User.objects.create_user("user_c")
        new_apps = self._migrate()
        new_settings = new_apps.get_model("aafenrir", "UserSettings")
        new_settings.objects.create(user_id=user.pk)

        # Test Action / Expected Result
        with self.assertRaises(IntegrityError):
            new_settings.objects.create(user_id=user.pk)
