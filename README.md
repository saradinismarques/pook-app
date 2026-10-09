# Pook

A book discovery app. Find your next read, keep track of the books you own, and get
recommendations — built as a single cross-platform app for iOS, Android, and the web.

## Tech stack

- **[Expo](https://docs.expo.dev/)** (SDK 57) with **[React Native](https://reactnative.dev/)** and **React**
- **[Expo Router](https://docs.expo.dev/router/introduction/)** — file-based routing
- **[TypeScript](https://www.typescriptlang.org/)** with the `@/*` path alias
- **[NativeWind](https://www.nativewind.dev/)** + **[Tailwind CSS](https://tailwindcss.com/)** — styling via `className`
- **[Reanimated](https://docs.swmansion.com/react-native-reanimated/)** — splash screen animation
- **[ESLint](https://eslint.org/)** via `eslint-config-expo`

Native `ios/` and `android/` projects are generated on demand, so native behavior is
configured in `app.json` rather than by editing them directly.

## Project structure

```
src/
  app/          # Expo Router routes (screens + layouts)
  components/   # Reusable UI components
  constants/    # Shared constants (fonts, etc.)
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

From the output you can open the app in Expo Go, an iOS simulator, an Android emulator,
or a development build.

### Scripts

```bash
npm run ios       # start and open on iOS
npm run android   # start and open on Android
npm run web       # start and open in the browser
npm run lint      # ESLint
```

## Styling

Styling uses Tailwind utility classes via NativeWind's `className` prop. Design tokens
(colors, type scale, spacing) live in `tailwind.config.js`; add new ones there instead of
hard-coding values.

## Building

Builds, submissions, and updates run in the cloud with EAS — no local Xcode or Android
Studio required:

```bash
npx eas-cli build     # build the app
npx eas-cli submit    # submit to the stores
npx eas-cli update    # ship an over-the-air update
```

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind documentation](https://www.nativewind.dev/)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
