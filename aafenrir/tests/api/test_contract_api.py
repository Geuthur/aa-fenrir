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
