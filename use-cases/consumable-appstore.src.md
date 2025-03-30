# Consumable on AppStore (iOS & macOS)

This use case explains how to implement a **consumable** product (like virtual currency or extra lives) on iOS and macOS using the App Store platform and `cordova-plugin-purchase` v13+.

## 1. Platform Setup

First, ensure your Apple Developer account, App Store Connect, and Xcode project are correctly configured for In-App Purchases.

!INCLUDE "../sections/setup-appstore.md"

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your consumable product, and display its information and the user's balance.

!INCLUDE "../sections/consumable-generic-initialization.md"
*   **Note:** Replace the placeholder product ID (`'consumable1'`) in the code with your actual App Store Product ID. Adapt the `grantCoins` function and UI rendering (`refreshUI`) to match your specific consumable item (e.g., lives, credits). Remember to use secure storage instead of `localStorage` for balances in production.

## 3. Purchase Flow

Implement the logic to handle the purchase process when the user taps the "Buy" button. This involves initiating the order and handling the `approved`, `verified` (optional but recommended), and `finished` events to grant the item and consume the purchase.

!INCLUDE "../sections/consumable-ios.md"

## 4. Receipt Validation (Recommended)

While not strictly mandatory for basic consumable functionality on iOS (unlike subscriptions), validating receipts server-side prevents fraud and ensures purchases are legitimate before granting items.

!INCLUDE "../sections/receipt-validation-reminder.md"

## 5. Testing

Follow the specific testing procedures for iOS/macOS Sandbox environments outlined in the platform-specific purchase flow section above.
