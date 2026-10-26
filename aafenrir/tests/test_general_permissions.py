"""Tests for the central permission logic in the General model."""

# AA Fenrir
from aafenrir.models.general import General
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory


class TestGeneralPermissions(AuthTestCase):
    def test_get_perm_should_return_full_permission_string(self):
        # Test Data
        perm = General.Permission.FULL_ACCESS

        # Test Action
        result = General.get_perm(perm)

        # Expected Result
        self.assertEqual(result, "aafenrir.full_access")

    def test_has_basic_access_should_be_true_for_default_user(self):
        # Test Data / Test Action / Expected Result
        self.assertTrue(General.has_basic_access(self.user))

    def test_has_management_access_should_accept_manage_and_full_access(self):
        # Test Data
        manager = UserMainFactory(permissions__=["aafenrir.manage_access"])
        admin = UserMainFactory(permissions__=["aafenrir.full_access"])

        # Test Action / Expected Result
        self.assertTrue(General.has_management_access(manager))
        self.assertTrue(General.has_management_access(admin))
        self.assertFalse(General.has_management_access(self.user))

    def test_has_admin_access_should_require_full_access(self):
        # Test Data
        manager = UserMainFactory(permissions__=["aafenrir.manage_access"])
        admin = UserMainFactory(permissions__=["aafenrir.full_access"])

        # Test Action / Expected Result
        self.assertTrue(General.has_admin_access(admin))
        self.assertTrue(General.has_admin_access(self.superuser))
        self.assertFalse(General.has_admin_access(manager))
        self.assertFalse(General.has_admin_access(self.user))

    def test_has_perm_should_return_false_without_user(self):
        # Test Data / Test Action / Expected Result
        self.assertFalse(General.has_perm(None, General.Permission.BASIC_ACCESS))
        self.assertFalse(General.has_any_perm(None, General.Permission.BASIC_ACCESS))
