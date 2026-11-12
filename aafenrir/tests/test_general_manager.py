"""Tests for the permission rules of the GeneralManager."""

# Django
from django.contrib.auth.models import Group, Permission

# AA Fenrir
from aafenrir.managers.general import GeneralManager
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory


class TestGeneralManager(AuthTestCase):
    def test_has_basic_access_should_be_true_for_default_user(self):
        # Test Data / Test Action / Expected Result
        self.assertTrue(GeneralManager.has_basic_access(self.user))

    def test_has_management_access_should_accept_manage_and_full_access(self):
        # Test Data
        manager = UserMainFactory(permissions__=["aafenrir.manage_access"])
        admin = UserMainFactory(permissions__=["aafenrir.full_access"])

        # Test Action / Expected Result
        self.assertTrue(GeneralManager.has_management_access(manager))
        self.assertTrue(GeneralManager.has_management_access(admin))
        self.assertFalse(GeneralManager.has_management_access(self.user))

    def test_users_with_management_access_should_list_manage_and_full_access(self):
        # Test Data
        manager = UserMainFactory(permissions__=["aafenrir.manage_access"])
        admin = UserMainFactory(permissions__=["aafenrir.full_access"])
        inactive = UserMainFactory(permissions__=["aafenrir.manage_access"])
        inactive.is_active = False
        inactive.save()

        # Test Action
        result = set(GeneralManager.users_with_management_access())

        # Expected Result
        self.assertEqual(result, {manager, admin, self.superuser})

    def test_users_with_any_perm_should_include_permission_from_group(self):
        # Test Data
        group = Group.objects.create(name="Route Admins")
        group.permissions.add(
            Permission.objects.get(
                content_type__app_label="aafenrir", codename="full_access"
            )
        )
        member = UserMainFactory()
        member.groups.add(group)

        # Test Action
        result = GeneralManager.users_with_any_perm("full_access")

        # Expected Result
        self.assertIn(member, result)
        self.assertNotIn(self.user, result)

    def test_has_admin_access_should_require_full_access(self):
        # Test Data
        manager = UserMainFactory(permissions__=["aafenrir.manage_access"])
        admin = UserMainFactory(permissions__=["aafenrir.full_access"])

        # Test Action / Expected Result
        self.assertTrue(GeneralManager.has_admin_access(admin))
        self.assertTrue(GeneralManager.has_admin_access(self.superuser))
        self.assertFalse(GeneralManager.has_admin_access(manager))
        self.assertFalse(GeneralManager.has_admin_access(self.user))

    def test_users_with_any_perm_should_exclude_inactive_users(self):
        # Test Data
        inactive = UserMainFactory(permissions__=["aafenrir.full_access"])
        inactive.is_active = False
        inactive.save()

        # Test Action
        result = GeneralManager.users_with_any_perm("full_access")

        # Expected Result
        self.assertNotIn(inactive, result)
