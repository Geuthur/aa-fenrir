"""Cyno coverage of route waypoints, based on character locations from corptools.

corptools is an optional integration: without it in ``INSTALLED_APPS`` no
coverage is reported and nothing from corptools is imported.
"""

# Standard Library
from collections import defaultdict
from datetime import datetime

# Django
from django.apps import apps

# AA Fenrir
from aafenrir.models.general import General

# Key under which corptools stores the time of the last location update
# in ``CharacterAudit.update_timestamps``.
CORPTOOLS_LOCATION_UPDATE_KEY = "location"


def corptools_installed() -> bool:
    """Return True if corptools is installed and active."""
    return apps.is_installed("corptools")


def get_cyno_coverage(system_ids: list[int]) -> dict[int, list]:
    """Return the route admin character locations in the given systems.

    Args:
        system_ids: IDs of the solar systems to check.

    Route admins are the users with management access (manage or full access).

    Returns:
        A dict mapping system ID to the list of corptools ``CharacterLocation``
        objects of route admin characters in that system. Empty without
        corptools. Each location gets the attribute ``last_update`` with the
        time corptools last updated the character location.
    """
    if not system_ids or not corptools_installed():
        return {}

    # Third Party
    # pylint: disable=import-outside-toplevel
    from corptools.models import CharacterLocation

    locations = (
        CharacterLocation.objects.filter(
            current_location__system_id__in=system_ids,
            character__character__character_ownership__user__in=(
                General.users_with_management_access()
            ),
        )
        .select_related(
            "character__character",
            "current_location",
            "current_ship",
        )
        .order_by("character__character__character_name")
    )

    coverage: dict[int, list] = defaultdict(list)
    for location in locations:
        location.last_update = _location_update_time(location.character)
        coverage[location.current_location.system_id].append(location)
    return dict(coverage)


def _location_update_time(audit) -> datetime | None:
    """Return when corptools last updated the location of the character."""
    try:
        return audit.get_update_time(CORPTOOLS_LOCATION_UPDATE_KEY)
    except (TypeError, ValueError):
        return None
