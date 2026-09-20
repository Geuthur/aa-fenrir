# Standard Library
import re
from datetime import timedelta
from typing import TYPE_CHECKING
from urllib.parse import urljoin

# Django
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.urls import reverse
from django.utils import timezone
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _

# Alliance Auth
from allianceauth.authentication.models import CharacterOwnership, User
from allianceauth.eveonline.models import (
    EveAllianceInfo,
    EveCharacter,
    EveCorporationInfo,
)
from allianceauth.services.hooks import get_extension_logger
from esi.errors import TokenError
from esi.models import Token

# AA Fenrir
from aafenrir import __title__
from aafenrir.helpers.choice import Category, EveType, Status
from aafenrir.managers import (
    ContractHandlerManager,
    ContractManager,
    EveEntityManager,
    LocationManager,
)
from aafenrir.providers import AppLogger
from aafenrir.thirdparty.discord import send_user_notification

logger = AppLogger(get_extension_logger(__name__), __title__)

DATETIME_FORMAT = "%Y-%m-%d %H:%M"


# TODO: Only enable for alliance auth
# old: get_site_base_url
def site_absolute_url() -> str:
    """Return absolute URL for this Alliance Auth site."""
    try:
        match = re.match(r"(.+)\/sso\/callback", settings.ESI_SSO_CALLBACK_URL)
        if match:
            return match.group(1)
    except AttributeError:
        pass

    return ""


def humanize_number(value, magnitude: str | None = None, precision: int = 1) -> str:
    """Return the value in humanized format, e.g. `1234` becomes `1.2k`

    Args:
        magnitude: fix the magnitude to format the number, e.g. `"b"`
        precision: number of digits to round for
    """
    value = float(value)
    power_map = {"t": 12, "b": 9, "m": 6, "k": 3, "": 0}
    if magnitude not in power_map:
        if value >= 10**12:
            magnitude = "t"
        elif value >= 10**9:
            magnitude = "b"
        elif value >= 10**6:
            magnitude = "m"
        elif value >= 10**3:
            magnitude = "k"
        else:
            magnitude = ""
    return f"{value / 10 ** power_map[magnitude]:,.{precision}f}{magnitude}"


class ContractHandler(models.Model):
    """Handler for syncing of contracts belonging to an alliance or corporation."""

    if TYPE_CHECKING:
        aafenrir_contracts: ContractManager

    objects: ContractHandlerManager = ContractHandlerManager()

    class Meta:
        verbose_name = _("contract handler")
        verbose_name_plural = _("contract handler")
        default_permissions = ()

    organization = models.OneToOneField(
        "EveEntity",
        on_delete=models.CASCADE,
        primary_key=True,
        verbose_name=_("organization"),
    )
    character = models.ForeignKey(
        CharacterOwnership,
        on_delete=models.SET_DEFAULT,
        default=None,
        null=True,
        verbose_name=_("Character"),
        related_name="+",
        help_text=_("Character used for syncing contracts"),
    )
    version_hash = models.CharField(
        max_length=32,
        null=True,
        default=None,
        blank=True,
        verbose_name=_("version hash"),
        help_text=_("hash to identify changes to contracts"),
    )
    last_sync = models.DateTimeField(
        null=True,
        default=None,
        blank=True,
        verbose_name=_("last sync at"),
        help_text=_("when the last sync happened"),
    )

    def __str__(self):
        return str(self.organization.name)

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}(pk={self.pk}, "
            f"organization='{self.organization.name}')"
        )

    @classmethod
    def get_esi_scopes(cls) -> list[str]:
        """Return list of required ESI scopes to fetch contracts."""
        return [
            "esi-contracts.read_corporation_contracts.v1",
            "esi-universe.read_structures.v1",
        ]

    @property
    def is_sync_ok(self) -> bool:
        """returns true if they have been no errors
        and last syncing occurred within alloted time
        """
        grace_deadline = now() - timedelta(minutes=90)
        return self.last_sync and self.last_sync > grace_deadline

    def token(self) -> Token:
        """Returns an valid esi token for the contract handler.

        Raises exception on any error
        """
        token = (
            Token.objects.filter(
                user=self.character.user,
                character_id=self.character.character.character_id,
            )
            .require_scopes(self.get_esi_scopes())
            .require_valid()
            .first()
        )
        if not token:
            raise TokenError(f"{self}: No valid token found")

        return token


class EveEntity(models.Model):
    """An Eve entity like a corporation or a character"""

    objects: EveEntityManager = EveEntityManager()

    class Meta:
        default_permissions = ()

    eve_id = models.IntegerField(
        primary_key=True, validators=[MinValueValidator(0)], verbose_name=_("ID")
    )
    category = models.CharField(
        max_length=32, choices=Category.choices, verbose_name=_("Category")
    )
    name = models.CharField(max_length=254, verbose_name=_("Name"))

    # optionals for character/corp
    corporation = models.ForeignKey(
        "EveEntity",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        related_name="corp",
    )
    alliance = models.ForeignKey(
        "EveEntity",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
        related_name="alli",
    )
    last_update = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}(id={self.id}, category='{self.category}', "
            f"name='{self.name}')"
        )

    @property
    def is_alliance(self) -> bool:
        """Return True if entity is an alliance, else False."""
        return self.category == EveType.ALLIANCE

    @property
    def is_corporation(self) -> bool:
        """Return True if entity is an corporation, else False."""
        return self.category == EveType.CORPORATION

    @property
    def is_character(self) -> bool:
        """Return True if entity is a character, else False."""
        return self.category == EveType.CHARACTER

    def icon_url(self, size=128) -> str:
        """Url to an icon image for this organization."""
        if self.category == EveType.ALLIANCE:
            return EveAllianceInfo.generic_logo_url(self.id, size=size)

        if self.category == EveType.CORPORATION:
            return EveCorporationInfo.generic_logo_url(self.id, size=size)

        if self.category == EveType.CHARACTER:
            return EveCharacter.generic_portrait_url(self.id, size=size)

        raise NotImplementedError(
            f"Avatar URL not implemented for category {self.category}"
        )

    def needs_update(self):
        return self.last_update + timedelta(days=7) < timezone.now()


class Location(models.Model):
    """An Eve Online courier contract location: station or Upwell structure"""

    objects: LocationManager = LocationManager()

    class Meta:
        verbose_name = _("Location")
        verbose_name_plural = _("Locations")
        default_permissions = ()

    id = models.BigIntegerField(
        primary_key=True,
        validators=[MinValueValidator(0)],
        verbose_name=_("ID"),
        help_text="Eve Online location ID, "
        "either item ID for stations or structure ID for structures",
    )

    category_id = models.PositiveIntegerField(
        choices=Category.choices,
        default=Category.UNKNOWN_ID,
        help_text="Eve Online category ID",
    )

    name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name=_("Name"),
        help_text="In-game name of this station or structure",
    )

    solar_system_id = models.PositiveIntegerField(
        default=None, null=True, blank=True, help_text="Eve Online solar system ID"
    )

    type_id = models.PositiveIntegerField(
        default=None, null=True, blank=True, help_text="Eve Online type ID"
    )

    def __str__(self):
        return self.name

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(pk={self.pk}, name='{self.name}')"

    @property
    def category(self):
        """Return category ID for this location."""
        return self.category_id

    @property
    def solar_system_name(self):
        """Return solar system name for this location.."""
        return self.name.split(" ", 1)[0]

    @property
    def location_name(self):
        """Return name of this location."""
        return self.name.rsplit("-", 1)[1].strip()

    @classmethod
    def get_esi_scopes(cls):
        """Return ESI scopes required to fetch this data."""
        return ["esi-universe.read_structures.v1"]


class Contract(models.Model):
    """An Eve Online courier contract with additional meta data"""

    if TYPE_CHECKING:
        # AA Fenrir
        # pylint: disable=import-outside-toplevel
        from aafenrir.models import ContractCustomerNotification

        aafenrir_notifications: models.QuerySet["ContractCustomerNotification"]
        aafenrir_contracts: ContractManager

    objects: ContractManager = ContractManager()

    class Meta:
        indexes = [models.Index(fields=["status"])]
        unique_together = (("handler", "contract_id"),)
        verbose_name = _("Contract")
        verbose_name_plural = _("Contracts")
        default_permissions = ()

    EMBED_COLOR_GREEN = 0x008000

    handler = models.ForeignKey(
        ContractHandler, on_delete=models.CASCADE, related_name="aafenrir_contracts"
    )

    contract_id = models.IntegerField(verbose_name=_("Contract ID"))

    acceptor = models.ForeignKey(
        EveCharacter,
        on_delete=models.CASCADE,
        default=None,
        null=True,
        blank=True,
        verbose_name=_("Acceptor"),
        related_name="contracts_acceptor",
        help_text=_("Character of acceptor or None if accepted by corp"),
    )

    acceptor_corporation = models.ForeignKey(
        EveCorporationInfo,
        on_delete=models.CASCADE,
        default=None,
        null=True,
        blank=True,
        verbose_name=_("Acceptor Corporation"),
        related_name="contracts_acceptor_corporation",
        help_text=_("Corporation of acceptor"),
    )

    collateral = models.FloatField(verbose_name=_("Collateral"))
    date_accepted = models.DateTimeField(
        default=None,
        null=True,
        blank=True,
        verbose_name=_("Date Accepted"),
    )

    date_completed = models.DateTimeField(
        default=None,
        null=True,
        blank=True,
        verbose_name=_("Date Completed"),
    )

    date_expired = models.DateTimeField(verbose_name=_("Date Expired"))
    date_issued = models.DateTimeField(
        verbose_name=_("Date Issued"),
    )

    date_notified = models.DateTimeField(
        default=None,
        null=True,
        blank=True,
        db_index=True,
        verbose_name=_("Date Notified"),
        help_text=_("Datetime of latest notification, None = none has been sent"),
    )

    days_to_complete = models.IntegerField(
        verbose_name=_("Days to Complete"),
    )

    end_location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        verbose_name=_("End Location"),
        related_name="contracts_end_location",
    )

    for_corporation = models.BooleanField(verbose_name=_("For Corporation"))
    issuer_corporation = models.ForeignKey(
        EveCorporationInfo,
        on_delete=models.CASCADE,
        verbose_name=_("Issuer Corporation"),
        related_name="contracts_issuer_corporation",
    )

    issuer = models.ForeignKey(
        EveCharacter,
        on_delete=models.CASCADE,
        verbose_name=_("Issuer"),
        related_name="contracts_issuer",
    )

    reward = models.FloatField(verbose_name=_("Reward"))

    start_location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        verbose_name=_("Start Location"),
        related_name="contracts_start_location",
    )

    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        db_index=True,
        verbose_name=_("Status"),
    )

    title = models.CharField(
        max_length=100,
        default=None,
        null=True,
        blank=True,
        verbose_name=_("title"),
    )

    volume = models.FloatField(verbose_name=_("Volume"))

    def __str__(self) -> str:
        return (
            f"{self.contract_id}: {self.start_location.solar_system_name} "
            f"-> {self.end_location.solar_system_name}"
        )

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}(contract_id={self.contract_id}, "
            f"start_location={self.start_location.solar_system_name}, "
            f"end_location={self.end_location.solar_system_name})"
        )

    @property
    def is_completed(self) -> bool:
        """whether this contract is completed or active"""
        return self.status in self.Status.completed()

    @property
    def is_in_progress(self) -> bool:
        """Return True if this contract is in progress, else False."""
        return self.status == self.Status.IN_PROGRESS

    @property
    def is_failed(self) -> bool:
        """Return True if this contract is failed, else False."""
        return self.status == self.Status.FAILED

    @property
    def has_expired(self) -> bool:
        """returns true if this contract is expired"""
        return self.date_expired < now()

    @property
    def date_latest(self) -> bool:
        """latest status related date of this contract"""
        if self.date_completed:
            date = self.date_completed
        elif self.date_accepted:
            date = self.date_accepted
        else:
            date = self.date_issued

        return date

    @property
    def has_stale_status(self) -> bool:
        """whether the status of this contract has become stale"""
        return self.date_latest < now() - timedelta(hours=24)

    @property
    def acceptor_name(self) -> str | None:
        "returns the name of the acceptor character or corporation or None"
        try:
            if self.acceptor:
                return self.acceptor.character_name
        except models.ObjectDoesNotExist:
            pass
        try:
            if self.acceptor_corporation:
                return self.acceptor_corporation.corporation_name
        except models.ObjectDoesNotExist:
            pass
        return None

    @property
    def issuer_name(self) -> str | None:
        "returns the name of the issuer character or corporation or None"
        try:
            if self.issuer:
                return self.issuer.character_name
        except models.ObjectDoesNotExist:
            pass
        try:
            if self.issuer_corporation:
                return self.issuer_corporation.corporation_name
        except models.ObjectDoesNotExist:
            pass
        return None

    def _generate_embed_description(self):
        """Generate description for embed message"""
        desc = (
            f"\n**From:** {self.start_location}\n"
            f"**To:** {self.end_location}\n"
            f"**Volume:** {self.volume:,.0f} m3\n"
            f"**Collateral:** {humanize_number(self.collateral)} ISK\n"
            f"**Reward:** {humanize_number(self.reward)} ISK\n"
            f"**Status:** {self.status}\n"
            f"**Issued on:** {self.date_issued.strftime(DATETIME_FORMAT)}\n"
            f"**Issued by:** {self.issuer}\n"
            f"**Expires on:** {self.date_expired.strftime(DATETIME_FORMAT)}\n"
        )
        if self.acceptor_name:
            desc += f"**Accepted by:** {self.acceptor_name}\n"
        if self.date_accepted:
            desc += f"**Accepted on:** {self.date_accepted}\n"
        return desc

    def _generate_contents(self, status_to_report):
        contents = ""
        if self.acceptor_name:
            acceptor_text = f"by {self.acceptor_name} "
        else:
            acceptor_text = ""
        if status_to_report == self.Status.PENDING:
            contents += "We have received your contract"
            contents += " and it will be picked up by one of our pilots shortly."
        elif status_to_report == self.Status.IN_PROGRESS:
            contents += (
                f"Your contract has been picked up {acceptor_text}"
                "and will be delivered to you shortly."
            )
        elif status_to_report == self.Status.FINISHED:
            contents += (
                "Your contract has been **delivered**.\n"
                "Thank you for using our freight service."
            )
        elif status_to_report == self.Status.FAILED:
            contents += (
                f"Your contract has been **failed** {acceptor_text}"
                "Thank you for using our freight service."
            )
        else:
            raise NotImplementedError()

        contents += self._generate_embed_description()
        return contents

    def _report_to_customer(self, status):
        """Send notification to customer about this contract"""
        issuer_user = User.objects.filter(
            character_ownerships__character=self.issuer
        ).first()

        if not issuer_user:
            logger.warning("Could not find user for issuer %s", self.issuer)
            return

        logger.debug(
            "%s: Tryinng to send customer notification for contract %s status %s to discord",
            self,
            self.contract_id,
            status,
        )
        user_id = self.issuer.character_ownership.user.id

        title = (
            (
                f"{self.start_location.solar_system_name} >> "
                f"{self.end_location.solar_system_name} "
                f"| {self.volume:,.0f} m3 | {self.status.upper()}"
            ),
        )
        message = self._generate_contents(status)

        send_user_notification.delay(
            user_id=user_id,
            title=title,
            message=message,
            embed_message=True,
            level="info",
        )

        logger.info(
            "Sent customer notification for contract %s to user %s",
            self.contract_id,
            user_id,
        )

        ContractCustomerNotification.objects.update_or_create(
            contract=self,
            status=status,
            defaults={"date_notified": now()},
        )

    def send_company_notification(self):
        """Send notification to pilot about this contract"""
        with transaction.atomic():
            logger.debug(
                "%s: Tryinng to send customer notification for contract %s to discord",
                self,
                self.contract_id,
            )
            managers = User.objects.filter(is_active=True)

            url = urljoin(site_absolute_url(), reverse("aafenrir:freight_contracts"))

            title = (
                f"{self.start_location.solar_system_name} >> "
                f"{self.end_location.solar_system_name} "
                f"| {self.volume:,.0f} m3 | {self.status.upper()}"
            )

            if self.date_notified is None:
                for manager in managers:
                    if manager.has_perm("aafenrir.full_access"):
                        message = (
                            f"There is a new courier contract from {self.issuer} "
                            "looking to be picked up "
                            f"[[show]({url})]: \n"
                        )
                        message += self._generate_embed_description()

                        send_user_notification.delay(
                            user_id=manager.id,
                            title=title,
                            message=message,
                            embed_message=True,
                            level="info",
                        )
                        logger.info(
                            "Sent company notification for contract %s to user %s",
                            self.contract_id,
                            manager.id,
                        )
                self.date_notified = now()
                self.save()

    def send_customer_notification(self, force_sent=False):
        """Send notification to customer about this contract"""
        status_to_report = None
        for status in self.Status.for_customer_notification():
            if self.status == status and (
                force_sent or not self.aafenrir_notifications.filter(status=status)
            ):
                status_to_report = status
                break
        if status_to_report:
            self._report_to_customer(status_to_report)


class ContractCustomerNotification(models.Model):
    """record of contract notification to customer about state"""

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        verbose_name=_("Contract"),
        related_name="aafenrir_notifications",
    )
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        db_index=True,
        verbose_name=_("Status"),
    )
    date_notified = models.DateTimeField(
        verbose_name=_("Date Notified"), help_text="datetime of notification"
    )

    class Meta:
        unique_together = (("contract", "status"),)
        verbose_name = _("Contract customer notification")
        default_permissions = ()

    def __str__(self):
        return f"{self.contract.contract_id} - {self.status}"

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}(pk={self.pk}, "
            f"contract_id={self.contract.contract_id}, status={self.status})"
        )
