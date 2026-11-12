"""Models for General."""

# Standard Library
import uuid

# Django
from django.db import models
from django.utils.translation import gettext_lazy as _

# Alliance Auth
from allianceauth.authentication.models import User

# AA Fenrir
from aafenrir.managers.general import GeneralManager


def generate_unique_string(length=12):
    """Generate a unique String"""
    unique_id = str(uuid.uuid4())
    unique_id = unique_id.replace("-", "")
    return unique_id[:length]


class General(models.Model):
    """A model defining the permissions of AA Fenrir.

    Permissions are checked with Django and the full string, e.g.
    `@permission_required("aafenrir.basic_access")` or
    `user.has_perm("aafenrir.basic_access")`.
    """

    objects = GeneralManager()

    class Meta:
        managed = False
        verbose_name = "AA-Fenrir"
        verbose_name_plural = "AA-Fenrir"
        default_permissions = ()  # Remove standard permissions
        permissions = (
            ("basic_access", _("Can access this app")),
            ("manage_access", _("Can manage")),
            ("full_access", _("Full access")),
        )


class UserSettings(models.Model):
    class Meta:
        default_permissions = ()  # Remove standard permissions

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="+",
    )

    disable_notifications = models.BooleanField(default=False)
    quick_select_presets = models.JSONField(default=list, blank=True)
