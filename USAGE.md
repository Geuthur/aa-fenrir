# AA-Fenrir – Feature & Usage Guide

**AA-Fenrir** is a comprehensive logistics, freight, and courier service management plugin for **Alliance Auth** in **EVE Online**. It bridges automated pricing, jump routing, inventory appraisal, in-game contract creation, and fleet dispatching inside a modern, high-performance React application.

______________________________________________________________________

## Table of Contents

1. [Overview](#overview)
1. [Modules & Capabilities](#modules--capabilities)
   - [1. Freight Calculator & Quotes](#1-freight-calculator--quotes)
   - [2. EVE Inventory Clipboard Appraiser](#2-eve-inventory-clipboard-appraiser)
   - [3. Courier Queue](#3-courier-queue)
   - [4. Route & Corridor Administration (Route Admin)](#4-route--corridor-administration-route-admin)
   - [5. Cyno Chain Waypoint Manager](#5-cyno-chain-waypoint-manager)
   - [6. User Settings & Favorite Corridors](#6-user-settings--favorite-corridors)
1. [Permissions & Access Control](#permissions--access-control)
1. [UI & UX Architecture](#ui--ux-architecture)

______________________________________________________________________

## Overview

AA-Fenrir streamlines alliance courier logistics by removing guesswork and manual math for both line members and logistics haulers:

- **Instant Quotes:** Calculates contract rewards in real time based on volume, collateral, jump distance, risk profile, and alliance subsidies.
- **EVE SDE & Spatial Data:** Uses EVE Online Static Data Export (SDE) for solar systems, security ratings, regions, and coordinates.
- **In-Game Sync:** Parses inventory copied directly from the EVE client (`Ctrl+C`) and provides a 1-click contract creation assistant.
- **Role-Based Access:** Dedicated interfaces for regular alliance members (Calculator & Queue) and logistics coordinators (Route Admin & System Management).

______________________________________________________________________

## Modules & Capabilities

### 1. Freight Calculator & Quotes

The Freight Calculator is the core tool for pilots seeking courier transport:

- **Predefined Freight Corridors:**
  - Select standard alliance shipping lanes (e.g., `Jita 4-4 ⟷ 1DQ1-A Keepstar`).
  - Automatically loads pre-configured base fees, rates, minimum rewards, and collateral limits.
  - **Quick-Select Buttons:** Up to 5 user-customizable favorite routes displayed as one-click shortcut buttons at the top of the calculator.
- **Manual / Custom Routing:**
  - Choose any origin and destination among configured alliance solar systems.
  - Freely input or customize specific station and Upwell Citadel structure names.
  - **Swap Button (`Swap`):** Inverts origin and destination with a single click and automatically checks for an existing reverse corridor.
- **Service Profiles:**
  - **Jump Freighter (JF):** Long-range capital freight for Lowsec and Nullsec with jump fuel calculations.
  - **Standard Freighter:** High-volume Highsec hauling (with safety warnings preventing routing through Nullsec stargates).
  - **Deep Space Transport (DST):** Compact, high-value cargo transport utilizing blockade and overheat bonuses.
  - **Blockade Runner (BR):** Fast, covert transport for high-risk assets.
- **Risk Ratings:**
  - **Cyno-Guarded:** Guarded alliance cynosural beacon network (highlighted with an emerald-green Navigation icon).
  - **Safe Corridor:** Highsec CONCORD-protected stargate transit.
  - **Low/Null Transit:** Unsecured stargate transit with elevated risk surcharges.
- **Itemized Tariff Breakdown:**
  - **Base Booking Fee:** Fixed administrative charge per contract.
  - **Volume Tariff:** Rate calculated per cubic meter (m³).
  - **Distance / Waypoint Tariff:** Rate calculated per light-year (LY) and intermediate jump waypoints.
  - **Collateral Insurance:** Percentage-based surcharge on declared cargo value.
  - **RUSH Priority:** Optional +35% expedite surcharge guaranteeing dispatch in under 6 hours.
  - **Alliance Subsidy:** Automatic -12% discount applied for authenticated alliance members.
  - **Minimum Reward Floor:** Enforces a minimum payout to ensure haulers are fairly compensated on small loads.
- **Jump Drive & Fuel Analytics:**
  - Jump distance in Light Years (LY) and transit waypoints.
  - Fuel bay consumption breakdown by isotope type (Helium, Hydrogen, Nitrogen, Oxygen) based on freighter hull.
  - Estimated fuel cost in ISK.
  - Jump fatigue accumulation estimate.
- **In-Game Courier Contract Assistant:**
  - Step-by-step instructions for the EVE Online contract creation wizard (`Private` contract to the logistics corporation).
  - One-click copy buttons for:
    - Assign To (Private Corporation / Character)
    - Destination Citadel / Structure
    - Reward (ISK)
    - Collateral (ISK)
    - Expiration Days & Days to Complete

______________________________________________________________________

### 2. EVE Inventory Clipboard Appraiser

Enables rapid cargo specification without manual data entry:

- **Clipboard Parser:** Detects and parses text copied (`Ctrl+C`) directly from the EVE Online client (hangars, cargo holds, ship fitting windows, or asset lists).
- **Automatic Appraisal:** Extracts item names, quantities, packaged volumes (m³), and estimated market collateral values.
- **Itemized Overview:** Displays recognized items with icons, volume, and collateral subtotals.
- **One-Click Apply:** Directly populates the calculated total volume and collateral valuation into the Freight Calculator.

______________________________________________________________________

### 3. Courier Queue

The operational hub for haulers and freight managers:

- **Real-Time KPI Metrics:**
  - **Pending Contracts:** Number of contracts awaiting hauler acceptance.
  - **Active In-Transit Cargo:** Total volume currently moving across shipping lanes.
  - **Outstanding Rewards Pool:** Total ISK awaiting payout upon contract completion.
- **Status Filtering:**
  - Filter by `All Contracts`, `Pending`, `In Progress`, `Finished`, or `Failed / Canceled`.
- **Search:**
  - Real-time search across contract IDs, issuer pilots, origin/destination systems, and structure names.
- **TanStack `BaseTable` DataTable:**
  - Clean, responsive table styling (`variant="fenrir"`).
  - Sortable columns: Contract ID, Issuer, Route & Structure, Volume, Collateral, Reward, and Status.
  - Hauler assignment tracking (`In Progress (Hauler Name)`).
  - Pagination controls with configurable page sizes (10, 25, 50, 100, Show All).

______________________________________________________________________

### 4. Route & Corridor Administration (Route Admin)

Restricted administrative interface for logistics managers (`aafenrir.manage_access`):

- **Route Presets:**
  - Create, update, and delete standardized freight corridors.
  - Configurable parameters:
    - Route name (includes quick-insert helper for `⟷`)
    - Origin and destination solar systems
    - Editable origin and destination structure names (e.g., specific Keepstars or stations)
    - Service type and danger rating
    - Volume limit (m³) and collateral limit (ISK)
    - Base fee, rate per m³, rate per LY, insurance rate (%), minimum reward, and estimated transit time (mins)
- **Route Cards Grid:**
  - 2-column card view of all active routes with service type filter pills and search.
  - Direct Edit and Delete action triggers.
- **Available Systems DataTable:**
  - Manage solar systems available for selection across routes and quotes.
  - **Add System Modal:** Live EVE SDE solar system search with autocomplete (requires 2+ characters).
  - **DataTable:** Powered by TanStack `BaseTable` with sortable columns (System name, Security status with color-coded badges, Region name), pagination, and system removal with confirmation.

______________________________________________________________________

### 5. Cyno Chain Waypoint Manager

Dedicated pipeline management for Jump Freighter routes across Lowsec and Nullsec:

- **Waypoint Pipeline:**
  - Add intermediate cynosural beacon systems between origin and destination.
  - Search any solar system across the EVE SDE with debounced API queries.
  - Quick-add from already configured route systems.
- **Reordering & Management:**
  - Reorder beacons up or down to match the exact in-game jump sequence.
  - Remove individual waypoints.
- **Visual Transit Chain:**
  - Interactive pipeline preview (`Origin ➔ Beacon 1 ➔ Beacon 2 ➔ Destination`) reflected in route cards and quote breakdowns.

______________________________________________________________________

### 6. User Settings & Favorite Corridors

- **Favorite Corridors:**
  - Pilots can select up to 5 favorite corridors to pin as quick-access buttons in the calculator.
- **Notification Preferences:**
  - Toggle and customize logistics notifications.

______________________________________________________________________

## Permissions & Access Control

AA-Fenrir integrates with the standard Alliance Auth permission system:

| Permission ID   | Name          | Scope                                                                                                       |
| :-------------- | :------------ | :---------------------------------------------------------------------------------------------------------- |
| `basic_access`  | Basic Access  | Access to the Freight Calculator, Clipboard Appraiser, Courier Queue, and Personal Settings.                |
| `manage_access` | Manage Access | Access to the Route Admin panel (create, edit, delete routes, cyno waypoints, and available solar systems). |
| `full_access`   | Full Access   | Unrestricted access across all current and future Fenrir features.                                          |

______________________________________________________________________

## UI & UX Architecture

- **Fenrir Dark Theme:**
  - Cyberpunk-inspired dark aesthetic (`#0b0f17`, Slate-900) featuring cyan (`#06b6d4`), emerald (`#10b981`), amber (`#f59e0b`), and rose (`#f43f5e`) accents.
  - Custom border gradients (`fenrir-gradient`, `fenrir-border-500`).
- **Smooth Modal Transitions (`FenrirModal`):**
  - Centralized exit-state caching ensures modals fade out smoothly without content snapping or premature unmounting.
- **TanStack Table Standard:**
  - Consistent DataTables with sorting, facet filtering, dynamic page size selection, and responsive layouts.
- **Internationalization (i18n):**
  - Full multi-language support (German, English, and community-translated languages via Weblate).
