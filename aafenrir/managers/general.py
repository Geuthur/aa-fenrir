"""Permission rules of the app."""

# Django
from django.contrib.auth.models import Permission as AuthPermission
from django.db import models
from django.db.models import Q, QuerySet

# Alliance Auth
from allianceauth.authentication.models import User


class GeneralManager(models.Manager):
    """
    Manager of `General` for the app's own permission rules.

    The API, hooks and helpers check permissions only through this manager. The
    Django views keep `@permission_required("aafenrir.basic_access")`.
    `General` is not managed, so these methods never query `General`.
    """

    @staticmethod
    def has_basic_access(user) -> bool:
        """Users with `basic_access` may use the app."""
        return bool(user.has_perm("aafenrir.basic_access"))

    @staticmethod
    def has_management_access(user) -> bool:
        """Users with `manage_access` or `full_access` may manage routes."""
        return bool(
            user.has_perm("aafenrir.manage_access")
            or user.has_perm("aafenrir.full_access")
        )

    @staticmethod
    def has_admin_access(user) -> bool:
        """Users with `full_access` may use the Administration."""
        return bool(user.has_perm("aafenrir.full_access"))

    @staticmethod
    def users_with_any_perm(*codenames: str) -> QuerySet:
        """Return all active users with any of the given permission codenames.

        The counterpart of `has_perm` as one database query on `User`.
        Permissions can come from the user, one of their groups or their
        state. Superusers are included, as `has_perm` is always True for them.
        """
        permissions = AuthPermission.objects.filter(
            content_type__app_label="aafenrir", codename__in=codenames
        )
        return (
            User.objects.filter(is_active=True)
            .filter(
                Q(is_superuser=True)
                | Q(user_permissions__in=permissions)
                | Q(groups__permissions__in=permissions)
                | Q(profile__state__permissions__in=permissions)
            )
            .distinct()
        )

    @classmethod
    def users_with_management_access(cls) -> QuerySet:
        """Return all users who may manage routes (manage or full access)."""
        return cls.users_with_any_perm("manage_access", "full_access")
