# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A single-file React dashboard (`karma.jsx`) that visualizes PR review queues with a retro/pixel-art aesthetic. It renders animated PR cards with staleness-based moods, team karma scores, and filtering controls.

## Architecture

Everything lives in `karma.jsx` — there is no build system, package.json, or separate files. It's designed to be dropped into a React sandbox (e.g., CodeSandbox, StackBlitz, or a Vite/CRA project as a component).

### Key concepts

**Staleness** (`getStaleness`): `lastActivityHours` — hours since the last meaningful event (push, review, comment). This drives all mood/color/animation logic, not `openedHours`.

**Karma** (`computeKarma`): Per-person score derived from `MOCK_PRS`.
- `blocking` = sum of staleness of PRs where the person is a *pending* reviewer
- `blocked` = sum of staleness of PRs the person authored where reviewers are pending
- `net = blocked - blocking` (positive = being held up more than holding others up)
- Angels (halo) = net victims (`blocked > blocking`); Devils (horns) = net blockers (`blocking >= blocked`)

**Staleness thresholds** (used consistently throughout):
- `< 8h` → green / happy / bounce
- `8–24h` → lime / mild wobble
- `24–48h` → yellow / pulse
- `48–72h` → orange / sweat drop / anxious shake
- `72h+` → red / anger sparks / rage shake

### Components

- `PixelAvatar` — SVG pixel-art face with seeded random traits (skin, hair, accessories). Expression changes based on `hoursWaiting`. Reviewer ring color encodes review status.
- `SizeChip` — colored badge for PR size (S/M/L/XL).
- `PRCard` — main card with animated staleness state, author avatar, reviewer avatars, diff stats, status pill, and time indicators. Animation class driven by staleness bucket.
- `KarmaFilterPanel` — team karma panel showing all people sorted by blocking score. Clicking ✏️/👁 badges toggles author/reviewer filters.
- `PRTamagotchi` (default export) — root component managing filter state and rendering the header, status chips, karma panel, and PR grid.

### Data

`MOCK_PRS` at the top of the file is the only data source. Each PR has:
- `openedHours`, `lastActivityHours` — time fields
- `author` — `{ name, initials, hue, seed }` — `hue` sets the person's color theme; `seed` deterministically generates avatar traits
- `reviewers` — array with same shape plus `status: 'pending'|'approved'|'changes_requested'`

`getAllPeople()` derives the unique people list from `MOCK_PRS` at runtime.

## Fonts

Loaded from Google Fonts via `@import` in the inline `<style>` block: `DM Mono` (monospace body) and `Silkscreen` (pixel title).
