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
  - Stargate safety warning when attempting to route Standard Freighters through Nullsec stargates (`Standard Freighters cannot safely transit Nullsec stargates! Please use Jump Freighter service.`).
- **Calculator Limits**: Volume and collateral stay within the limits of the active route. Without a route `AA_FENRIR_MAX_VOLUME` (default 10,000,000 m³) and `AA_FENRIR_MAX_COLLATERAL` (default 1,000,000,000,000 ISK) apply, both can be set in `local.py`.
- **Route Form Value Hints**: The number fields of the create and edit route modals show the entered value in a readable form, for example `15.00 B ISK`, `330,000 m³` or `1.5 h`.
- **Calculator Route Preset Hint**: If a route preset exists for the entered route but base rates are in use, a red pulsing exclamation mark appears next to the reward, and a green pulsing *Apply Route Preset* button next to *Copy ISK*.
- **Add Company**: The menu entry now adds or updates the contract handler in AA Fenrir itself, using the corporation of the selected ESI token character, and queues its contract update. It requires `manage_access` or `full_access` and no longer depends on `aa-voicesofwar`.
- **Internationalization (i18n)**:
  - Added full German (`de/translation.json`) and English (`en/translation.json`) translations for new table pagination items, warnings, and cyno waypoint controls.

### Fixed

- **Calculator System Dropdowns**: The *Origin* and *Destination* system dropdowns are no longer cut off by the route container.
- **Calculator Input Fields**: Cargo volume, collateral, station, system search, corridor preset and paste fields stay readable when focused. Their colors now come from Bootstrap and follow the Dark and Light theme.
- **Route Edit Form**:
  - Cyno guarded routes show the correct danger level, and saving no longer stores the display text instead of the value.
  - Selecting no corporation now removes the assigned corporation.
  - The collateral percent is shown exactly, for example `7` instead of `7.000000000000001`.
  - The collateral percent stays within the model limit of 9.9999.
- **Calculator Number Fields**: The `m³` and `ISK` units are no longer covered by the spin buttons on hover and focus.
- **Calculator on Mobile**: The quick-select collateral buttons and card headers stay inside their container on small screens.
- **Smooth Modal Exit Transitions (`BaseModal`)**:
  - Resolved premature unmounting and content popping during modal fade-out by keeping the previous modal content in `BaseModal`.
- **Modal Form Spacing & Alignment**:
  - Removed excessive `mt-4` margins above *Service Type* and *Danger Rating* form controls.
  - Replaced Bootstrap `Form.Check` with a clean flexbox layout to ensure checkboxes align perfectly alongside labels without vertical offset.
- **TypeScript ColumnDef Contravariance**:
  - Fixed TypeScript compiler errors with TanStack Table column definitions by updating `BaseTableProps` to `ColumnDef<TData, TValue = any>[]` and explicitly typing `systemColumns`.

### Changed

- **Modal Design**: Modals match the calculator view through Bootstrap overrides under `.modal-content.aa-react`, with cards, uppercase labels and a boxed title icon. They follow the Darkly and Flatly themes. The clipboard appraiser moved to `BaseModal`, `FenrirModal` is removed, and `CynoWaypointManager` moved from Tailwind to Bootstrap.
- **Calculator Layout**: Thin theme-coloured scrollbars on aa-fenrir pages. Collateral buttons and quick load presets wrap instead of scrolling or squeezing their text.
- **Tables**: Migrated to `@tanstack/react-table` 9.
- **Modals and Forms**: Calculator, Route Admin and Administration modals now share `BaseModal` and `ConfirmDeleteModal`, and the route forms share `RouteForm`. They use Bootstrap instead of Tailwind and CSS modules.
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
