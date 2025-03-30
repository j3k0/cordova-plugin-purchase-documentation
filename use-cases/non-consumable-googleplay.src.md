# Non-Consumable on Google Play

This use case explains how to implement a **non-consumable** product (like unlocking a premium feature or removing ads permanently) on Android using the Google Play platform and `cordova-plugin-purchase` v13+.

## 1. Platform Setup

First, ensure your Google Play Console, application build, and test environment are correctly configured for Google Play Billing.

&rArr; [Setup instructions here](/use-cases/setup/setup-googleplay).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your non-consumable product, and display its information based on ownership status.

!INCLUDE "./sections/non-consumable-generic-initialization.md"
*   **Note:** Replace the placeholder product ID (`'unlock_premium_feature'`) and the storage key (`FEATURE_KEY`) in the code with your actual values. Update the `store.register` call within the included code to specify `Platform.GOOGLE_PLAY`. Replace the insecure `localStorage` example with a secure storage mechanism or server-side state management.

## 3. Purchase Flow

Implement the logic to handle the purchase process. This involves initiating the order and handling the `approved`, `verified` (highly recommended), and `finished` events to grant the entitlement permanently and **acknowledge** the purchase with Google Play using `transaction.finish()`. Acknowledgment is mandatory within 3 days on Google Play for non-consumables.

!INCLUDE "./sections/non-consumable-android.md"

## 4. Receipt Validation (Highly Recommended)

Server-side validation is crucial for non-consumables to securely verify ownership and prevent fraud.

!INCLUDE "./sections/receipt-validation-reminder.md"

## 5. Testing

Follow the specific testing procedures for Google Play (signed release build, testing tracks, license tester accounts) outlined in the platform-specific purchase flow section above.
