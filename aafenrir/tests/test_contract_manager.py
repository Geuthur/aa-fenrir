"""Tests for the contract manager."""

# Standard Library
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch

# Third Party
from evesde_factory.allianceauth import EveCharacterFactory, EveCorporationInfoFactory

# Django
from django.utils import timezone

# AA Fenrir
from aafenrir.helpers.choice import Status
from aafenrir.models import Contract
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.fenrir import ContractHandlerFactory, LocationFactory

MANAGER_PATH = "aafenrir.managers.ContractManager"
MODEL_PATH = "aafenrir.models.fenrir.Contract"


class TestUpdateOrCreateFromDict(AuthTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.handler = ContractHandlerFactory()
        cls.issuer = EveCharacterFactory()
        cls.issuer_corporation = EveCorporationInfoFactory()
        cls.location = LocationFactory()

    def _store_contract(self, status: str, contract_id: int = 1) -> Contract:
        """Store a contract as the ESI client returns it."""
        contract = SimpleNamespace(
            contract_id=contract_id,
            status=status,
            collateral=1_000_000_000.0,
            date_accepted=None,
            date_completed=None,
            date_expired=timezone.now() + timedelta(days=7),
            date_issued=timezone.now(),
            days_to_complete=3,
            for_corporation=False,
            reward=50_000_000.0,
            title="",
            volume=100_000.0,
        )
        with (
            patch(
                f"{MANAGER_PATH}._identify_contracts_acceptor",
                return_value=(None, None),
            ),
            patch(
                f"{MANAGER_PATH}._identify_contracts_issuer",
                return_value=(self.issuer_corporation, self.issuer),
            ),
            patch(
                f"{MANAGER_PATH}._identify_locations",
                return_value=(self.location, self.location),
            ),
        ):
            return Contract.objects.update_or_create_from_dict(
                handler=self.handler, contract=contract, token=None
            )[0]

    def test_should_store_outstanding_as_pending(self):
        # Test Action
        contract = self._store_contract("outstanding")

        # Expected Result
        contract.refresh_from_db()
        self.assertEqual(contract.status, Status.PENDING)
        self.assertEqual(contract.get_status_display(), "Pending")
        self.assertEqual(Contract.objects.pending_count(), 1)

    def test_should_store_cancelled_as_canceled(self):
        # Test Action
        contract = self._store_contract("cancelled")

        # Expected Result
        contract.refresh_from_db()
        self.assertEqual(contract.status, Status.CANCELED)
        self.assertEqual(contract.get_status_display(), "Canceled")
        self.assertTrue(contract.is_completed)
        self.assertFalse(Contract.objects.filter_not_completed().exists())

    def test_should_keep_status_names_shared_with_esi(self):
        shared = set(Status.values) - {Status.PENDING, Status.CANCELED}

        for contract_id, status in enumerate(sorted(shared), start=1):
            with self.subTest(status=status):
                # Test Action
                contract = self._store_contract(status, contract_id)

                # Expected Result
                contract.refresh_from_db()
                self.assertEqual(contract.status, status)

    def test_should_move_stored_contract_on_to_later_status(self):
        # Test Data
        self._store_contract("outstanding")

        # Test Action
        contract = self._store_contract("in_progress")

        # Expected Result
        contract.refresh_from_db()
        self.assertEqual(contract.status, Status.IN_PROGRESS)

    @patch(f"{MODEL_PATH}.send_company_notification")
    def test_should_notify_pilots_about_new_outstanding_contract(
        self, mock_notification
    ):
        # Test Data
        self._store_contract("outstanding")

        # Test Action
        Contract.objects._sent_pilot_notifications(rate_limited=False)

        # Expected Result
        mock_notification.assert_called_once_with()
