# React Development Guidelines

When working on frontend code in this repository, strictly adhere to the following rules:

## 1. Always Use `@/` Import Paths (Never Relative `./` or `../`)

- All internal project imports and exports must **always** use the `@/` path alias (which resolves to `frontend/src/`).
- Do **not** use relative imports such as `./` or `../`.

### Examples:

```typescript
// ❌ INCORRECT (relative paths)
import { SnapshotSelect } from './SnapshotSelect';
import { formatDate } from '../../Helpers/functions';
import BaseTable from '../BaseTable';
export { default as SnapshotButtons } from './SnapshotButtons';

// ✅ CORRECT (always use @/)
import { SnapshotSelect } from '@/Components/Tables/Snapshot/SnapshotSelect';
import { formatDate } from '@/Components/Helpers/functions';
import BaseTable from '@/Components/Tables/BaseTable';
export { default as SnapshotButtons } from '@/Components/Tables/Snapshot/SnapshotButtons';
```

## 2. Topic-Based Component Folders (under `Tables/`, etc.)

- Organize related subcomponents into dedicated topic folders (e.g. `Components/Tables/Snapshot/`).
- Keep components small, modular, and focused (e.g., `<SnapshotSelect />`, `<SnapshotButtons />`).
- Each folder should contain an `index.ts` file that re-exports components using `@/` path aliases.

### Example Structure:

```text
frontend/src/Components/Tables/
├── Snapshot/
│   ├── SnapshotSelect.tsx    # Dropdown selector component
│   ├── SnapshotButtons.tsx   # Action buttons component (Add/Delete)
│   └── index.ts              # Exports using @/ aliases
├── BaseTable.tsx
└── ...
```

## 3. Import Grouping & Ordering

Follow the project import order convention:

1. **React**:
   ```typescript
   import { useState, useMemo } from 'react';
   import { useParams } from 'react-router-dom';
   ```
1. **Third-Party Libraries**:
   ```typescript
   import { useQuery } from '@tanstack/react-query';
   import Form from 'react-bootstrap/Form';
   import { useTranslation } from 'react-i18next';
   ```
1. **AA Belt Radar (`@/`)**:
   ```typescript
   import { queryKeys } from '@/Api/query';
   import { formatDate } from '@/Components/Helpers/functions';
   import { SnapshotButtons, SnapshotSelect } from '@/Components/Tables/Snapshot';
   ```
1. **Styles & CSS**:
   ```typescript
   import styles from '@/Components/Tables/BaseTable.module.css';
   ```

## 4. TypeScript & Prop Interfaces

- Export explicit TypeScript prop interfaces for components (`export interface ...Props`).
- Provide sensible defaults for optional arrays or identifiers (`snapshots = []`, etc.).

## 5. Page & Component Architecture (`Pages/` vs `Components/<PageName>/`)

- **Pages (`src/Pages/`) should only act as orchestrators**:
  - Keep page files lean and focused on high-level concerns: routing, top-level queries/mutations, auth/permission checks, and layout composition.
  - Do **not** embed massive forms, long tables, or complex UI blocks directly inside page files.
- **Page-specific Components (`src/Components/<PageName>/`)**:
  - Components that belong to a specific page must be placed in `src/Components/<PageName>/` (e.g. `src/Components/RouteAdmin/RouteCard.tsx`, `src/Components/RouteAdmin/RouteAdminHeader.tsx`).
  - If a feature has further sub-components, group them into subfolders (e.g. `src/Components/Freight/Calculator/`).
  - Provide an `index.ts` file in each component directory that re-exports components using `@/` path aliases.
  - Add clear code comments and hints to components so other developers can easily navigate and edit them.

## 6. Modals Architecture (`Modals/` vs `Components/<PageName>/Modals/`)

- **Only Generic / Base Modals in `src/Components/Modals/`**:
  - The `src/Components/Modals/` folder is reserved **strictly for generic, reusable base modals** (specifically `src/Components/Modals/BaseModal/` and `src/Components/Modals/FenrirModal/`).
  - Do **not** place page-specific modals in `src/Components/Modals/`.
  - All modals must be built using `react-bootstrap`'s `Modal` component (via `FenrirModal`, which wraps `react-bootstrap`'s `Modal` with custom dark/cyan Fenrir styling in `FenrirModal.module.css`).
- **Page-specific Modals (`src/Components/<PageName>/Modals/`)**:
  - All page- or feature-specific modals must reside inside their respective page component directory:
    - `src/Components/RouteAdmin/Modals/` (e.g. `CreateRouteModal.tsx`, `DeleteRouteModal.tsx`)
    - `src/Components/Calculator/Modals/` (e.g. `ContractModal.tsx`, `ConfigurePresetsModal.tsx`)
    - `src/Components/Queue/Modals/` (e.g. `QueueStatusModal.tsx`)
  - Each `Modals/` folder must include an `index.ts` re-exporting its modals using `@/` path aliases.
  - Export explicit TypeScript prop interfaces for every modal (e.g. `isOpen`, `onClose`, `onSubmit`, `isPending`).
  - Provide clear hints and comments so other developers understand the purpose and usage.
- **No Submit via Enter Key in Modals (Button-Only Submission)**:
  - In all modals and forms, submission must **only** be triggered explicitly by clicking a button.
  - Never allow implicit form submission via the Enter key in input fields.
  - Forms inside modals must be defined with `<form onSubmit={(e) => e.preventDefault()}>` and action buttons must use `<Button type="button" onClick={handleSave}>` instead of `type="submit"`.

## 7. React-Bootstrap Components Usage (`Button`, `Tooltip`, `Modal`, `Form`, etc.)

- **Always use `react-bootstrap` components wherever applicable** instead of raw HTML elements or ad-hoc wrappers:
  - **Modals**: Always use `FenrirModal` (which wraps `react-bootstrap`'s `Modal` with `FenrirModal.module.css`). Never create custom fixed-overlay `div` modals from scratch.
  - **Buttons**: Use `react-bootstrap`'s `Button` (`variant="primary"`, `variant="outline-info"`, `variant="danger"`, etc.) with appropriate size and variant props.
  - **Tooltips & Popovers**: Use `react-bootstrap`'s `Tooltip` and `OverlayTrigger` instead of custom tooltip divs or title attributes.
  - **Forms**: Use `react-bootstrap`'s `Form`, `Form.Control`, `Form.Select`, `Form.Check`, etc.
  - **Alerts & Badges**: Use `react-bootstrap`'s `Alert`, `Badge`, etc.
- When custom styling or theme adaptation (dark/cyan EVE theme) is needed, apply CSS modules (e.g. `*.module.css`) or Tailwind utilities alongside the `react-bootstrap` component (e.g., via `className`).

## 8. Internationalization (i18n) & Translations

- **Always wrap user-facing text in `t('...')` from `react-i18next`**.
- **Immediate German Translation**: Whenever a new `t(...)` key is introduced, you **must** immediately provide the German translation in `frontend/i18n/de/translation.json`.
- Refer to \[`.agents/rules/translation-guidelines.md`\](file:///home/github/aa-fenrir/.agents/rules/translation-guidelines.md) for the complete workflow (`make react-translations`, German EVE Online terminology, and `make react-copy-translations`).
