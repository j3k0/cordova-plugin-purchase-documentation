# Non-Consumable on AppStore (iOS & macOS)

This use case explains how to implement a **non-consumable** product (like unlocking a premium feature or removing ads permanently) on iOS and macOS using the App Store platform and `cordova-plugin-purchase` v13+.

## 1. Platform Setup

First, ensure your Apple Developer account, App Store Connect, and Xcode project are correctly configured for In-App Purchases.

!INCLUDE "./sections/setup-appstore.md"

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your non-consumable product, and display its information based on ownership status.

!INCLUDE "./sections/non-consumable-generic-initialization.md"
*   **Note:** Replace the placeholder product ID (`'unlock_premium_feature'`) and the storage key (`FEATURE_KEY`) in the code with your actual values. Crucially, replace the insecure `localStorage` example in `grantEntitlement` and `isFeatureUnlocked` with a secure storage mechanism (like `cordova-plugin-securestorage-adapter`) or server-side state management.

## 3. Purchase Flow

Implement the logic to handle the purchase process. This involves initiating the order and handling the `approved`, `verified` (highly recommended), and `finished` events to grant the entitlement permanently and acknowledge the purchase with the App Store using `transaction.finish()`.

!INCLUDE "./sections/non-consumable-ios.md"

## 4. Receipt Validation (Highly Recommended)

Server-side validation is crucial for non-consumables to securely verify ownership and enable reliable purchase restoration across devices.

!INCLUDE "./sections/receipt-validation-reminder.md"

## 5. Testing

Follow the specific testing procedures for iOS/macOS Sandbox environments outlined in the platform-specific purchase flow section above, including testing the "Restore Purchases" functionality.
