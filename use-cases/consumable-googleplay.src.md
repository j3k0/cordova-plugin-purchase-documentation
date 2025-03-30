# Consumable on Google Play

This use case explains how to implement a **consumable** product (like virtual currency or extra lives) on Android using the Google Play platform and `cordova-plugin-purchase` v13+.

## 1. Platform Setup

First, ensure your Google Play Console, application build, and test environment are correctly configured for Google Play Billing.

&rArr; [Setup instructions here](./sections/setup-googleplay.md).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your consumable product, and display its information and the user's balance.

!INCLUDE "./sections/consumable-generic-initialization.md"
*   **Note:** Replace the placeholder product ID (`'consumable1'`) in the code with your actual Google Play Product ID. Adapt the `grantCoins` function and UI rendering (`refreshUI`) to match your specific consumable item. Remember to use secure storage instead of `localStorage` for balances in production. Also, update the `store.register` call within the included code to specify `Platform.GOOGLE_PLAY`.

## 3. Purchase Flow

Implement the logic to handle the purchase process when the user taps the "Buy" button. This involves initiating the order and handling the `approved`, `verified` (optional but recommended), and `finished` events to grant the item and **consume** the purchase using `transaction.finish()`.

!INCLUDE "./sections/consumable-android.md"

## 4. Receipt Validation (Recommended)

Validating receipts server-side prevents fraud and ensures purchases are legitimate before granting items, even for consumables.

!INCLUDE "./sections/receipt-validation-reminder.md"

## 5. Testing

Follow the specific testing procedures for Google Play (signed release build, testing tracks, license tester accounts) outlined in the platform-specific purchase flow section above.
