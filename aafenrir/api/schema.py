# Standard Library
from datetime import datetime
from typing import Any

# Third Party
from ninja import Schema


class UserData(Schema):
    """
    Schema for user data, including character ID and character name.

    Parameters:
        user_id (int): The ID of the user.
        character_id (int): The ID of the character associated with the user.
        character_name (str): The name of the character.
        portrait (str | None): The URL or path to the character's portrait image.
        notification (boolean): The notification status for the user.
    """

    user_id: int
    character_id: int
    character_name: str
    portrait: str | None = None

    notification: bool
    quick_select_presets: list[int] = []
    has_manage_access: bool = False


class DataTableSchema(Schema):
    """
    Schema for a data table entry, including raw data, display text, sorting information, translation, and dropdown text.

    Parameters:
        raw (Any): The raw data for the table entry.
        display (str): The display text for the table entry.
        sort (str | None): The sorting information for the table entry.
        translation (str | None): The translation for the table entry.
        dropdown_text (str | None): The dropdown text for the table entry.
    """

    raw: Any
    display: str
    sort: str | None = None
    translation: str | None = None
    dropdown_text: str | None = None


# React Stuff


class ModalSchema(Schema):
    """Schema for modal dialog data."""

    title: str
    text: str
    icon: str
    modal_id: str
    url: str
    color: str | None = None
    buttonText: str | None = None


class MenuLink(Schema):
    """
    Represents a link in the menu.

    Parameters:
        name (str): The name of the menu link.
        link (str | None): The URL or path the menu link points to.
        is_external (bool): Whether the link is outside of React and should be opened directly.
    """

    name: str
    link: str = None
    is_external: bool = False


class MenuCategory(MenuLink):
    """
    Represents a category in the menu, which can contain multiple links.

    Parameters:
        links (list[MenuLink]): A list of links under this category.
        name (str): The name of the menu category.
        link (str | None): The optional link for the menu category.
    """

    links: list[MenuLink] = None


class MenuModalSchema(Schema):
    """Schema for menu modals"""

    create_aafenrir: ModalSchema | None = None


class MenuSchema(Schema):
    """
    Schema for the overall menu, including links and modals.

    Parameters:
        links (list[MenuLink]): The list of links in the menu.
        modals (MenuModalSchema | None): The modals associated with the menu.
    """

    left_links: list[MenuLink] = []
    right_links: list[MenuLink] = []
    modals: MenuModalSchema | None = None


class SolarSystemSchema(Schema):
    """
    Schema for a solar system entry.
    """

    id: int
    name: str
    border: bool
    constellation_id: int
    corridor: bool
    faction_id_raw: int
    fringe: bool
    hub: bool
    international: bool
    luminosity: float
    radius: float
    regional: bool
    security_class: str
    security_status: float
    visual_effect: str
    wormhole_class_id_raw: int
    x: float
    y: float
    z: float
    x_2d: float
    y_2d: float


class ContractHandlerSchema(Schema):
    """
    Schema for ContractHandler (corporation / alliance).
    """

    id: int
    name: str


class RoutePresetSchema(Schema):
    """
    Schema for RoutePreset.
    """

    id: int
    name: str
    origin_system: str
    origin_system_id: int | None = None
    origin_station: str = ""
    destination_system: str
    destination_system_id: int | None = None
    destination_station: str = ""
    service_type: str
    max_volume: int
    max_collateral: int
    base_fee: int
    fee_per_m3: int
    fee_per_ly: float
    fee_per_ly_or_jump: float = 0.0
    fee_per_lyorjump: float = 0.0
    collateral_percent: float
    min_reward: int
    estimated_time: int
    estimated_days: float
    is_cyno_route: bool
    cyno_waypoints: list[str] = []
    cyno_waypoint_ids: list[int] = []
    danger_level: str
    description: str = ""
    has_alliance_subsidy: bool = True
    assign_corp_id: int | None = None
    assign_corp_name: str = ""
    expiration_days: int = 7
    days_to_complete: int = 3


class CreateRoutePresetSchema(Schema):
    """
    Schema for creating a RoutePreset.
    """

    name: str
    origin_system_id: int
    origin_system_station: str = ""
    destination_system_id: int
    destination_system_station: str = ""
    service_type: str = "jumpfreighter"
    max_volume: int = 0
    max_collateral: int = 0
    base_fee: int = 5_000_000
    fee_per_m3: int = 0
    fee_per_ly: float = 0
    collateral_percent: float = 0
    min_reward: int = 0
    estimated_time: int = 0
    is_cyno_route: bool = False
    cyno_waypoint_ids: list[int] = []
    danger_level: str = "safe"
    has_alliance_subsidy: bool = True
    assign_corp_id: int | None = None
    expiration_days: int = 7
    days_to_complete: int = 3


class ContractSchema(Schema):
    """
    Schema for courier contract queue data.
    """

    id: int
    contract_id: int
    title: str | None = None
    status: str
    status_display: str
    issuer_name: str = "Unknown"
    issuer_corporation_name: str = ""
    issuer_corporation_ticker: str = ""
    start_location_name: str
    start_location_solar_system: str
    end_location_name: str
    end_location_solar_system: str
    volume: float
    collateral: float
    reward: float
    date_issued: datetime
    date_expired: datetime
    date_accepted: datetime | None = None
    date_completed: datetime | None = None
    days_to_complete: int = 0
    acceptor_name: str | None = None
    for_corporation: bool = False


class RouteSystemSchema(Schema):
    """
    Schema for an available route solar system.
    """

    id: int
    system_id: int
    name: str
    security_status: float
    security_class: str
    region_name: str = ""
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


class AddRouteSystemSchema(Schema):
    """
    Schema for adding a solar system to available route systems.
    """

    system_id: int


class SolarSystemSearchSchema(Schema):
    """
    Schema for solar system search results.
    """

    id: int
    name: str
    security_status: float
    security_class: str
    region_name: str = ""
