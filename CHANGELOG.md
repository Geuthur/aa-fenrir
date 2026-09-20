# Changelog

## [In Development] - Unreleased

<!--
> [!NOTE]
>

> [!TIP]
>

> [!IMPORTANT]
>

> [!WARNING]
>

> [!CAUTION]
>

Section Order:

### Added
### Fixed
### Changed
### Removed
-->

### Added

- **Cyno Chain Waypoint Manager (`CynoWaypointManager`)**:
  - Full cyno waypoint pipeline management for intermediate jump beacons in `CreateRouteModal` and `EditRouteModal`.
  - EVE SDE solar system search with debouncing and quick-select from configured route systems.
  - Waypoint reordering (Move Up / Move Down), removal, and visual jump chain visualization in the Calculator.
- **Available Systems DataTable (`RouteAdmin`)**:
  - Converted the available systems list to a TanStack `BaseTable` DataTable (`variant="fenrir"`).
  - Sortable columns for solar system name, security status (with color-coded badges for highsec, lowsec, and nullsec), and region.
  - Dynamic pagination (10, 25, 50, 100, Show All) with localized item count labels.
- **Enhanced Validations & Safety Warnings**:
  - Warning when cargo collateral exceeds corridor insurance maximum (`exceeds corridor insurance maximum`).
  - Stargate safety warning when attempting to route Standard Freighters through Nullsec stargates (`Standard Freighters cannot safely transit Nullsec stargates! Please use Jump Freighter service.`).
- **Internationalization (i18n)**:
  - Added full German (`de/translation.json`) and English (`en/translation.json`) translations for new table pagination items, warnings, and cyno waypoint controls.

### Fixed

- **Smooth Modal Exit Transitions (`FenrirModal`)**:
  - Resolved premature unmounting and content popping during modal fade-out by centrally caching previous modal content in `FenrirModal` until Bootstrap's transition finishes.
- **Modal Form Spacing & Alignment**:
  - Removed excessive `mt-4` margins above *Service Type* and *Danger Rating* form controls.
  - Replaced Bootstrap `Form.Check` with a clean flexbox layout to ensure checkboxes align perfectly alongside labels without vertical offset.
- **TypeScript ColumnDef Contravariance**:
  - Fixed TypeScript compiler errors with TanStack Table column definitions by updating `BaseTableProps` to `ColumnDef<TData, TValue = any>[]` and explicitly typing `systemColumns`.

### Changed

- **Editable Origin & Destination Stations**:
  - Made *Origin Station / Structure Name* and *Destination Station / Structure Name* fully editable in both `CreateRouteModal` and `EditRouteModal`.
- **Consistent Danger Rating Styling**:
  - Standardized the `Cyno-Guarded` presentation in Route Admin cards to match the Calculator (Navigation icon with emerald green styling).
- **CSS Modularization**:
  - Extracted header action button styling (`Create New Route`, `Add System`) into `RouteAdminHeader.module.css`.

## [0.0.1] - 2024-08-xx

### Added

- Initial public release

<!-- Links -->

[0.0.1]: https://github.com/Geuthur/aa-fenrir/compare/v0.0.1...v0.0.1 "0.0.1"
[in development]: https://github.com/Geuthur/aa-fenrir/compare/v0.0.1...HEAD "In Development"
