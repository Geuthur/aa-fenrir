# Changelog

## [In Development] - Unreleased

> [!IMPORTANT]
> A new **Administration** page is available for users with the `aafenrir.full_access` permission (no new permission was added). Users with only `manage_access` do not see it. Users with `full_access` now also see the *Route Admin* menu entry, as `full_access` already allowed editing routes.

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

- **Administration**:
  - New page for contract handlers with sync status (synced, outdated, never synced, no character, token error), contract counters, filter and search.
  - Inspection view per handler with contract statistics per status (count, reward, collateral, volume), date range and recent customer notifications.
  - Update a single handler, delete a handler (including its contracts) and queue an update for all handlers (superuser only, as is `force_refresh`).
  - NPC corporations are never shown, their detail endpoints return `404`.
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

- **Calculator System Dropdowns**: The *Origin* and *Destination* system dropdowns are no longer cut off by the route container.
- **Calculator System Search**: The search text in the system dropdowns stays white instead of turning dark when focused.
- **Calculator on Mobile**: The quick-select collateral buttons and card headers stay inside their container on small screens.
- **Smooth Modal Exit Transitions (`FenrirModal`)**:
  - Resolved premature unmounting and content popping during modal fade-out by centrally caching previous modal content in `FenrirModal` until Bootstrap's transition finishes.
- **Modal Form Spacing & Alignment**:
  - Removed excessive `mt-4` margins above *Service Type* and *Danger Rating* form controls.
  - Replaced Bootstrap `Form.Check` with a clean flexbox layout to ensure checkboxes align perfectly alongside labels without vertical offset.
- **TypeScript ColumnDef Contravariance**:
  - Fixed TypeScript compiler errors with TanStack Table column definitions by updating `BaseTableProps` to `ColumnDef<TData, TValue = any>[]` and explicitly typing `systemColumns`.

### Changed

- **Shared `BaseTable`**: Replaced the Fenrir-specific table with the shared `BaseTable` used in the other plugins (moved to `Components/Base/BaseTable`). The tables in *Route Admin* and *Contracts Queue* now use its default look. Formatting helpers moved to `Utils/format`.
- **Central Permissions**: All permission checks use the `General` model (`General.Permission`, `has_perm`, `has_basic_access`, `has_management_access`, `has_admin_access`). The helper `aafenrir.helpers.permission` was removed.
- **Editable Origin & Destination Stations**:
  - Made *Origin Station / Structure Name* and *Destination Station / Structure Name* fully editable in both `CreateRouteModal` and `EditRouteModal`.
- **Consistent Danger Rating Styling**:
  - Standardized the `Cyno-Guarded` presentation in Route Admin cards to match the Calculator (Navigation icon with emerald green styling).
- **CSS Modularization**:
  - Extracted header action button styling (`Create New Route`, `Add System`) into `RouteAdminHeader.module.css`.
- Replaced `pook` with `pookx` in the test dependencies.

### Removed

- Unused `BaseModal` component in `Components/Modals` (it was a copy of the table component).

<!-- Your changes go here -->

## [0.0.1] - 2024-08-xx

### Added

- Initial public release

<!-- Links -->

[0.0.1]: https://github.com/Geuthur/aa-fenrir/compare/v0.0.1...v0.0.1 "0.0.1"
[in development]: https://github.com/Geuthur/aa-fenrir/compare/v0.0.1...HEAD "In Development"
