# Frontend Translation Guidelines (i18n)

When working on frontend code in this repository, strictly adhere to the following internationalization (i18n) and translation rules:

______________________________________________________________________

## 1. Golden Rule: Immediate German Translation for Every `t()`

- **Never leave newly added `t(...)` keys untranslated in `de/translation.json`**:
  - Whenever you add, modify, or encounter a user-facing string wrapped in `t('...')` in the React frontend (`frontend/src/`), you **MUST** immediately provide and insert the German translation into `frontend/i18n/de/translation.json`.
  - Do **not** leave English placeholder values for new keys in `de/translation.json`.

______________________________________________________________________

## 2. Standard Translation Workflow

Whenever new UI strings or `t('...')` calls are introduced:

1. **Scan and Extract with `make react-translations`**:

   - Run:
     ```bash
     make react-translations
     ```
   - This executes `i18next-scanner` (via `npm run buildTranslations` in `frontend/`), which parses all `t(...)` calls across `src/**/*.{js,jsx,ts,tsx}` and adds missing keys across all locale files in `frontend/i18n/`.

1. **Translate into German (`de/translation.json`)**:

   - Immediately inspect the newly added keys in `frontend/i18n/de/translation.json`.
   - Replace the default English values with accurate, idiomatic German translations tailored to EVE Online and Alliance Auth terminology:
     - **EVE Online Terminology Conventions**:
       - *Courier*: Kurier / Kuriervertrag
       - *Collateral*: Sicherheit / Pfand
       - *Reward*: Belohnung
       - *Solar System*: Sonnensystem
       - *Light-Year (LY)*: Lichtjahr (LJ / LY)
       - *Corridor / Preset*: Korridor / Routen-Vorlage
       - *Queue*: Warteschlange
       - *Stargate Transit*: Stargate-Sprünge / Transit
       - *Jump Drive Distance*: Jump-Drive-Distanz / Sprungdistanz
       - *Status (Pending, In Progress, Finished, Failed)*: Ausstehend, In Bearbeitung, Abgeschlossen, Fehlgeschlagen

1. **Sync English Locale (`en/translation.json`)**:

   - Ensure that `frontend/i18n/en/translation.json` contains the exact same keys with proper English values.

1. **Synchronize & Deploy Assets**:

   - Copy translations to Django static directory:
     ```bash
     make react-copy-translations
     ```
   - Build assets and copy them:
     ```bash
     npm run build
     make react-copy-assets
     ```

______________________________________________________________________

## 3. Writing Translatable Strings in React (`frontend/src/`)

- **Always Wrap User-Facing Text**:

  - Never hardcode raw user-visible text in JSX/TSX without `t(...)`.
  - Import `useTranslation` from `react-i18next`:
    ```typescript
    import { useTranslation } from 'react-i18next';

    export function MyComponent() {
      const { t } = useTranslation();
      return <div>{t('My translatable text')}</div>;
    }
    ```

- **Use Interpolation Instead of String Concatenation**:

  - ❌ **Incorrect**:
    ```typescript
    <span>{t('Showing') + ' ' + start + ' ' + t('to') + ' ' + end}</span>
    ```
  - ✅ **Correct**:
    ```typescript
    <span>
      {t('Showing {{start}}-{{end}} of {{total}} contracts', {
        start,
        end,
        total,
      })}
    </span>
    ```

- **Pluralization**:

  - For counts, use `count` in the interpolation object and support `_one` and `_other` in translation files:
    ```typescript
    t('{{count}} Rows', { count: totalRows });
    ```
    In `de/translation.json`:
    ```json
    "{{count}} Rows_one": "{{count}} Zeile",
    "{{count}} Rows_other": "{{count}} Zeilen"
    ```
