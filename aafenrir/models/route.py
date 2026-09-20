"""Models for General."""

# Standard Library
import uuid

# Django
from django.db import models
from django.utils.translation import gettext_lazy as _

# Alliance Auth (External Libs)
from eve_sde.models import SolarSystem

# AA Fenrir
from aafenrir.helpers.choice import DangerLevel, ServiceType


def generate_unique_string(length=12):
    """Generate a unique String"""
    unique_id = str(uuid.uuid4())
    unique_id = unique_id.replace("-", "")
    return unique_id[:length]


class RouteSystem(models.Model):
    """Route model for app routes"""

    system = models.ForeignKey(
        SolarSystem,
        on_delete=models.CASCADE,
        related_name="+",
    )

    class Meta:
        default_permissions = ()  # Remove standard permissions

    def __str__(self):
        return f"{self.system.name}"


class RoutePreset(models.Model):
    """Route Preset model for predefined routes"""

    class Meta:
        default_permissions = ()  # Remove standard permissions

    def __str__(self):
        return self.name

    name = models.CharField(max_length=100)

    origin_system = models.ForeignKey(
        SolarSystem,
        on_delete=models.CASCADE,
        related_name="+",
    )
    origin_system_station = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        default=_("N/A"),
    )

    destination_system = models.ForeignKey(
        SolarSystem,
        on_delete=models.CASCADE,
        related_name="+",
    )
    destination_system_station = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        default=_("N/A"),
    )

    service_type = models.CharField(
        max_length=100,
        choices=ServiceType.choices,
        default=_("N/A"),
        help_text=_("Type of service for the route"),
    )

    max_volume = models.IntegerField(
        default=0,
        help_text=_("Maximum volume for the route"),
    )

    max_collateral = models.BigIntegerField(
        default=0,
        help_text=_("Maximum collateral for the route"),
    )

    base_fee = models.IntegerField(
        default=5_000_000,
        help_text=_("Base fee for the route"),
    )

    fee_per_m3 = models.IntegerField(
        default=0,
        help_text=_("Fee per cubic meter for the route"),
    )

    fee_per_ly = models.DecimalField(
        max_digits=20,
        decimal_places=0,
        default=0,
        help_text=_("Fee per light-year for the route"),
    )

    collateral_percent = models.IntegerField(
        default=0,
        help_text=_("Collateral percentage for the route"),
    )

    min_reward = models.IntegerField(
        default=0,
        help_text=_("Minimum reward for the route"),
    )

    estimated_time = models.IntegerField(
        default=0,
        help_text=_("Estimated time for the route in minutes"),
    )
    is_cyno_route = models.BooleanField(
        default=False,
        help_text=_("Indicates if the route is a cyno route"),
    )

    cyno_waypoints = models.ManyToManyField(
        SolarSystem,
        related_name="+",
        blank=True,
        help_text=_("Cyno waypoints for the route"),
    )

    danger_level = models.CharField(
        max_length=100,
        choices=DangerLevel.choices,
        default=_("N/A"),
        help_text=_("Danger level for the route"),
    )

    has_alliance_subsidy = models.BooleanField(
        default=True,
        help_text=_("Indicates if alliance subsidy is enabled for this route"),
    )
