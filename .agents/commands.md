# Commands

Prefer **yarn** (Berry / `.yarnrc.yml` in this repo).

```bash
yarn install
yarn build              # rollup → js/ (do not hand-edit js/)
yarn lint               # eslint on lib + tests
yarn prettier           # format lib, tests, docs
yarn test               # all Jest
yarn test:unit          # unit only (prefer while iterating)
yarn test:visual        # visual / image comparison (heavier)
```

Package scripts historically say `npm run …`; use `yarn …` equivalents.

## Done means

1. Ticket acceptance criteria met within factory LoC budget when applicable.
2. No human-review red flags (or HD filed).
3. `yarn test:unit` (and visual tests if rendering/output changed) pass; `yarn lint` clean on touched JS.
4. `js/` regenerated via `yarn build` when `lib/` public output must ship; do not invent parallel bundles.
