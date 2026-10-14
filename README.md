# Pook

A book discovery app. Swipe through books, browse and create lists, and keep a personal
collection of reads — built as a single cross-platform app for iOS and Android.

## Features

- **Discover deck** — Tinder-style swipe screen for books (skip / like), with a flip card:
  the front shows a short blurb with an inline *Show more* link that flips to a full back
  cover with description, meta chips, and *Show less* to flip back.
- **Lists** — search **books and public lists**, preview public lists with cover strips,
  and create your own lists (stored locally). Book search results can be saved straight
  to My Books with a heart button.
- **My Books** — every liked book is collected on its own screen, with remove buttons.
- **Progress** — a slim bar plus "Book X of Y" label shows where you are in a list;
  a Done button (and end-of-list screen) returns you to the lists screen.
- **Local-first account-free** — user lists and liked books persist on-device via
  AsyncStorage; no login required.

Book metadata comes from the [Hardcover](https://hardcover.app) GraphQL API
(`EXPO_PUBLIC_HARDCOVER_API_TOKEN` in `.env`).

## Tech stack

- **[Expo](https://docs.expo.dev/)** (SDK 57) with **[React Native](https://reactnative.dev/)** and **React**
- **[Expo Router](https://docs.expo.dev/router/introduction/)** — file-based routing
- **[TypeScript](https://www.typescriptlang.com/)** with the `@/*` path alias
- **[NativeWind](https://www.nativewind.dev/)** + **[Tailwind CSS](https://tailwindcss.com/)** — styling via `className`
- **[Reanimated](https://docs.swmansion.com/react-native-reanimated/)** + **Gesture Handler** — swipes, card flip, animations
- **[Jest](https://jestjs.io/)** (`jest-expo`) — unit tests for libs and hooks
- **[ESLint](https://eslint.org/)** via `eslint-config-expo`

Native `ios/` and `android/` projects are generated on demand, so native behavior is
configured in `app.json` rather than by editing them directly.

## Project structure

```
src/
  app/          # Expo Router routes (screens + layouts)
    index.tsx       # home
    discover.tsx    # swipe deck (+ progress bar, Done button)
    lists.tsx       # book + list search, public lists
    lists/create.tsx# create/edit a local list
    my-books.tsx    # liked books collection
  components/   # Reusable UI components (discover/, lists/, ui/)
  hooks/        # Data hooks (discover books, book search, lists, liked books…)
  lib/          # Hardcover API client, local stores (user lists, liked books)
  constants/    # Shared constants (fonts, etc.)
  types/        # Shared types
  global.css    # Tailwind entry point
tailwind.config.js   # Design tokens (colors, type scale, spacing)
babel.config.js      # NativeWind setup
metro.config.js      # NativeWind setup
```

## Getting started

```bash
npm install
npx expo start
```

Add your Hardcover API token to `.env` first:

```
EXPO_PUBLIC_HARDCOVER_API_TOKEN=your-token-here
```

From the output you can open the app in Expo Go, an iOS simulator, or an Android emulator.

### Scripts

```bash
npm run ios       # start and open on iOS
npm run android   # start and open on Android
npm run web       # start and open in the browser
npm run lint      # ESLint
npm test          # Jest unit tests
```

## Styling

Styling uses Tailwind utility classes via NativeWind's `className` prop. Design tokens
(colors, type scale, spacing) live in `tailwind.config.js`; add new ones there instead of
hard-coding values.

## Testing

```bash
npm test            # 41 Jest tests (API client, local stores, hooks)
npx tsc --noEmit    # typecheck
npm run lint        # lint
```

Tests cover the Hardcover client (error mapping, batching, rate-limit retries, search
ranking), the local stores (user lists, liked books), and data hooks. There are no
UI/component tests yet.

## What's missing

Known gaps and limitations, roughly by priority:

- **No accounts or sync** — My Books, your lists, and likes live only in this device's
  AsyncStorage. Reinstalling the app (or using another device) loses them; there is no
  login, backup, or cross-device sync.
- **Book search results are capped** — the lists screen shows the first page (25 books)
  only; there's no "load more" for book results yet (list results do paginate).
- **Hardcover API rate limit** — 60 requests/min. Heavy scrolling/searching can hit it;
  we back off and retry, and failed pages/covers recover, but there's no request queue or
  offline cache, so bursts can still feel slow.
- **No personalized recommendations** — discovery browses public lists and popular books;
  nothing is tailored to your likes yet (the data for it is already being collected).
- **Progress bar only in list mode** — the open-ended "All Books" feed has no known total,
  so it shows no progress.
- **My Books is minimal** — save/remove only; no notes, ratings, reading status, sorting,
  or filtering.
- **No offline mode** — browsing needs the network; only your local lists/likes and small
  cover previews are cached.
- **No error tracking or analytics** — failures are surfaced in-app but not reported.
- **Not shipped** — no EAS build config yet (`eas init`), no store submission, English
  only.

## Building

Builds, submissions, and updates run in the cloud with EAS — no local Xcode or Android
Studio required. Run `npx eas-cli init` once first (there's no `eas.json` yet):

```bash
npx eas-cli init   # create the EAS project (once)
npx eas-cli build  # build the app
npx eas-cli submit # submit to the stores
npx eas-cli update # ship an over-the-air update
```

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind documentation](https://www.nativewind.dev/)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
