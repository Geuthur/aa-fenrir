"""Tests for the contract manager."""

# Standard Library
import json
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

# Third Party
import pook
from evesde_factory.allianceauth import EveCharacterFactory

# Django
from django.test import TestCase
from django.utils import timezone

# AA Fenrir
import aafenrir
from aafenrir.helpers.choice import Status
from aafenrir.models import Contract, ContractCustomerNotification, ContractHandler
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory
from aafenrir.tests.testdata.fenrir import ContractHandlerFactory, LocationFactory

MODEL_PATH = "aafenrir.models.fenrir"
ESI_URL = "https://esi.evetech.net"
ESI_DATE_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
OPENAPI_PATH = Path(aafenrir.__file__).parent / "openapi_2026-08-18.json"
OPENAPI_SPEC = json.loads(OPENAPI_PATH.read_text(encoding="utf-8"))
ESI_STATUS = OPENAPI_SPEC["components"]["schemas"][
    "CorporationsCorporationIdContractsGet"
]["items"]["properties"]["status"]["enum"]


class TestStatusChoices(TestCase):
    def test_should_match_status_values_of_esi(self):
        self.assertCountEqual(Status.values, ESI_STATUS)


class TestUpdateCorporationContract(AuthTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        handler_user = UserMainFactory(scopes=ContractHandler.get_esi_scopes())
        cls.handler = ContractHandlerFactory(
            character=handler_user.character_ownerships.get()
        )
        cls.issuer = cls.user.profile.main_character
        cls.location = LocationFactory()

    def setUp(self):
        # The ESI client loads its spec once per process, on the first request
        pook.get(
            f"{ESI_URL}/meta/openapi.json", reply=200, response_json=OPENAPI_SPEC
        ).persist()
        self.addCleanup(pook.reset)

    def _esi_contract(self, status: str, contract_id: int = 1, **kwargs) -> dict:
        """Return a contract as ESI reports it."""
        date_issued = timezone.now()
        return {
            "acceptor_id": 0,
            "assignee_id": self.handler.organization.eve_id,
            "availability": "personal",
            "collateral": 1_000_000_000.0,
            "contract_id": contract_id,
            "date_expired": (date_issued + timedelta(days=7)).strftime(ESI_DATE_FORMAT),
            "date_issued": date_issued.strftime(ESI_DATE_FORMAT),
            "days_to_complete": 3,
            "end_location_id": self.location.id,
            "for_corporation": False,
            "issuer_corporation_id": self.issuer.corporation_id,
            "issuer_id": self.issuer.character_id,
            "reward": 50_000_000.0,
            "start_location_id": self.location.id,
            "status": status,
            "title": "",
            "type": "courier",
            "volume": 100_000.0,
            **kwargs,
        }

    def _update_contracts(self, *contracts: dict) -> None:
        """Update the contracts of the handler, with ESI reporting the given ones."""
        corporation_id = self.handler.organization.eve_id
        pook.get(
            f"{ESI_URL}/corporations/{corporation_id}/contracts",
            reply=200,
            response_json=list(contracts),
        )
        ContractHandler.objects.update_corporation_contract(corporation_id)

    @pook.on
    def test_should_store_every_status_from_esi(self):
        # Test Action
        self._update_contracts(
            *(
                self._esi_contract(status, contract_id)
                for contract_id, status in enumerate(ESI_STATUS, start=1)
            )
        )

        # Expected Result
        for contract_id, status in enumerate(ESI_STATUS, start=1):
            with self.subTest(status=status):
                contract = Contract.objects.get(contract_id=contract_id)
                self.assertEqual(contract.status, status)
                self.assertTrue(contract.get_status_display())

    @pook.on
    def test_should_count_outstanding_contract_as_pending(self):
        # Test Action
        self._update_contracts(self._esi_contract("outstanding"))

        # Expected Result
        self.assertEqual(Contract.objects.get().status, Status.OUTSTANDING)
        self.assertEqual(Contract.objects.pending_count(), 1)

    @pook.on
    def test_should_count_cancelled_contract_as_completed(self):
        # Test Action
        self._update_contracts(self._esi_contract("cancelled"))

        # Expected Result
        contract = Contract.objects.get()
        self.assertEqual(contract.status, Status.CANCELLED)
        self.assertTrue(contract.is_completed)
        self.assertFalse(Contract.objects.filter_not_completed().exists())

    @pook.on
    def test_should_move_stored_contract_on_to_in_progress(self):
        # Test Data
        acceptor = EveCharacterFactory()
        pook.post(
            f"{ESI_URL}/universe/names",
            reply=200,
            response_json=[
                {
                    "category": "character",
                    "id": acceptor.character_id,
                    "name": acceptor.character_name,
                }
            ],
        )
        self._update_contracts(self._esi_contract("outstanding"))

        # Test Action
        self._update_contracts(
            self._esi_contract("in_progress", acceptor_id=acceptor.character_id)
        )

        # Expected Result
        contract = Contract.objects.get()
        self.assertEqual(contract.status, Status.IN_PROGRESS)
        self.assertEqual(contract.acceptor, acceptor)
        self.assertEqual(
            contract.acceptor_corporation.corporation_id, acceptor.corporation_id
        )

    @pook.on
    @patch(f"{MODEL_PATH}.send_user_notification")
    def test_should_notify_pilots_and_customer_about_new_outstanding_contract(
        self, mock_notification
    ):
        # Test Data
        self._update_contracts(self._esi_contract("outstanding"))

        # Test Action
        Contract.objects.send_notifications(rate_limited=False)

        # Expected Result
        notified_users = [
            call.kwargs["user_id"] for call in mock_notification.delay.call_args_list
        ]
        self.assertCountEqual(notified_users, [self.superuser.id, self.user.id])
        contract = Contract.objects.get()
        self.assertIsNotNone(contract.date_notified)
        self.assertTrue(
            ContractCustomerNotification.objects.filter(
                contract=contract, status=Status.OUTSTANDING
            ).exists()
        )
