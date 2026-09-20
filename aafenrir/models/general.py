"""Models for General."""

# Standard Library
import uuid

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

    class Meta:
        managed = False
        verbose_name = "AA-Fenrir"
        verbose_name_plural = "AA-Fenrir"
        permissions = (
            ("basic_access", _("Can access this app")),
            ("manage_access", _("Can manage")),
            ("full_access", _("Full access")),
        )
        default_permissions = ()  # Remove standard permissions


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
