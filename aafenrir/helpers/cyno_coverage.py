"""Cyno coverage of route waypoints, based on character locations from corptools.

corptools is an optional integration: without it in ``INSTALLED_APPS`` no
coverage is reported and nothing from corptools is imported.
"""

# Standard Library
from collections import defaultdict
from datetime import datetime

# Django
from django.apps import apps
from django.db.models import F

# Alliance Auth
from allianceauth.authentication.models import User

# AA Fenrir
from aafenrir.managers.general import GeneralManager

# Key under which corptools stores the time of the last location update
# in ``CharacterAudit.update_timestamps``.
CORPTOOLS_LOCATION_UPDATE_KEY = "location"


def corptools_installed() -> bool:
    """Return True if corptools is installed and active."""
    return apps.is_installed("corptools")


def get_cyno_coverage(system_ids: list[int], viewer: User) -> dict[int, list]:
    """Return the route admin character locations in the given systems.

    Route admins are the users with management access (manage or full access).
    A viewer with full access sees the characters of all route admins, any
    other viewer only their own characters.

    Args:
        system_ids: IDs of the solar systems to check.
        viewer: The user requesting the coverage.

    Returns:
        A dict mapping system ID to the list of corptools ``CharacterLocation``
        objects in that system. Empty without corptools. Each location gets
        the attributes ``last_update`` (time corptools last updated the
        character location) and ``is_own`` (character belongs to the viewer).
    """
    if not system_ids or not corptools_installed():
        return {}

    # Third Party
    # pylint: disable=import-outside-toplevel
    from corptools.models import CharacterLocation

    if GeneralManager.has_admin_access(viewer):
        owners = GeneralManager.users_with_management_access()
    else:
        owners = User.objects.filter(pk=viewer.pk)

    locations = (
        CharacterLocation.objects.filter(
            current_location__system_id__in=system_ids,
            character__character__character_ownership__user__in=owners,
        )
        .annotate(owner_id=F("character__character__character_ownership__user_id"))
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
        location.is_own = location.owner_id == viewer.pk
        coverage[location.current_location.system_id].append(location)
    return dict(coverage)


def _location_update_time(audit) -> datetime | None:
    """Return when corptools last updated the location of the character."""
    try:
        return audit.get_update_time(CORPTOOLS_LOCATION_UPDATE_KEY)
    except (TypeError, ValueError):
        return None
