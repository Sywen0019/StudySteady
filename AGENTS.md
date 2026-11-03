# Repository Guidelines

## Project Structure & Module Organization
StudySteady is a browser-only learning dashboard built with Vue 3, Vue Router, and Vite. `src/main.js` boots the app; `src/App.vue` provides the shell. Route pages live in `src/views/`, with routes in `src/router/index.js`. Group reusable components by feature under `src/components/`; shared primitives belong in `components/ui/`.

Keep business rules and persistence in `src/stores/study.js`, shared timer logic in `src/composables/useFocusTimer.js`, and local-calendar helpers in `src/utils/date.js`. Global styles and theme variables live in `src/assets/styles.css`; static files live in `public/`. Tests are in `tests/`, and maintenance scripts are in `scripts/`. Treat `dist/` and `artifacts/` as generated output.

## Build, Test, and Development Commands
Use Node.js 22.12.0 or newer; `.nvmrc` pins 22.12.0.

- `npm ci`: install dependencies from the lockfile.
- `npm run dev`: start Vite, normally at `http://localhost:5173`.
- `npm run build`: generate the production bundle in `dist/`.
- `npm run preview`: serve the production build locally.
- `npm test`: run Node's built-in unit tests.
- `npm run test:e2e`: run Playwright browser flows against a running server.
- `npm run audit`: check route count and component reachability; this is a component audit, not a dependency vulnerability scan.

## Coding Style & Naming Conventions
Follow existing two-space indentation, double-quoted JavaScript strings, semicolons, and ES modules. Use Vue Composition API with `<script setup>`. Name components in PascalCase (`TaskEditor.vue`), route views `*View.vue`, and composables `use*.js`. Use camelCase for functions and variables and kebab-case for CSS classes. Reuse theme variables. No formatter or linter is configured. Keep interface text consistent with the existing Chinese UI.

## Testing Guidelines
Name unit tests `tests/*.test.js` and use `node:test` with strict assertions. Cover changed business rules, persistence, import validation, and timer/date edge cases; no coverage threshold is configured. Browser scenarios live in `tests/e2e.mjs`. Install Chromium with `npx playwright install chromium`, start `npm run dev` separately, then run `npm run test:e2e`. Set `BASE_URL` to target another server. Check responsive layouts and keyboard behavior for UI changes.

## Commit & Pull Request Guidelines
History uses descriptive imperative subjects, sometimes prefixed with `docs:`; no uniform convention is established. Write focused commits. PRs should explain behavior changes, link related issues, list validation performed, and include screenshots for UI changes.

## Data & Configuration
Learning data stays in LocalStorage. Preserve backup compatibility and validate imports before replacing state. Use local `YYYY-MM-DD` helpers for calendar dates. Keep secrets out of source control; `.env` files are ignored.
