"""Helpers for the Administration API."""

# Django
from django.db import models
from django.db.models import Count, Max, Min, QuerySet, Sum

# Alliance Auth
from esi.errors import TokenError

# AA Fenrir
from aafenrir.api import schema
from aafenrir.helpers.choice import Status
from aafenrir.models import Contract, ContractCustomerNotification, ContractHandler

# Lowest ID of a player corporation, lower IDs are NPC corporations
MIN_PLAYER_CORPORATION_ID = 10_000_000

RECENT_NOTIFICATIONS_LIMIT = 10


def get_handlers() -> QuerySet[ContractHandler]:
    """Return all handlers, NPC corporations excluded."""
    return ContractHandler.objects.select_related(
        "organization", "character__character", "character__user"
    ).filter(organization__eve_id__gte=MIN_PLAYER_CORPORATION_ID)


def get_handler(corporation_id: int) -> ContractHandler | None:
    """Return a single handler or None, NPC corporations are never returned."""
    return get_handlers().filter(organization__eve_id=corporation_id).first()


def get_handler_status(handler: ContractHandler) -> str:
    """Return the sync status of a handler."""
    if handler.character is None:
        return "no_character"
    try:
        handler.token()
    except TokenError:
        return "token_error"
    if handler.last_sync is None:
        return "never_synced"
    if not handler.is_sync_ok:
        return "outdated"
    return "ok"


def _contract_counts(handler_ids: list[int]) -> dict[int, dict[str, int]]:
    """Return contract counts per handler: total, pending, in_progress."""
    rows = (
        Contract.objects.filter(handler_id__in=handler_ids)
        .values("handler_id")
        .annotate(
            total=Count("pk"),
            pending=Count("pk", filter=models.Q(status=Status.PENDING)),
            in_progress=Count("pk", filter=models.Q(status=Status.IN_PROGRESS)),
        )
    )
    return {row["handler_id"]: row for row in rows}


def build_handler_schema(
    handler: ContractHandler, counts: dict[str, int] | None = None
) -> dict:
    """Return the base fields of the handler schemas."""
    counts = counts or {}
    character = handler.character.character if handler.character else None
    return {
        "id": handler.organization_id,
        "name": str(handler.organization.name),
        "category": handler.organization.category,
        "character_id": character.character_id if character else None,
        "character_name": character.character_name if character else None,
        "last_sync": handler.last_sync,
        "status": get_handler_status(handler),
        "contracts_total": counts.get("total", 0),
        "contracts_pending": counts.get("pending", 0),
        "contracts_in_progress": counts.get("in_progress", 0),
    }


def list_handlers() -> list[schema.AdministrationHandlerSchema]:
    """Return all handlers with their status and contract counts."""
    handlers = list(get_handlers().order_by("organization__name"))
    counts = _contract_counts([h.organization_id for h in handlers])
    return [
        schema.AdministrationHandlerSchema(
            **build_handler_schema(handler, counts.get(handler.organization_id))
        )
        for handler in handlers
    ]


def handler_detail(
    handler: ContractHandler,
) -> schema.AdministrationHandlerDetailSchema:
    """Return a handler with contract statistics and recent notifications."""
    contracts = Contract.objects.filter(handler=handler)

    stats = [
        schema.AdministrationStatusStatsSchema(
            status=row["status"],
            count=row["count"],
            reward=row["reward"] or 0,
            collateral=row["collateral"] or 0,
            volume=row["volume"] or 0,
        )
        for row in contracts.values("status")
        .annotate(
            count=Count("pk"),
            reward=Sum("reward"),
            collateral=Sum("collateral"),
            volume=Sum("volume"),
        )
        .order_by("status")
    ]
    totals = contracts.aggregate(
        total=Count("pk"),
        pending=Count("pk", filter=models.Q(status=Status.PENDING)),
        in_progress=Count("pk", filter=models.Q(status=Status.IN_PROGRESS)),
        reward=Sum("reward"),
        collateral=Sum("collateral"),
        volume=Sum("volume"),
        first_issued=Min("date_issued"),
        last_issued=Max("date_issued"),
    )

    notifications = [
        schema.AdministrationNotificationSchema(
            contract_id=notification.contract.contract_id,
            status=notification.status,
            date_notified=notification.date_notified,
        )
        for notification in ContractCustomerNotification.objects.filter(
            contract__handler=handler
        )
        .select_related("contract")
        .order_by("-date_notified")[:RECENT_NOTIFICATIONS_LIMIT]
    ]

    return schema.AdministrationHandlerDetailSchema(
        **build_handler_schema(handler, totals),
        stats=stats,
        total_reward=totals["reward"] or 0,
        total_collateral=totals["collateral"] or 0,
        total_volume=totals["volume"] or 0,
        first_issued=totals["first_issued"],
        last_issued=totals["last_issued"],
        recent_notifications=notifications,
    )
