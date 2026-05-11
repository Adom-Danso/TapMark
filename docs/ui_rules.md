# UI Rules (Grounded)

This document lists UI rules observed in code and design tokens. Each item links to code.

## Design Tokens
- Color tokens are defined in [src/screens/auth/authTheme.js](src/screens/auth/authTheme.js#L1-L12):
  - `background: #FFF7F3`
  - `card: #FFFFFF`
  - `primary: #801818`
  - `primaryDark: #6A1313`
  - `primarySoft: #F6D7D7`
  - `text: #1E1A1A`
  - `muted: #7B6F6F`
  - `line: #EFE7E3`
  - `shadow: rgba(128, 24, 24, 0.12)`
- Radius tokens are defined in [src/screens/auth/authTheme.js](src/screens/auth/authTheme.js#L14-L18): `card: 18`, `pill: 28`, `input: 12`.
- Spacing tokens are defined in [src/screens/auth/authTheme.js](src/screens/auth/authTheme.js#L20-L24): `screenX: 22`, `screenY: 18`, `block: 16`, `tight: 10`.

## Color Usage Patterns
- Primary brand color and muted text appear across navigation and cards (e.g., tab bar icons and labels in [BottomTabs.tsx](BottomTabs.tsx#L85-L169)).
- `primarySoft` is used as a soft background for pills and halos (e.g., `CategoryTile` halo in [src/components/CategoryTile.tsx](src/components/CategoryTile.tsx#L63-L100) and store status pills in [src/screens/details/StoreDetailsScreen.tsx](src/screens/details/StoreDetailsScreen.tsx#L98-L156)).
- Non-token status colors are used in components such as `ConfirmationModal` (`#22C55E` for success, `#E53E3E` for failure). See [src/components/ConfirmationModal.jsx](src/components/ConfirmationModal.jsx#L69-L176).

## Typography Patterns (Observed)
- Headers and titles use sizes 18–22 with bold weights (e.g., 22 in [src/components/HomeHeader.jsx](src/components/HomeHeader.jsx#L152-L162), 20 in [src/screens/details/StoreDetailsScreen.tsx](src/screens/details/StoreDetailsScreen.tsx#L103-L151)).
- Body and labels commonly use sizes 11–16 with 500–700 weight (e.g., 13 in [src/components/CategoryTile.tsx](src/components/CategoryTile.tsx#L95-L101), 14 in [BottomTabs.tsx](BottomTabs.tsx#L243-L274)).
- Uppercase status text appears in `OrderCard` via `text-transform: uppercase`. See [src/components/OrderCard.tsx](src/components/OrderCard.tsx#L33-L45).

## Layout and Spacing Conventions
- Screen padding typically uses `AUTH_SPACING.screenX` and `AUTH_SPACING.screenY` (e.g., [src/screens/Main/HomeScreen.tsx](src/screens/Main/HomeScreen.tsx#L203-L238)).
- Card containers use `AUTH_RADII.card`, `AUTH_COLORS.card`, and a shadow using `AUTH_COLORS.shadow`. Examples: [src/components/OrderCard.tsx](src/components/OrderCard.tsx#L7-L40) and [src/screens/details/StoreDetailsScreen.tsx](src/screens/details/StoreDetailsScreen.tsx#L111-L132).
- Pill buttons and chips use `AUTH_RADII.pill` with `AUTH_COLORS.primary` or `AUTH_COLORS.primarySoft`. Examples: [src/components/SearchBar.jsx](src/components/SearchBar.jsx#L30-L78) and [src/screens/details/StoreDetailsScreen.tsx](src/screens/details/StoreDetailsScreen.tsx#L114-L156).

## Styling Approaches
- `StyleSheet.create` is used in screens and some components (e.g., [BottomTabs.tsx](BottomTabs.tsx#L211-L276) and [src/screens/details/StoreDetailsScreen.tsx](src/screens/details/StoreDetailsScreen.tsx#L183-L232)).
- `styled-components/native` is used for card-style components such as `OrderCard` and `StoreCard`. See [src/components/OrderCard.tsx](src/components/OrderCard.tsx#L1-L120) and [src/components/StoreCard.tsx](src/components/StoreCard.tsx#L1-L132).

## Motion and Interaction
- Press feedback commonly uses `Animated.spring` with small scale changes (e.g., tab buttons in [BottomTabs.tsx](BottomTabs.tsx#L45-L132), category tiles in [src/components/CategoryTile.tsx](src/components/CategoryTile.tsx#L13-L60), and store cards in [src/components/StoreCard.tsx](src/components/StoreCard.tsx#L132-L220)).
- Entrance fade/slide animation appears in `HomeHeader` using `Animated.timing`. See [src/components/HomeHeader.jsx](src/components/HomeHeader.jsx#L17-L76).
- Confirmation flows use modal animations and icon scaling in `ConfirmationModal`. See [src/components/ConfirmationModal.jsx](src/components/ConfirmationModal.jsx#L18-L140).
- Swipe confirmation uses `rn-swipe-button` and a success tick overlay. See [src/components/SwipeToConfirm.jsx](src/components/SwipeToConfirm.jsx#L1-L139).
