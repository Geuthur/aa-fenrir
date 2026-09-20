"""Initialize the app"""

__version__ = "1.0.0"
__title__ = "Fenrir"

__package_name__ = "aa-fenrir"
__app_name__ = "aafenrir"
__esi_compatibility_date__ = "2025-12-16"
__app_name_useragent__ = "AA-Fenrir"
__github_url__ = f"https://github.com/Geuthur/{__package_name__}"

__operations__ = [
    "GetCorporationsCorporationIdContracts",
    # Location operations
    "GetCharactersCharacterIdOnline",
    "GetCharactersCharacterIdLocation",
    "GetCharactersCharacterIdShip",
    # Universe operations
    "PostUniverseNames",
    "GetUniverseStationsStationId",
    "GetUniverseStructuresStructureId",
    "GetUniverseTypesTypeId",
    "GetUniverseSystemsSystemId",
]
