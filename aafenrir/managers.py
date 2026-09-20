# Standard Library
import hashlib
import json
from datetime import datetime
from time import sleep
from typing import TYPE_CHECKING, Any, Generic, TypeVar

# Django
from django.db import models, transaction
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _

# Alliance Auth
from allianceauth.authentication.models import User
from allianceauth.eveonline.models import EveCharacter, EveCorporationInfo
from allianceauth.services.hooks import get_extension_logger
from esi.exceptions import HTTPClientError, HTTPNotModified
from esi.models import Token

# AA Fenrir
from aafenrir import __title__
from aafenrir.helpers.choice import Status
from aafenrir.providers import AppLogger, esi

logger = AppLogger(get_extension_logger(__name__), __title__)

T = TypeVar("T", bound=models.Model)

if TYPE_CHECKING:
    # Alliance Auth
    from esi.stubs import CorporationsCorporationIdContractsGetItem

    # AA Fenrir
    from aafenrir.models import Contract as ContractContext
    from aafenrir.models import ContractHandler as ContractHandlerContext
    from aafenrir.models import Location as LocationContext


class AccessQuerySet(models.QuerySet[T], Generic[T]):
    """QuerySet with access control methods for Belt Radar models."""

    def visible_to(self, user):
        """Get all survey sessions visible to the user."""
        # superusers get all visible
        if user.is_superuser:
            logger.debug(
                "Returning all survey sessions for superuser %s.",
                user,
            )
            return self

        if user.has_perm("aafenrir.full_access"):
            logger.debug("Returning all survey sessions for admin user %s.", user)
            return self

        try:
            char = user.profile.main_character
            assert char
            queries = [models.Q(owner=user)]
            queries.append(models.Q(is_public=True))

            logger.debug(
                "%s queries for user %s visible survey sessions.", len(queries), user
            )

            query = queries.pop()
            for q in queries:
                query |= q
            return self.filter(query)
        except AssertionError:
            logger.debug("User %s has no main character. Nothing visible.", user)
            return self.none()

    def manage_to(self, user):
        """Get all survey sessions that the user can manage."""
        # superusers get all visible
        if user.is_superuser:
            logger.debug(
                "Returning all survey sessions for superuser %s.",
                user,
            )
            return self

        if user.has_perm("aafenrir.full_access"):
            logger.debug("Returning all survey sessions for admin user %s.", user)
            return self

        try:
            char = user.profile.main_character
            assert char
            queries = [models.Q(owner=user)]

            logger.debug(
                "%s queries for user %s visible survey sessions.", len(queries), user
            )

            query = queries.pop()
            for q in queries:
                query |= q
            return self.filter(query)
        except AssertionError:
            logger.debug("User %s has no main character. Nothing visible.", user)
            return self.none()


class AccessManager(models.Manager[T], Generic[T]):
    """Manager with access control methods for Belt Radar models."""

    def get_queryset(self) -> AccessQuerySet[T]:
        return AccessQuerySet(self.model, using=self._db)

    def visible_to(self, user):
        return self.get_queryset().visible_to(user)

    def manage_to(self, user):
        return self.get_queryset().manage_to(user)

    @staticmethod
    def visible_eve_characters(user):
        qs = EveCharacter.objects.get_queryset()
        if user.is_superuser:
            logger.debug("Returning all characters for superuser %s.", user)
            return qs.all()

        if user.has_perm("aafenrir.full_access"):
            logger.debug("Returning all characters for %s.", user)
            return qs.all()

        try:
            char = user.profile.main_character
            assert char
            queries = [models.Q(character_ownership__user=user)]

            logger.debug(
                "%s queries for user %s visible chracters.", len(queries), user
            )

            query = queries.pop()
            for q in queries:
                query |= q
            return qs.filter(query)
        except AssertionError:
            logger.debug("User %s has no main character. Nothing visible.", user)
            return qs.none()


class EveEntityManager(models.Manager):
    def get_or_create_esi(self, *, eve_id: int) -> tuple[Any, bool]:
        """gets or creates entity object with data fetched from ESI"""
        # pylint: disable=import-outside-toplevel, cyclic-import
        # AA Fenrir
        from aafenrir.models import EveEntity

        try:
            entity = self.get(eve_id=eve_id)
            return entity, False
        except EveEntity.DoesNotExist:
            return self.update_or_create_esi(eve_id=eve_id)

    def create_bulk_from_esi(self, eve_ids):
        """gets bulk names with ESI"""
        if len(eve_ids) > 0:
            # pylint: disable=import-outside-toplevel, cyclic-import
            # AA Fenrir
            from aafenrir.models import EveEntity

            chunk_size = 500
            id_chunks = [
                eve_ids[i : i + chunk_size] for i in range(0, len(eve_ids), chunk_size)
            ]
            for chunk in id_chunks:
                universe_obj = esi.client.Universe.PostUniverseNames(body=chunk)

                universe_items = universe_obj.results(use_etag=False)

                new_names = []
                logger.debug(
                    "Eve Entity Manager EveName: count in %s count out %s",
                    len(chunk),
                    len(universe_items),
                )
                for entity in universe_items:
                    new_names.append(
                        EveEntity(
                            eve_id=entity.id,
                            name=entity.name,
                            category=entity.category,
                        )
                    )
                EveEntity.objects.bulk_create(new_names, ignore_conflicts=True)
            return True
        return True

    def update_or_create_esi(self, *, eve_id: int) -> tuple[Any, bool]:
        """updates or creates entity object with data fetched from ESI"""
        response = esi.client.Universe.PostUniverseNames(body=[eve_id]).results(
            use_etag=False
        )
        if len(response) != 1:
            raise ValueError(f"Unknown Type with ID {eve_id} not found.")
        entity_data = response[0]
        return self.update_or_create(
            eve_id=entity_data.id,
            defaults={
                "name": entity_data.name,
                "category": entity_data.category,
            },
        )


class LocationManager(models.Manager["LocationContext"]):
    STATION_ID_START = 60000000
    STATION_ID_END = 69999999

    def get_or_create_esi(
        self, token: Token, location_id: int, add_unknown: bool = True
    ) -> tuple["LocationContext", bool]:
        """gets or creates location object with data fetched from ESI"""
        # pylint: disable=import-outside-toplevel
        # AA Fenrir
        from aafenrir.models import Location

        try:
            location = self.get(id=location_id)
            created = False
        except Location.DoesNotExist:
            location, created = self.update_or_create_esi(
                token=token, location_id=location_id, add_unknown=add_unknown
            )
        return location, created

    def update_or_create_esi(
        self, token: Token, location_id: int, add_unknown: bool = True
    ) -> tuple["LocationContext", bool]:
        """updates or creates location object with data fetched from ESI"""
        # pylint: disable=import-outside-toplevel
        # AA Fenrir
        from aafenrir.models import Location

        if self.STATION_ID_START <= location_id <= self.STATION_ID_END:
            logger.info("%s: Fetching station from ESI", location_id)
            station = esi.client.Universe.GetUniverseStationsStationId(
                station_id=location_id
            )

            station_item = station.result(
                force_refresh=True,
                use_etag=False,
            )

            return self.update_or_create(
                id=location_id,
                defaults={
                    "name": station_item.name,
                    "solar_system_id": station_item.system_id,
                    "type_id": station_item.type_id,
                    "category_id": Location.Category.STATION_ID,
                },
            )

        try:
            structure = esi.client.Universe.GetUniverseStructuresStructureId(
                token=token, structure_id=location_id
            )

            structure_item = structure.result(
                force_refresh=True,
                use_etag=False,
            )
        except HTTPClientError as ex:
            logger.warning("%s: No access to this structure: %s", location_id, ex)
            if add_unknown:
                return self.get_or_create(
                    id=location_id,
                    defaults={
                        "name": f"Unknown structure {location_id}",
                        "category_id": Location.Category.STRUCTURE_ID,
                    },
                )
            raise ex
        except Exception as ex:
            logger.error("%s: Failed to fetch structure from ESI: %s", location_id, ex)
            if add_unknown:
                return self.get_or_create(
                    id=location_id,
                    defaults={
                        "name": f"Unknown structure {location_id}",
                        "category_id": Location.Category.STRUCTURE_ID,
                    },
                )
            raise ex

        return self.update_or_create(
            id=location_id,
            defaults={
                "name": structure_item.name,
                "solar_system_id": structure_item.solar_system_id,
                "type_id": structure_item.type_id,
                "category_id": Location.Category.STRUCTURE_ID,
            },
        )


class ContractHandlerManager(models.Manager["ContractHandlerContext"]):
    def update_corporation_contract(self, corporation_id, force_refresh=False):
        """Update contracts from ESI."""
        contract_corp = self.get(organization=corporation_id)

        token = Token.get_token(
            contract_corp.character.character.character_id,
            contract_corp.get_esi_scopes(),
        )
        try:
            contracts_obj = esi.client.Contracts.GetCorporationsCorporationIdContracts(
                corporation_id=contract_corp.organization.eve_id, token=token
            )

            contract_items, response = contracts_obj.results(
                return_response=True, force_refresh=force_refresh
            )
        except HTTPNotModified:
            logger.info(
                _("%s: Contracts not modified since last check."), contract_corp
            )
            return

        logger.debug("ESI response Status: %s", response.status_code)
        logger.debug("Contracts received: %s", contract_items)

        self._process_contracts_from_esi(
            contract_corp, contract_items, token, force_refresh
        )
        contract_corp.last_sync = now()
        contract_corp.save(update_fields=["last_sync"])

    def _process_contracts_from_esi(
        self,
        contract_corp: "ContractHandlerContext",
        contracts_all: list["CorporationsCorporationIdContractsGetItem"],
        token: object,
        force_refresh: bool,
    ):
        logger.info("%s: Processing %d contracts", contract_corp, len(contracts_all))
        # Filter Courier Contracts
        contracts_courier = [
            x
            for x in contracts_all
            if x.type == "courier"
            and int(x.assignee_id) == int(contract_corp.organization.eve_id)
        ]

        contracts = []
        for contract in contracts_courier:
            contract_corp.aafenrir_contracts.get_or_create_eve_character(
                character_id=contract.issuer_id
            )
            contracts.append(contract)

        # determine if contracts have changed by comparing their hashes
        # Use the string representation of each contract to avoid JSON serialization
        # issues for objects coming from the ESI context.
        contracts_repr = [str(c) for c in contracts]
        new_version_hash = hashlib.md5(
            json.dumps(contracts_repr).encode("utf-8")
        ).hexdigest()
        if force_refresh or new_version_hash != contract_corp.version_hash:
            with transaction.atomic():
                contract_corp.version_hash = new_version_hash
                for contract in contracts:
                    try:
                        contract_corp.aafenrir_contracts.update_or_create_from_dict(
                            handler=contract_corp, contract=contract, token=token
                        )
                    except OSError:
                        logger.exception(
                            "%s: An unexpected error ocurred while trying to load contract "
                            "%s",
                            contract_corp,
                            (
                                contract.contract_id
                                if contract.contract_id
                                else "Unknown"
                            ),
                        )
                contract_corp.save()
            logger.info(
                "%s: Storing update with %d contracts", contract_corp, len(contracts)
            )
        else:
            logger.info("%s: Contracts are unchanged.", contract_corp)


class ContractQuerySet(models.QuerySet):
    def pending_count(self) -> int:
        """Returns the number of pending contracts."""
        return (
            self.filter(status=Status.PENDING).exclude(date_expired__lt=now()).count()
        )

    def filter_not_completed(self):
        """Return contracts which are not yet completed."""
        return self.exclude(status__in=Status.completed())

    def issued_by_user(self, user: User) -> models.QuerySet:
        """Returns contracts issued by a character owned by given user."""
        return self.filter(
            issuer__in=EveCharacter.objects.filter(character_ownership__user=user)
        )

    def sent_pilot_notifications(self, rate_limited: bool) -> None:
        """Send all pilot notifications for these contracts."""
        logger.debug(
            "Trying to send pilot notifications for %d contracts", self.count()
        )
        for contract in self:
            if not contract.has_expired:
                contract.send_company_notification()
                if rate_limited:
                    sleep(1)
            else:
                logger.debug("contract %s has expired", contract.contract_id)

    def sent_customer_notifications(self, rate_limited: bool, force_sent: bool) -> None:
        """Send customer notifications for these contracts."""
        logger.debug(
            "Checking %d contracts if customer notifications need to be sent",
            self.count(),
        )
        for contract in self:
            if contract.has_expired:
                logger.debug("contract %d has expired", contract.contract_id)
            elif contract.has_stale_status:
                logger.debug("contract %d has stale status", contract.contract_id)
            else:
                contract.send_customer_notification(force_sent)
                if rate_limited:
                    sleep(1)


class ContractManager(models.Manager["ContractContext"]):
    def get_queryset(self):
        return ContractQuerySet(self.model, using=self._db)

    @staticmethod
    def get_or_create_eve_character(character_id: int) -> tuple["EveCharacter", bool]:
        """Get or create EveCharacter object."""
        try:
            return EveCharacter.objects.get(character_id=character_id), False
        except EveCharacter.DoesNotExist:
            return (
                EveCharacter.objects.create_character(character_id=character_id),
                True,
            )

    @staticmethod
    def get_or_create_eve_corporation_info(
        corporation_id: int,
    ) -> tuple["EveCorporationInfo", bool]:
        """Get or create EveCorporationInfo object."""
        try:
            return (
                EveCorporationInfo.objects.get(corporation_id=corporation_id),
                False,
            )
        except EveCorporationInfo.DoesNotExist:
            return (
                EveCorporationInfo.objects.create_corporation(corp_id=corporation_id),
                True,
            )

    def pending_count(self) -> int:
        """Returns the number of pending contracts."""
        return self.get_queryset().pending_count()

    def filter_not_completed(self):
        """Return contracts which are not yet completed."""
        return self.get_queryset().filter_not_completed()

    def issued_by_user(self, user: User) -> models.QuerySet:
        """Returns contracts issued by a character owned by given user."""
        return self.get_queryset().issued_by_user(user)

    def sent_pilot_notifications(self, rate_limited: bool) -> None:
        """Send all pilot notifications for these contracts."""
        return self.get_queryset().sent_pilot_notifications(rate_limited)

    def sent_customer_notifications(self, rate_limited: bool, force_sent: bool) -> None:
        """Send customer notifications for these contracts."""
        return self.get_queryset().sent_customer_notifications(rate_limited, force_sent)

    def update_or_create_from_dict(
        self,
        handler: "ContractHandlerContext",
        contract: "CorporationsCorporationIdContractsGetItem",
        token: Token,
    ) -> tuple[Any, bool]:
        """Updates or create a contract from dict."""
        acceptor, acceptor_corporation = self._identify_contracts_acceptor(contract)
        issuer_corporation, issuer = self._identify_contracts_issuer(contract)
        date_accepted = contract.date_accepted
        date_completed = contract.date_completed
        title = contract.title
        start_location, end_location = self._identify_locations(contract, token)
        obj, created = self.update_or_create(
            handler=handler,
            contract_id=contract.contract_id,
            defaults={
                "acceptor": acceptor,
                "acceptor_corporation": acceptor_corporation,
                "collateral": contract.collateral,
                "date_accepted": date_accepted,
                "date_completed": date_completed,
                "date_expired": contract.date_expired,
                "date_issued": contract.date_issued,
                "days_to_complete": contract.days_to_complete,
                "end_location": end_location,
                "for_corporation": contract.for_corporation,
                "issuer_corporation": issuer_corporation,
                "issuer": issuer,
                "reward": contract.reward,
                "start_location": start_location,
                "status": contract.status,
                "title": title,
                "volume": contract.volume,
            },
        )
        return obj, created

    @staticmethod
    def _ensure_datetime_type_or_none(contract: dict, property_name: str):
        if contract[property_name] and not isinstance(
            contract[property_name], datetime
        ):
            raise TypeError(f"{property_name} must be of type datetime")

    def _identify_locations(
        self,
        contract: "CorporationsCorporationIdContractsGetItem",
        token: Token,
    ) -> tuple["LocationContext", "LocationContext"]:
        # pylint: disable=import-outside-toplevel, cyclic-import
        # AA Fenrir
        from aafenrir.models import Location

        start_location = Location.objects.get_or_create_esi(
            token, contract.start_location_id
        )[0]
        end_location = Location.objects.get_or_create_esi(
            token, contract.end_location_id
        )[0]
        return start_location, end_location

    def _identify_contracts_acceptor(
        self, contract: "CorporationsCorporationIdContractsGetItem"
    ) -> tuple["EveCharacter | None", "EveCorporationInfo | None"]:
        # pylint: disable=import-outside-toplevel, cyclic-import
        # AA Fenrir
        from aafenrir.models import EveEntity

        acceptor_id = int(contract.acceptor_id)
        if acceptor_id == 0:
            return None, None

        try:
            entity: EveEntity = EveEntity.objects.get_or_create_esi(eve_id=acceptor_id)[
                0
            ]
        except OSError:
            logger.exception(
                "%s: Failed to identify acceptor for this contract",
                contract.contract_id,
            )
            return None, None

        if entity.is_character:
            acceptor = self.get_or_create_eve_character(character_id=entity.eve_id)[0]
            acceptor_corporation = self.get_or_create_eve_corporation_info(
                corporation_id=acceptor.corporation_id
            )[0]

        elif entity.is_corporation:
            acceptor = None
            acceptor_corporation = self.get_or_create_eve_corporation_info(
                corporation_id=entity.id
            )[0]

        else:
            acceptor = acceptor_corporation = None

        return acceptor, acceptor_corporation

    def _identify_contracts_issuer(
        self, contract: "CorporationsCorporationIdContractsGetItem"
    ) -> tuple["EveCorporationInfo | None", "EveCharacter | None"]:
        issuer = self.get_or_create_eve_character(character_id=contract.issuer_id)[0]
        issuer_corporation = self.get_or_create_eve_corporation_info(
            corporation_id=contract.issuer_corporation_id
        )[0]
        return issuer_corporation, issuer

    def send_notifications(
        self, force_sent: bool = False, rate_limited: bool = True
    ) -> None:
        """Send notifications for pending contracts"""
        self._sent_pilot_notifications(force_sent, rate_limited)
        self._sent_customer_notifications(force_sent, rate_limited)

    def _sent_pilot_notifications(
        self, force_sent: bool = False, rate_limited: bool = True
    ) -> None:
        """Send notifications to pilots for pending contracts"""
        contracts_qs = self.filter(status__exact=Status.PENDING)
        if not force_sent:
            contracts_qs = contracts_qs.filter(date_notified__exact=None)
        contracts_qs = contracts_qs.select_related()
        if contracts_qs.count() > 0:
            contracts_qs.sent_pilot_notifications(rate_limited)
        else:
            logger.debug("No new pilot notifications.")

    def _sent_customer_notifications(
        self, force_sent: bool = False, rate_limited: bool = True
    ) -> None:
        """Send notifications to customers for pending contracts"""
        contracts_qs = self.filter(status__in=Status.for_customer_notification())
        if contracts_qs.count() > 0:
            contracts_qs.sent_customer_notifications(
                rate_limited=rate_limited, force_sent=force_sent
            )
        else:
            logger.debug("No new customer notifications.")
