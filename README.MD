# TapMark

TapMark is the customer-facing Expo React Native app in a 3-app campus delivery system. This repo contains the mobile client used to browse stores, manage a cart, place orders, and work with profile and payment data.

## Prerequisites

Before you start, make sure you have:

- Node.js and npm
- Expo CLI tooling available through `npx`
- Android Studio or an Android emulator if you want to run Android locally
- Xcode if you want to run iOS locally on macOS
- A valid backend URL and the environment values required by the API and maps features

## Install

```bash
npm install
```

## Environment Setup

Create a local `.env` file at the project root before running the app. The codebase reads these values directly at runtime:

```bash
EXPO_PUBLIC_BACKEND_URL=https://your-api-host
EXPO_PUBLIC_DELIVERY_FEE_PER_100_METER=0.5
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
```

Keep the backend URL pointed at the environment you want to test against. If you change env values, restart the Expo bundler so the new values are picked up.

## Native Files

Before you run a native build, make sure these files are in place:

- `google-services.json` at the project root. The Expo config already points Android to `./google-services.json` in [app.json](app.json#L1).
- The Firebase notification credentials file used by your notification setup. If your notification backend relies on a Firebase service-account or admin SDK JSON file, keep it in the location your build or server expects and do not commit it.

Notes:

- `google-services.json` is already ignored in [`.gitignore`](.gitignore#L1).
- If the notification credentials file is also generated per environment, keep it out of source control as well.

## Run Locally

```bash
npm expo start
```

Other useful scripts:

```bash
npm run android
npm run ios
npm run web
```

If you are using a development build, start the app with the same Expo command and open it in the installed dev client.

## Build

For installable builds, use the EAS profiles defined in [eas.json](eas.json): `development`, `preview`, and `production`.

Example flow:

```bash
npx eas build --platform android --profile development
```

If the app will send push notifications, also confirm:

- The device can request notification permission successfully.
- The Expo project ID in [app.config.js](app.config.js) is correct.
- The backend can store and use the Expo push token.

## New Developer Map

If you are trying to understand the app quickly, start here:

- [App.tsx](App.tsx) sets up the root navigation stack, query client, auth bootstrap, and notification handling.
- [BottomTabs.tsx](BottomTabs.tsx) renders the main tab navigator and wraps the app in the client-side providers used by the signed-in experience.
- [src/screens/Main/HomeStack.tsx](src/screens/Main/HomeStack.tsx) shows the signed-in home flow and how it opens store, item, and map screens.
- [src/context/CartContext.ts](src/context/CartContext.ts) is the best entry point for the cart state and query/mutation flow.
- [src/functions/auth/login.ts](src/functions/auth/login.ts) shows the shape of the API layer and how request helpers are organized by domain.
- [src/utils/axios-instance.ts](src/utils/axios-instance.ts) and [src/utils/tokens.ts](src/utils/tokens.ts) show how API headers and secure storage are wired.

## Project Structure

- `App.tsx` contains app bootstrap, navigation, and auth state restoration.
- `BottomTabs.tsx` contains the signed-in tab navigator.
- `src/screens/` contains the feature screens and stacks.
- `src/components/` contains shared UI building blocks.
- `src/context/` contains React context providers for app state.
- `src/functions/` contains API calls grouped by domain.
- `src/schemas/` contains validation and type definitions.
- `src/utils/` contains persistence, network, and helper utilities.

## Useful References

- [Architecture notes](docs/architecture.md)
- [Component notes](docs/components.md)
- [UI rules](docs/ui_rules.md)

## Branches
 - **`Production`**: This is the branch for production codebase. Whatever pushed here goes to production
 - **`Staging`**: This is the testing evironment before the code goes into production. User might have to use a local dev server exposed via some port forwarding or similar technology.
 - **`feature/*`**: branches for feature currently being built. Example "feature/add-bank-payment-method"
 - **`bugfix/*`**: branches for bug fixes. Example "bugfix/map-not-zooming-properly"

***Note***: During building never use the production or staging branch. Always create a separate branch for what youre doing.

## Pushing Code
 - Never push to main/production directly. It is protected
 - Push to staging and raise a pull request to be merged.
 - Always make sure CI/CD automation runs and passes successfully.