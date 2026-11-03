"""Tests for the contract notifications."""

# Standard Library
from datetime import timedelta
from unittest.mock import patch

# Django
from django.urls import resolve, reverse
from django.utils import timezone

# AA Fenrir
from aafenrir.helpers.choice import Status
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory
from aafenrir.tests.testdata.fenrir import ContractFactory

MODEL_PATH = "aafenrir.models.fenrir"


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
