# Agent instructions

JavaScript PDF engine fork of PDFKit, adapted for React Native (dependency injection, async-first, font registry). Consumed by `printed-labels` via `file:../react-native-pdfkit` — not published to npm from this tree.

## How to use this file

Keep this root file short. **Read `.agents/` links only when their “when” clause matches**, then confirm you loaded them. Do not preload the whole directory.

Always-on hard rules:

- Do not vendor/inline additional third-party source trees into `lib/` (existing `lib/vendor/*` is grandfathered — extend via packages or clear HD approval).
- Do not add new binary blobs or create/grow files to ≥10k lines (built `js/` bundles and existing huge visual fixtures are grandfathered — do not hand-expand them; prefer smaller targeted tests).
- Edit sources under `lib/`; treat `js/` as build output (`yarn build` / rollup), not a place for feature work.

## Load on demand

- [.agents/commands.md](.agents/commands.md) — when installing, building, linting, or testing
- [.agents/human-review.md](.agents/human-review.md) — before vendoring, adding binaries, or large files
- [.agents/coding-javascript.md](.agents/coding-javascript.md) — when changing `lib/`, tests, rollup, or RN adapter behavior

## Cursor rules and factory skills

This repo has no `.cursor/rules/` yet. In a multi-root workspace with `printed-labels`, that app’s `alwaysApply` rules may still appear in context — ignore app-only rules (RTL, translations, Material colors) when working here.

Factory work: open the **software-factory** skill when processing a Trello Agents card with `Repo: react-native-pdfkit`. Follow this `AGENTS.md` + matching `.agents/` files for this repo.
