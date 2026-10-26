"""Models for General."""

# Standard Library
import uuid
from typing import Any

# Django
from django.db import models
from django.utils.translation import gettext_lazy as _

# Alliance Auth
from allianceauth.authentication.models import User


def generate_unique_string(length=12):
    """Generate a unique String"""
    unique_id = str(uuid.uuid4())
    unique_id = unique_id.replace("-", "")
    return unique_id[:length]


class General(models.Model):
    """General model for app permissions"""

    class Permission(models.TextChoices):
        """Permissions of this app."""

        BASIC_ACCESS = "basic_access", _("Can access this app")
        MANAGE_ACCESS = "manage_access", _("Can manage")
        FULL_ACCESS = "full_access", _("Full access")

    class Meta:
        managed = False
        verbose_name = "AA-Fenrir"
        verbose_name_plural = "AA-Fenrir"
        default_permissions = ()  # Remove standard permissions

    # Inject dynamic permissions
    Meta.permissions = tuple(Permission.choices)

    @classmethod
    def get_perm(cls, perm: "str | General.Permission") -> str:
        """Return the full permission string 'aafenrir.<codename>'."""
        codename = perm.value if isinstance(perm, cls.Permission) else perm
        return f"aafenrir.{codename}"

    @classmethod
    def has_perm(cls, user: Any, perm: "str | General.Permission") -> bool:
        """Return True if the user has the permission."""
        if not user or not hasattr(user, "has_perm"):
            return False
        return user.has_perm(cls.get_perm(perm))

    @classmethod
    def has_any_perm(cls, user: Any, *perms: "str | General.Permission") -> bool:
        """Return True if the user has any of the given permissions."""
        if not user or not hasattr(user, "has_perm"):
            return False
        return any(user.has_perm(cls.get_perm(perm)) for perm in perms)

    @classmethod
    def has_basic_access(cls, user: Any) -> bool:
        """Return True if the user may use the app."""
        return cls.has_perm(user, cls.Permission.BASIC_ACCESS)

    @classmethod
    def has_management_access(cls, user: Any) -> bool:
        """Return True if the user may manage routes (manage or full access)."""
        return cls.has_any_perm(
            user, cls.Permission.MANAGE_ACCESS, cls.Permission.FULL_ACCESS
        )

    @classmethod
    def has_admin_access(cls, user: Any) -> bool:
        """Return True if the user may use the Administration (full access)."""
        return cls.has_perm(user, cls.Permission.FULL_ACCESS)


class UserSettings(models.Model):
    class Meta:
        default_permissions = ()  # Remove standard permissions

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="+",
        null=True,
        blank=True,
    )

    disable_notifications = models.BooleanField(default=False)
    quick_select_presets = models.JSONField(default=list, blank=True)
