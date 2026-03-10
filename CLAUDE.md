# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Next.js dashboard that visualizes PR review queues with a retro/pixel-art aesthetic. It renders animated PR cards with staleness-based moods, team karma scores, and filtering controls. Data comes from the live GitHub API — there is no mock data.

## Architecture

This is a standard Next.js App Router project. Key files:

- `app/page.jsx` — root page; fetches PRs, manages filter state, renders layout
- `app/api/github/prs/route.js` — API route that fetches PRs + reviews + head commit from GitHub
- `lib/github.js` — transforms raw GitHub API responses into the internal PR shape
- `lib/staleness.js` — `getStaleness`, `getBlockedBy`, `getAllPeople`, `computeKarma`
- `lib/formatters.js` — `formatWait`, `getMoodColor`, `getCardBg`, `getAnimClass`
- `lib/avatarTraits.js` — seeded random avatar trait generation
- `components/PRCard.jsx` — main PR card component
- `components/KarmaFilterPanel.jsx` — team karma panel with filter buttons
- `components/StatusChips.jsx` — status filter chips (ALL / AWAITING REVIEW / RE-REVIEW / APPROVED / NEEDS CHANGES / STALE)
- `components/PixelAvatar.jsx` — SVG pixel-art face
- `components/SizeChip.jsx` — PR size badge (S/M/L/XL)
- `components/GitHubSync.jsx` — sync status button and panel
- `components/LoadingScreen.jsx` — loading/error state

### Key concepts

**Staleness** (`getStaleness`): `lastActivityHours` — hours since the last meaningful event (push, review, comment). This drives all mood/color/animation logic, not `openedHours`.

**Karma** (`computeKarma` in `lib/staleness.js`):
- `blocking` = sum of staleness of PRs where the person is a pending/re_review_needed reviewer
- `blocked` = sum of staleness of PRs the person authored where reviewers are pending/re_review_needed
- `net = blocked - blocking` (positive = being held up more than holding others up)
- Angels (halo) = net victims (`blocked > blocking`); Devils (horns) = net blockers (`blocking >= blocked`)

**Reviewer statuses** (explicit field on each reviewer, derived in `lib/github.js`):
- `pending` — hasn't reviewed yet
- `approved` — approved the PR
- `changes_requested` — requested changes, author hasn't pushed a response yet
- `re_review_needed` — reviewer requested changes and author has since pushed new commits; ball is back in reviewer's court. Derived by comparing `review.submitted_at` vs the HEAD commit's `committer.date`.

**Staleness thresholds** (used consistently throughout):
- `< 8h` → green / happy / bounce
- `8–24h` → lime / mild wobble
- `24–48h` → yellow / pulse
- `48–72h` → orange / sweat drop / anxious shake
- `72h+` → red / anger sparks / rage shake

### Data shape

Each PR passed to components has:
- `id`, `title`, `branch`, `url`
- `openedHours`, `lastActivityHours`
- `author` — `{ name, initials, hue, seed }`
- `reviewers` — array of `{ name, initials, hue, seed, status }`
- `comments`, `size`, `additions`, `deletions`

## Environment

```
GITHUB_PAT=       # server-only personal access token
GITHUB_OWNER=     # repo owner (org or user)
GITHUB_REPO=      # repo name
NEXT_PUBLIC_LINEAR_SLUG=  # optional, enables Linear issue links in PR titles
```

## Fonts

`DM Mono` (body) and `Silkscreen` (title) loaded from Google Fonts in `app/layout.jsx`.
