"""Test helpers for the optional corptools integration."""

# Standard Library
from datetime import datetime

# Third Party
from corptools.models import CharacterAudit, CharacterLocation, EveLocation
from evesde_factory.allianceauth import EveCharacterFactory
from evesde_factory.eve_sde import ItemTypeFactory
from evesde_factory.utils import add_character_to_user

# Alliance Auth
from allianceauth.authentication.models import User

# Alliance Auth (External Libs)
from eve_sde.models import SolarSystem


def create_character_location(
    user: User,
    system: SolarSystem,
    location_name: str = "",
    ship_name: str = "Cyno Alt Ship",
    updated: datetime | None = None,
) -> CharacterLocation:
    """Create a character of the user, located in the system according to corptools.

    Args:
        user: Owner of the new character.
        system: Solar system the character is located in.
        location_name: Station or structure name, defaults to the system name.
        ship_name: Name of the current ship.
        updated: Time of the last location update in corptools.
    """
    character = EveCharacterFactory()
    add_character_to_user(user=user, character=character)

    audit = CharacterAudit.objects.create(character=character, active=True)
    if updated:
        audit.update_timestamps = {"location": updated.isoformat()}
        audit.save()

    location, _ = EveLocation.objects.get_or_create(
        location_id=system.id if not location_name else 60_000_000 + system.id,
        defaults={"location_name": location_name or system.name, "system": system},
    )
    return CharacterLocation.objects.create(
        character=audit,
        current_location=location,
        current_ship=ItemTypeFactory(name="Arazu"),
        current_ship_name=ship_name,
    )
