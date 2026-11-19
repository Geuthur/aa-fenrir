"""Tests for the contract notifications."""

# Standard Library
from datetime import timedelta
from unittest.mock import patch

# Django
from django.urls import resolve, reverse
from django.utils import timezone

# AA Fenrir
from aafenrir.helpers.choice import Status
from aafenrir.models import UserSettings
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory
from aafenrir.tests.testdata.fenrir import ContractFactory
from aafenrir.thirdparty.discord import send_user_notification

MODEL_PATH = "aafenrir.models.fenrir"
DISCORD_PATH = "aafenrir.thirdparty.discord"


class TestSendCompanyNotification(AuthTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.admin = UserMainFactory(permissions__=["aafenrir.full_access"])

    @patch(f"{MODEL_PATH}.send_user_notification")
    def test_should_notify_admin_with_link_to_contract_queue(self, mock_notification):
        # Test Data
        contract = ContractFactory(
            status=Status.OUTSTANDING,
            date_notified=None,
            date_expired=timezone.now() + timedelta(days=1),
        )
        queue_path = f"{reverse('aafenrir:index')}queue/"

        # Test Action
        contract.send_company_notification()

        # Expected Result
        calls = {
            call.kwargs["user_id"]: call.kwargs["message"]
            for call in mock_notification.delay.call_args_list
        }
        self.assertIn(f"{queue_path})", calls[self.admin.id])
        self.assertNotIn(self.user.id, calls)
        self.assertEqual(resolve(queue_path).url_name, "react_base")
        contract.refresh_from_db()
        self.assertIsNotNone(contract.date_notified)


@patch(f"{DISCORD_PATH}.notify")
@patch(f"{MODEL_PATH}.send_user_notification.delay", new=send_user_notification)
class TestDisabledNotifications(AuthTestCase):
    """Customer and pilot notifications run through the real task.

    The cases of the setting itself are covered in ``test_discord.py``.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.admin = UserMainFactory(permissions__=["aafenrir.full_access"])

    def _notified_users(self, mock_notify) -> list[int]:
        return [call.kwargs["user"].id for call in mock_notify.info.call_args_list]

    def _customer_contract(self):
        return ContractFactory(
            status=Status.OUTSTANDING,
            issuer=self.user.profile.main_character,
        )

    def _pilot_contract(self):
        return ContractFactory(
            status=Status.OUTSTANDING,
            date_notified=None,
            date_expired=timezone.now() + timedelta(days=1),
        )

    def test_should_not_notify_customer_with_disabled_notifications(self, mock_notify):
        # Test Data
        UserSettings.objects.create(user=self.user, disable_notifications=True)
        contract = self._customer_contract()

        # Test Action
        contract._report_to_customer(Status.OUTSTANDING)

        # Expected Result
        self.assertEqual(self._notified_users(mock_notify), [])

    def test_should_notify_customer_without_user_settings(self, mock_notify):
        # Test Data
        contract = self._customer_contract()

        # Test Action
        contract._report_to_customer(Status.OUTSTANDING)

        # Expected Result
        self.assertEqual(self._notified_users(mock_notify), [self.user.id])

    def test_should_not_notify_pilot_with_disabled_notifications(self, mock_notify):
        # Test Data
        UserSettings.objects.create(user=self.admin, disable_notifications=True)
        contract = self._pilot_contract()

        # Test Action
        contract.send_company_notification()

        # Expected Result
        self.assertNotIn(self.admin.id, self._notified_users(mock_notify))
        self.assertIn(self.superuser.id, self._notified_users(mock_notify))
