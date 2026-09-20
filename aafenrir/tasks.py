"""App Tasks"""

# Third Party
from celery import chain, shared_task

# Alliance Auth
from allianceauth.services.hooks import get_extension_logger
from allianceauth.services.tasks import QueueOnce

# AA Fenrir
from aafenrir import __title__, app_settings
from aafenrir.models import Contract, ContractHandler
from aafenrir.providers import AppLogger

logger = AppLogger(get_extension_logger(__name__), __title__)

MAX_RETRIES_DEFAULT = 3

# Default params for all tasks.
TASK_DEFAULTS = {
    "time_limit": app_settings.AA_FENRIR_TASKS_TIME_LIMIT,
    "max_retries": MAX_RETRIES_DEFAULT,
}

# Default params for tasks that need bind=True.
TASK_DEFAULTS_BIND = {**TASK_DEFAULTS, **{"bind": True}}
# Default params for tasks that need bind=True and run once only.
TASK_DEFAULTS_BIND_ONCE = {**TASK_DEFAULTS, **{"bind": True, "base": QueueOnce}}
# Default params for tasks that need run once only.
TASK_DEFAULTS_ONCE = {**TASK_DEFAULTS, **{"base": QueueOnce}}

_update_fenrir_params = {
    **TASK_DEFAULTS_ONCE,
    **{"once": {"keys": ["corporation_id", "force_refresh"], "graceful": True}},
}


@shared_task(**TASK_DEFAULTS_ONCE)
def aafenrir_task(runs: int = 0, force_refresh: bool = False):
    """AA Fenrir task for the app."""
    corp_query = ContractHandler.objects.all()
    if corp_query:
        for corp in corp_query:
            update_freight.apply_async(
                args=[corp.organization.eve_id], kwargs={"force_refresh": force_refresh}
            )
            runs = runs + 1
        logger.info("Queued %s Freight Updates", runs)


@shared_task(**TASK_DEFAULTS_ONCE)
def update_freight(corporation_id, force_refresh=False):
    corporation = ContractHandler.objects.select_related("organization").get(
        organization=corporation_id
    )
    logger.debug("Processing Freight Updates for %s", corporation.organization.name)

    que = []
    que.append(
        update_freight_contract.si(
            corporation.organization.eve_id, force_refresh=force_refresh
        )
    )
    que.append(
        send_contract_notifications.si(
            force_sent=force_refresh,
        )
    )

    chain(que).apply_async()

    logger.debug("Queued Freight Updates for %s", corporation.organization.name)


@shared_task(**_update_fenrir_params)
def update_freight_contract(corporation_id, force_refresh=False):
    logger.debug(
        "Updating Freight Contracts for Corporation ID: %s, Force Refresh: %s",
        corporation_id,
        force_refresh,
    )
    ContractHandler.objects.update_corporation_contract(
        corporation_id, force_refresh=force_refresh
    )


@shared_task(**TASK_DEFAULTS_ONCE)
def send_contract_notifications(force_sent=False, rate_limited=True):
    """Send notification about pending contracts"""
    logger.debug(
        "Sending contract notifications: force_sent=%s, rate_limited=%s",
        force_sent,
        rate_limited,
    )
    Contract.objects.send_notifications(force_sent, rate_limited)
