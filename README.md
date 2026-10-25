# Fenne mobile app

Fenne is a household meal planner built with Expo, React Native and TypeScript. Its main screens are Menu, Groceries, Pantry and Recipes. Domain terminology is documented in the workspace's `../CONTEXT.md`; repository conventions are in [AGENTS.md](AGENTS.md).

## Development

Use Bun; `bun.lock` is the dependency lockfile.

```sh
bun install --frozen-lockfile
bun run start
```

The app uses native modules and a development build. If the development app and Metro are already running, use those processes. Native builds are separate, explicit operations through `bun run ios` or `bun run android`; source-only changes normally use the existing development session.

The backend address is configured in the app, not in source. On first run, "Get Started" opens a required screen where the user enters the full backend URL including the port (for example `http://192.168.1.10:4000` on a physical phone, or `http://10.0.2.2:4000` on an Android emulator); it is stored in [lib/backend-url.ts](lib/backend-url.ts) and can be changed later from Settings → Backend URL. [api/client.ts](api/client.ts) adds `/v2` to request paths, and ActionCable derives its address from the same host. Installs from before this screen existed fall back to the hosted API.

## Checks

```sh
bunx tsc --noEmit
bun run lint
bun run test --watchAll=false --runInBand
```

Tests use the existing Jest/Expo configuration. For a focused run, append the test file path to the last command. Runtime mobile verification uses Argent against the already-running app; see [AGENTS.md](AGENTS.md).

## Where behavior lives

- `app/`: Expo routes; authenticated tabs are under `app/(app)/(tabs)/`.
- `api/`: v2 requests, query hooks and mutation behavior.
- `components/form/`: shared TanStack Form controls and structured validation feedback.
- `components/bottomSheets/`, `sheets.tsx`, `lib/sheet-context.tsx`: sheet content, registration and presentation.
- `lib/session.ts`, `contexts/session.tsx`, `lib/family-data.ts`: session changes and scoped data refresh.
- `lib/backend-url.ts`: the configured backend address used by every request.
- `hooks/`, `utils/`: workflow state and domain calculations/search.
- `date-tools.ts`, `constants/colors.ts`: shared date behavior and color tokens.

Use the existing form, session and sheet owners when extending workflows. They handle field errors, cancellation and stale work across account changes.
