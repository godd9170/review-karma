# Review Karma

Review Karma is a retro-styled pull request dashboard that helps teams see review bottlenecks at a glance.
It visualizes open PRs, reviewer status, and who is blocking whom using color, animation, and a simple karma score.

## What this tool does

- Syncs open PRs from GitHub (`/api/github/prs`)
- Converts GitHub data into a UI-friendly shape (author, reviewers, staleness, diff size, comments)
- Highlights stale PRs with stronger colors/animations as wait time increases
- Shows team-level blocking vs blocked impact in the **Team Karma** panel
- Lets you filter by author, reviewer, and PR status

## UI guide

### Header

- **REVIEW KARMA / PR QUEUE**: dashboard title
- **GITHUB button**: opens sync panel and refreshes PR data
- **LIVE clock**: local time indicator

### Status chips

- `pending`: PRs with at least one pending reviewer
- `approved`: all reviewers approved
- `changes`: at least one reviewer requested changes
- `stale`: PRs with staleness `>= 48h`

### Team Karma panel

Each person card includes:

- Avatar (with halo/horns visual cues)
- Net badge (`blocked - blocking`)
- `✏️` button: filter PRs authored by this person
- `👁` button: filter PRs where this person is a reviewer

Karma terms:

- **blocking**: total staleness hours for PRs where the person is a pending reviewer
- **blocked**: total staleness hours for PRs they authored that are waiting on review
- **net**: `blocked - blocking` (positive means they are waiting on others more than others wait on them)

### PR cards

Each card shows:

- Author avatar, PR title (and link to GitHub if available)
- Size chip (`S`, `M`, `L`, `XL`) and `+/-` diff stats
- Current review state pill (`awaiting review`, `approved`, `changes needed`)
- `idle` timer (staleness) and `opened` timer (total PR age)
- Branch name, comment count, and reviewer avatars

Reviewer avatar ring colors:

- Green: approved
- Red: changes requested
- Gray: pending

## Staleness model (drives mood and animation)

Staleness is based on `lastActivityHours` (not PR age):

- `< 8h`: green / happy
- `8–24h`: lime / mild wobble
- `24–48h`: yellow / pulse
- `48–72h`: orange / anxious shake
- `72h+`: red / rage shake

## Getting started

### Prerequisites

- Node.js 18+
- A GitHub personal access token with repo read access

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:

   ```bash
   cp .env.local.example .env.local
   ```

3. Edit `.env.local`:

   - `GITHUB_PAT`: GitHub PAT used by the server API route
   - `GITHUB_OWNER`: org/user name
   - `GITHUB_REPO`: repository name
   - `NEXT_PUBLIC_LINEAR_SLUG` (optional): enables linking `LL-####` IDs to Linear

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

Production commands:

```bash
npm run build
npm run start
```

## Project structure

- `app/page.jsx`: dashboard state, filters, layout
- `app/api/github/prs/route.js`: GitHub API fetch + auth handling
- `components/*`: UI building blocks (cards, avatars, sync panel, filters)
- `lib/staleness.js`: staleness + karma calculations
- `lib/github.js`: transforms GitHub PR/review payloads
- `lib/mockData.js`: local mock data shape reference
- `karma.jsx`: legacy single-file version of the dashboard for sandbox usage

## Notes for developers

- No dedicated test suite is currently configured.
- Styling is primarily inline with shared animations in `app/globals.css`.
- Fonts are loaded from Google Fonts (`DM Mono`, `Silkscreen`).
