"""Tests for the ESI retry of the tasks."""

# Standard Library
from datetime import timedelta
from http import HTTPStatus
from unittest.mock import MagicMock, patch

# Third Party
import pook
from aiopenapi3 import RequestError
from celery.exceptions import Retry

# Django
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone

# Alliance Auth
from esi.exceptions import (
    ESIBucketLimitException,
    ESIErrorLimitException,
    HTTPServerError,
)

# AA Fenrir
from aafenrir import tasks
from aafenrir.errors import DownTimeError
from aafenrir.helpers.choice import Category
from aafenrir.models import Contract, ContractHandler, Location
from aafenrir.providers import DOWNTIME_TIMER
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory
from aafenrir.tests.testdata.fenrir import ContractHandlerFactory, LocationFactory

TASK_PATH = "aafenrir.tasks"
ESI_URL = "https://esi.evetech.net"
ESI_DATE_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
STRUCTURE_ID = 1_000_000_000_001


@override_settings(CELERY_ALWAYS_EAGER=True, CELERY_EAGER_PROPAGATES_EXCEPTIONS=True)
@patch.object(tasks.update_freight_contract, "retry", side_effect=Retry)
class TestUpdateFreightContractEsiErrors(AuthTestCase):
    """ESI errors of the contract update reach `retry_task_on_esi_error`."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        handler_user = UserMainFactory(scopes=ContractHandler.get_esi_scopes())
        cls.handler = ContractHandlerFactory(
            character=handler_user.character_ownerships.get()
        )
        cls.corporation_id = cls.handler.organization.eve_id
        cls.issuer = cls.user.profile.main_character
        cls.location = LocationFactory()

    def setUp(self):
        super().setUp()
        self._clear_esi_limits()
        self.addCleanup(self._clear_esi_limits)
        self.addCleanup(pook.reset)

    def _clear_esi_limits(self):
        cache.delete("esi_error_limit_reset")
        cache.delete(self._bucket_key())

    def _bucket_key(self) -> str:
        character_id = self.handler.character.character.character_id
        return f"esi:bucket:corp-contract:{character_id}"

    def _contracts_url(self) -> str:
        return f"{ESI_URL}/corporations/{self.corporation_id}/contracts"

    def _esi_contract(self, start_location_id: int) -> dict:
        """Return an outstanding courier contract as ESI reports it."""
        date_issued = timezone.now()
        return {
            "acceptor_id": 0,
            "assignee_id": self.corporation_id,
            "availability": "personal",
            "collateral": 1_000_000_000.0,
            "contract_id": 1,
            "date_expired": (date_issued + timedelta(days=7)).strftime(ESI_DATE_FORMAT),
            "date_issued": date_issued.strftime(ESI_DATE_FORMAT),
            "days_to_complete": 3,
            "end_location_id": self.location.id,
            "for_corporation": False,
            "issuer_corporation_id": self.issuer.corporation_id,
            "issuer_id": self.issuer.character_id,
            "reward": 50_000_000.0,
            "start_location_id": start_location_id,
            "status": "outstanding",
            "title": "",
            "type": "courier",
            "volume": 100_000.0,
        }

    def _assert_retried(self, mock_retry, exc_type, countdown_min: float):
        mock_retry.assert_called_once()
        kwargs = mock_retry.call_args.kwargs
        self.assertIsInstance(kwargs["exc"], exc_type)
        self.assertGreaterEqual(kwargs["countdown"], countdown_min)

    def test_should_retry_on_esi_server_errors(self, mock_retry):
        for status_code in [
            HTTPStatus.BAD_GATEWAY,
            HTTPStatus.SERVICE_UNAVAILABLE,
            HTTPStatus.GATEWAY_TIMEOUT,
        ]:
            with self.subTest(status_code=status_code), pook.use():
                # Test Data
                mock_retry.reset_mock()
                pook.get(
                    self._contracts_url(),
                    reply=status_code,
                    response_json={"error": status_code.phrase},
                )

                # Test Action
                with self.assertRaises(Retry):
                    tasks.update_freight_contract(self.corporation_id)

                # Expected Result
                self._assert_retried(mock_retry, HTTPServerError, DOWNTIME_TIMER)

    @pook.on
    def test_should_retry_on_the_esi_error_limit(self, mock_retry):
        # Test Data
        pook.get(
            self._contracts_url(),
            reply=420,
            response_json={"error": "Error limited"},
            response_headers={"X-RateLimit-Reset": "30"},
        )

        # Test Action
        with self.assertRaises(Retry):
            tasks.update_freight_contract(self.corporation_id)

        # Expected Result
        self._assert_retried(mock_retry, ESIErrorLimitException, 30)

    @pook.on
    def test_should_retry_on_the_esi_bucket_limit(self, mock_retry):
        # Test Data: the contract bucket of the handler character is used up
        cache.set(self._bucket_key(), 0, timeout=900)

        # Test Action
        with self.assertRaises(Retry):
            tasks.update_freight_contract(self.corporation_id)

        # Expected Result
        self._assert_retried(mock_retry, ESIBucketLimitException, 1)

    @pook.on
    @patch("esi.app_settings.ESI_SERVER_ERROR_MAX_RETRIES", 1)
    def test_should_retry_on_request_errors(self, mock_retry):
        # Test Data
        pook.get(self._contracts_url()).error(ConnectionError("Connection reset"))

        # Test Action
        with self.assertRaises(Retry):
            tasks.update_freight_contract(self.corporation_id)

        # Expected Result
        self._assert_retried(mock_retry, RequestError, DOWNTIME_TIMER)

    @override_settings(DISABLE_DAILY_DOWNTIME_CHECK=False)
    @patch(TASK_PATH + ".ContractHandler.objects.update_corporation_contract")
    def test_should_retry_during_daily_downtime(self, mock_update, mock_retry):
        # Test Data
        with patch("aafenrir.providers.timezone.now") as mock_now:
            mock_now.return_value = timezone.datetime.strptime("11:05", "%H:%M")

            # Test Action
            with self.assertRaises(Retry):
                tasks.update_freight_contract(self.corporation_id)

        # Expected Result
        self._assert_retried(mock_retry, DownTimeError, DOWNTIME_TIMER)
        mock_update.assert_not_called()

    @pook.on
    def test_should_not_retry_on_other_esi_errors(self, mock_retry):
        # Test Data
        pook.get(
            self._contracts_url(),
            reply=HTTPStatus.INTERNAL_SERVER_ERROR,
            response_json={"error": "Internal Server Error"},
        )

        # Test Action
        with self.assertRaises(HTTPServerError):
            tasks.update_freight_contract(self.corporation_id)

        # Expected Result
        mock_retry.assert_not_called()

    def test_should_retry_instead_of_storing_an_unknown_structure(self, mock_retry):
        for status_code in [
            HTTPStatus.BAD_GATEWAY,
            HTTPStatus.SERVICE_UNAVAILABLE,
            HTTPStatus.GATEWAY_TIMEOUT,
        ]:
            with self.subTest(status_code=status_code), pook.use():
                # Test Data
                mock_retry.reset_mock()
                pook.get(
                    self._contracts_url(),
                    reply=200,
                    response_json=[self._esi_contract(STRUCTURE_ID)],
                )
                pook.get(
                    f"{ESI_URL}/universe/structures/{STRUCTURE_ID}",
                    reply=status_code,
                    response_json={"error": status_code.phrase},
                )

                # Test Action
                with self.assertRaises(Retry):
                    tasks.update_freight_contract(self.corporation_id)

                # Expected Result
                self._assert_retried(mock_retry, HTTPServerError, DOWNTIME_TIMER)
                self.assertFalse(Location.objects.filter(id=STRUCTURE_ID).exists())
                self.assertFalse(Contract.objects.filter(contract_id=1).exists())

    @pook.on
    def test_should_store_an_unknown_structure_without_access(self, mock_retry):
        # Test Data
        pook.get(
            self._contracts_url(),
            reply=200,
            response_json=[self._esi_contract(STRUCTURE_ID)],
        )
        pook.get(
            f"{ESI_URL}/universe/structures/{STRUCTURE_ID}",
            reply=HTTPStatus.FORBIDDEN,
            response_json={"error": "Forbidden"},
        )

        # Test Action
        tasks.update_freight_contract(self.corporation_id)

        # Expected Result
        mock_retry.assert_not_called()
        location = Location.objects.get(id=STRUCTURE_ID)
        self.assertEqual(location.name, f"Unknown structure {STRUCTURE_ID}")
        self.assertEqual(location.category_id, Category.STRUCTURE_ID)
        self.assertTrue(Contract.objects.filter(contract_id=1).exists())

    @patch(TASK_PATH + ".retry_task_on_esi_error")
    @patch(TASK_PATH + ".ContractHandler.objects.update_corporation_contract")
    def test_should_run_the_update_inside_the_retry_context(
        self, mock_update, mock_retry_context, mock_retry
    ):
        # Test Data
        mock_retry_context.return_value.__enter__ = MagicMock()
        mock_retry_context.return_value.__exit__ = MagicMock(return_value=False)

        # Test Action
        tasks.update_freight_contract(self.corporation_id, force_refresh=True)

        # Expected Result
        mock_retry_context.assert_called_once()
        mock_retry_context.return_value.__enter__.assert_called_once()
        mock_update.assert_called_once_with(self.corporation_id, force_refresh=True)
        mock_retry.assert_not_called()
