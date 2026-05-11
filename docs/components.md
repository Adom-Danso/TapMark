# Components (Grounded)

This list is based on the actual component implementations. Each entry links to the file.

## UI Components
- CategoryStrip: Horizontal list of categories with optional action label; requires `categories` and `onCategoryPress`. See [src/components/CategoryStrip.tsx](src/components/CategoryStrip.tsx#L1-L94).
- CategoryTile: Circular image tile with halo and label; requires `label`, `imageUri`, and `onPress`. See [src/components/CategoryTile.tsx](src/components/CategoryTile.tsx#L1-L104).
- ConfirmationModal: Modal that handles `success`, `failure`, and `pending` states with animation; supports `onSuccess` and `onRetry`. See [src/components/ConfirmationModal.jsx](src/components/ConfirmationModal.jsx#L1-L176).
- HomeHeader: Header block with location picker, greeting, and embedded `SearchBar`. See [src/components/HomeHeader.jsx](src/components/HomeHeader.jsx#L1-L170).
- HomeSectionCarousel: Titled horizontal carousel with optional action, loading state, and `renderItem`. See [src/components/HomeSectionCarousel.tsx](src/components/HomeSectionCarousel.tsx#L1-L115).
- LoadingBackdrop: Full-screen overlay with spinner and optional message. See [src/components/LoadingBackdrop.jsx](src/components/LoadingBackdrop.jsx#L1-L63).
- OrderCard: Styled card that displays order metadata, status, and a reorder action. See [src/components/OrderCard.tsx](src/components/OrderCard.tsx#L1-L221).
- OtpModal: Modal OTP input with resend flow; calls `onVerify(code)` and `onClose()`. See [src/components/OtpModal.jsx](src/components/OtpModal.jsx#L1-L308).
- SearchBar: Pressable search input shell with optional filter button. See [src/components/SearchBar.jsx](src/components/SearchBar.jsx#L1-L82).
- StoreCard: Card for store or item data with optional favorite button and promo badge. See [src/components/StoreCard.tsx](src/components/StoreCard.tsx#L1-L236).
- SwipeToConfirm: Swipe button wrapper that shows success tick and calls `onComplete`. Uses `rn-swipe-button`. See [src/components/SwipeToConfirm.jsx](src/components/SwipeToConfirm.jsx#L1-L139).

## Component Composition Examples
- `HomeScreen` composes `HomeHeader`, `CategoryStrip`, `HomeSectionCarousel`, and `StoreCard`. See [src/screens/Main/HomeScreen.tsx](src/screens/Main/HomeScreen.tsx#L1-L206).
- `StoreDetailsScreen` renders item cards inline rather than via a dedicated component. See [src/screens/details/StoreDetailsScreen.tsx](src/screens/details/StoreDetailsScreen.tsx#L69-L178).
