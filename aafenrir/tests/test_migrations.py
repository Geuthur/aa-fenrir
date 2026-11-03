"""Tests for the data migrations."""

# Standard Library
from importlib import import_module

# Django
from django.apps import apps
from django.db import connection

# AA Fenrir
from aafenrir.models import ContractCustomerNotification
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.fenrir import (
    ContractCustomerNotificationFactory,
    ContractFactory,
)

migration = import_module("aafenrir.migrations.0008_contract_status_esi_values")


class _SchemaEditor:
    connection = connection


class TestContractStatusEsiValues(AuthTestCase):
    def test_should_rename_status_of_contracts(self):
        # Test Data
        pending = ContractFactory(status="pending")
        canceled = ContractFactory(status="canceled")
        finished = ContractFactory(status="finished")

        # Test Action
        migration.forwards(apps, _SchemaEditor)

        # Expected Result
        pending.refresh_from_db()
        canceled.refresh_from_db()
        finished.refresh_from_db()
        self.assertEqual(pending.status, "outstanding")
        self.assertEqual(canceled.status, "cancelled")
        self.assertEqual(finished.status, "finished")

    def test_should_rename_status_of_notifications(self):
        # Test Data
        notification = ContractCustomerNotificationFactory(status="pending")

        # Test Action
        migration.forwards(apps, _SchemaEditor)

        # Expected Result
        notification.refresh_from_db()
        self.assertEqual(notification.status, "outstanding")

    def test_should_keep_one_notification_if_contract_has_both_values(self):
        # Test Data
        contract = ContractFactory(status="pending")
        ContractCustomerNotificationFactory(contract=contract, status="pending")
        ContractCustomerNotificationFactory(contract=contract, status="outstanding")

        # Test Action
        migration.forwards(apps, _SchemaEditor)

        # Expected Result
        notifications = ContractCustomerNotification.objects.filter(contract=contract)
        self.assertEqual(notifications.get().status, "outstanding")

    def test_should_restore_old_values_on_backwards(self):
        # Test Data
        outstanding = ContractFactory(status="outstanding")
        notification = ContractCustomerNotificationFactory(
            contract=outstanding, status="cancelled"
        )

        # Test Action
        migration.backwards(apps, _SchemaEditor)

        # Expected Result
        outstanding.refresh_from_db()
        notification.refresh_from_db()
        self.assertEqual(outstanding.status, "pending")
        self.assertEqual(notification.status, "canceled")
