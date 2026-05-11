# TapMark Architecture (Grounded)

This document only lists architecture details that are directly observable in the codebase. Each statement is linked to a source file.

## App Entry and Navigation
- Root entry renders a `SafeAreaView` and wraps the app in `QueryClientProvider`, `FavoritesProvider`, and `PaymentMethodsProvider`, then mounts a native stack navigator with `Welcome`, `Login`, `Signup`, `Otp`, and `Main` routes. See [App.tsx](App.tsx#L1-L35).
- `Main` renders the bottom tab navigator with five tabs: `Home`, `Cart`, `Search`, `Favourites`, and `Profile`. See [BottomTabs.tsx](BottomTabs.tsx#L154-L207).
- `Home` tab uses a native stack with `HomeIndex`, `SectionList`, `StoreDetails`, `ItemDetails`, and `MapPicker` (modal). See [src/screens/Main/HomeStack.tsx](src/screens/Main/HomeStack.tsx#L1-L23).
- `Cart` tab uses a native stack with `CartIndex`, `Payment`, `Orders`, and `OrderDetails`. See [src/screens/Main/CartStack.tsx](src/screens/Main/CartStack.tsx#L1-L24).
- `Profile` tab uses a native stack with `ProfileHome`, `EditPersonalInfo`, and `PaymentMethods`. See [src/screens/Main/ProfileStack.tsx](src/screens/Main/ProfileStack.tsx#L1-L36).
- Navigation param shapes are declared for `AppStackParamList` and `MainTabParamList`. See [src/schemas/shared.ts](src/schemas/shared.ts#L3-L36).

## Provider Composition and State Layers
- `BottomTabs` wraps tabs in `CartProvider`, `ProfileProvider`, and `LocationProvider`. See [BottomTabs.tsx](BottomTabs.tsx#L159-L207).
- `CartProvider` maintains cart lines and totals, fetches an active cart via API calls, and uses React Query for mutations and queries. See [src/context/CartContext.ts](src/context/CartContext.ts#L1-L221).
- `FavoritesProvider` keeps a list of favorite store IDs and loads/saves them from storage. See [src/context/FavoritesContext.ts](src/context/FavoritesContext.ts#L1-L72) and [src/utils/favourites.ts](src/utils/favourites.ts#L1-L10).
- `LocationProvider` uses `expo-location` to request permission, get current location, reverse geocode, and persist recent locations. See [src/context/LocationContext.ts](src/context/LocationContext.ts#L1-L132) and [src/utils/locations.ts](src/utils/locations.ts#L1-L10).
- `PaymentMethodsProvider` stores payment methods in local state and persists them. See [src/context/PaymentMethodsContext.ts](src/context/PaymentMethodsContext.ts#L1-L93) and [src/utils/payment-methods.ts](src/utils/payment-methods.ts#L1-L77).
- `ProfileProvider` loads profile data from storage and retrieves or creates a user wallet via API, using React Query to fetch wallet data. See [src/context/ProfileContext.ts](src/context/ProfileContext.ts#L1-L86).

## Data Fetching and API Layer
- API calls are organized in domain folders under `src/functions/` (auth, cart, cart-items, orders, payments, store-items, stores, users, wallets, campuses). See [src/functions](src/functions).
- Axios is centralized in an instance with token and refresh-token headers set from secure storage. See [src/utils/axios-instance.ts](src/utils/axios-instance.ts#L1-L28) and [src/utils/tokens.ts](src/utils/tokens.ts#L1-L12).
- React Query is used in screens and contexts (e.g., `HomeScreen` and `CartContext`) to fetch server data. See [src/screens/Main/HomeScreen.tsx](src/screens/Main/HomeScreen.tsx#L1-L190) and [src/context/CartContext.ts](src/context/CartContext.ts#L1-L221).

## Persistence and Client Utilities
- Secure storage is used for tokens, cart ID, favorites, locations, payment methods, and profile data. See [src/utils/tokens.ts](src/utils/tokens.ts#L1-L12), [src/utils/cart.ts](src/utils/cart.ts#L1-L8), [src/utils/favourites.ts](src/utils/favourites.ts#L1-L10), [src/utils/locations.ts](src/utils/locations.ts#L1-L10), [src/utils/payment-methods.ts](src/utils/payment-methods.ts#L1-L77), and [src/utils/profile.ts](src/utils/profile.ts#L1-L10).
- Toast notifications use `react-native-toast-message` via a helper function. See [src/utils/notifications.ts](src/utils/notifications.ts#L1-L12).
- Shared geospatial utility `getGpsDistanceInMeters` is used for distance-based logic in the home screen. See [src/utils/shared.ts](src/utils/shared.ts#L1-L27) and [src/screens/Main/HomeScreen.tsx](src/screens/Main/HomeScreen.tsx#L31-L110).

## Domain Models and Validation
- Validation is implemented with Zod for auth schemas. See [src/schemas/auth.ts](src/schemas/auth.ts#L1-L23).
- Types for cart and invoices are defined as TypeScript types. See [src/schemas/cart.ts](src/schemas/cart.ts#L1-L16).

## UI Composition Entry Points
- The home screen composes reusable components (`HomeHeader`, `CategoryStrip`, `HomeSectionCarousel`, and `StoreCard`) and wires them to data from location and store search queries. See [src/screens/Main/HomeScreen.tsx](src/screens/Main/HomeScreen.tsx#L1-L206).
- Store details screen loads store items via search and renders a grid of cards built inline. See [src/screens/details/StoreDetailsScreen.tsx](src/screens/details/StoreDetailsScreen.tsx#L1-L232).

## Runtime Dependencies (Observed)
- Expo + React Native setup, React Navigation, React Query, Axios, Styled Components, and Zod are present in dependencies. See [package.json](package.json#L1-L41).
