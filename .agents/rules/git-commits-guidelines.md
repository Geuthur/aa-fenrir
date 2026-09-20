# Git Commit & Changelog Guidelines

When suggesting or creating git commits and changelog entries for this repository, always adhere to the following conventions:

## Commit Message Format

Use square bracket prefixes matching the project's changelog sections:

- **`[ADD]`**: New features, components, models, forms, or dependencies.
  - Example: `[ADD] feat(frontend): implement CreateBeltTimerForm with dynamic size selection`
- **`[CHANGE]`**: Updates, refactoring, improvements, or dependency upgrades.
  - Example: `[CHANGE] refactor(frontend): unify modal state and action headers`
- **`[FIX]`**: Bug fixes and error resolutions.
  - Example: `[FIX]: prevent double loading of session data`
- **`[REMOVED]`**: Deleted features, files, or deprecated options.
  - Example: `[REMOVED]: remove obsolete TableWrapper component`

## Commit Body Structure

Include a concise bulleted list in the commit body detailing:

1. What was added, changed, or fixed.
1. Affected components (pages, endpoints, hooks).
1. Any relevant behavioral notes.

## Changelog (`CHANGELOG.md`)

Whenever changes are completed or approved for a commit, **always automatically update `CHANGELOG.md`** under `## [In Development] - Unreleased` (under `<!-- Your changes go here -->`):

- Insert new entries into the matching section:
  - `### Added` for `[ADD]`
  - `### Changed` for `[CHANGE]`
  - `### Fixed` for `[FIX]`
  - `### Removed` for `[REMOVED]`
- If a section does not exist yet under `## [In Development] - Unreleased`, create it respecting the standard section order (`Added`, `Fixed`, `Changed`, `Removed`).
- Keep entries clear, concise, and aligned with Alliance Auth / Keep a Changelog standards.
