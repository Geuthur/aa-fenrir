# Django
from django.db import models
from django.utils.translation import gettext_lazy as _


class Category(models.IntegerChoices):
    """A location category."""

    STATION_ID = 3, "station"
    STRUCTURE_ID = 65, "structure"
    UNKNOWN_ID = 0, "(unknown)"


class EveType(models.TextChoices):
    """An Eve type category."""

    CHARACTER = "character", _("Character")
    CORPORATION = "corporation", _("Corporation")
    ALLIANCE = "alliance", _("Alliance")


class Status(models.TextChoices):
    """A contract status."""

    PENDING = "pending", _("Pending")
    IN_PROGRESS = "in_progress", _("In Progress")
    FINISHED_ISSUER = "finished_issuer", _("Finished Issuer")
    FINISHED_CONTRACTOR = "finished_contractor", _("Finished Contractor")
    FINISHED = "finished", _("Finished")
    CANCELED = "canceled", _("Canceled")
    REJECTED = "rejected", _("Rejected")
    FAILED = "failed", _("Failed")
    DELETED = "deleted", _("Deleted")
    REVERSED = "reversed", _("Reversed")

    @classmethod
    def completed(cls) -> set["Status"]:
        """Return status representing a completed contract."""
        return {
            cls.FINISHED_ISSUER,
            cls.FINISHED_CONTRACTOR,
            cls.FINISHED_ISSUER,
            cls.CANCELED,
            cls.REJECTED,
            cls.DELETED,
            cls.FINISHED,
            cls.FAILED,
        }

    @classmethod
    def for_customer_notification(cls) -> set["Status"]:
        """Return status relevant for custom notification."""
        return {cls.PENDING, cls.IN_PROGRESS, cls.FINISHED, cls.FAILED}


class ServiceType(models.TextChoices):
    """A service type category."""

    JUMPFREIGHTER = "jumpfreighter", _("Jumpfreighter")
    DEEP_SPACE_TRANSPORT = "deep_space_transport", _("Deep Space Transport")
    FREIGHTER = "freighter", _("Freighter")


class DangerLevel(models.TextChoices):
    """A danger level category."""

    SAFE = "safe", _("Safe")
    CYNO_GUARDED = "cyno_guarded", _("Cyno Guarded")
