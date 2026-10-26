"""Factories for AA Fenrir models."""

# Standard Library
from datetime import timedelta

# Third Party
import factory
import factory.django
from evesde_factory.allianceauth import (
    BaseMetaFactory,
    EveCharacterFactory,
    EveCorporationInfoFactory,
)

# Django
from django.utils import timezone

# AA Fenrir
from aafenrir.helpers.choice import Status
from aafenrir.models import (
    Contract,
    ContractCustomerNotification,
    ContractHandler,
    EveEntity,
    Location,
)


class EveEntityFactory(
    factory.django.DjangoModelFactory, metaclass=BaseMetaFactory[EveEntity]
):
    """Generate an EveEntity (corporation by default)."""

    class Meta:
        model = EveEntity
        django_get_or_create = ("eve_id",)

    eve_id = factory.Sequence(lambda n: 98_000_000 + n)
    category = "corporation"
    name = factory.Sequence(lambda n: f"Freight Corp {n}")


class ContractHandlerFactory(
    factory.django.DjangoModelFactory, metaclass=BaseMetaFactory[ContractHandler]
):
    """Generate a ContractHandler without character."""

    class Meta:
        model = ContractHandler
        django_get_or_create = ("organization",)

    organization = factory.SubFactory(EveEntityFactory)
    last_sync = factory.LazyFunction(timezone.now)


class LocationFactory(
    factory.django.DjangoModelFactory, metaclass=BaseMetaFactory[Location]
):
    """Generate a Location."""

    class Meta:
        model = Location
        django_get_or_create = ("id",)

    id = factory.Sequence(lambda n: 1_000_000_000_000 + n)
    name = factory.Sequence(lambda n: f"Jita{n} - Upwell Citadel")
    solar_system_id = 30000142


class ContractFactory(
    factory.django.DjangoModelFactory, metaclass=BaseMetaFactory[Contract]
):
    """Generate a Contract of a handler."""

    class Meta:
        model = Contract
        django_get_or_create = ("handler", "contract_id")

    handler = factory.SubFactory(ContractHandlerFactory)
    contract_id = factory.Sequence(lambda n: 100_000 + n)
    status = Status.PENDING
    collateral = 1_000_000_000.0
    reward = 50_000_000.0
    volume = 100_000.0
    for_corporation = False
    days_to_complete = 3
    date_issued = factory.LazyFunction(timezone.now)
    date_expired = factory.LazyFunction(lambda: timezone.now() + timedelta(days=7))
    issuer = factory.SubFactory(EveCharacterFactory)
    issuer_corporation = factory.SubFactory(EveCorporationInfoFactory)
    start_location = factory.SubFactory(LocationFactory)
    end_location = factory.SubFactory(LocationFactory)


class ContractCustomerNotificationFactory(
    factory.django.DjangoModelFactory,
    metaclass=BaseMetaFactory[ContractCustomerNotification],
):
    """Generate a ContractCustomerNotification."""

    class Meta:
        model = ContractCustomerNotification

    contract = factory.SubFactory(ContractFactory)
    status = Status.PENDING
    date_notified = factory.LazyFunction(timezone.now)
