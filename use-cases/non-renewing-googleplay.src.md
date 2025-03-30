# Non-Renewing Subscription on Google Play

This use case explains how to implement a **non-renewing subscription** product (granting access for a fixed period) on Android using the Google Play platform and `cordova-plugin-purchase` v13+. Your application is responsible for managing the expiry date, and the purchase must be acknowledged.

!INCLUDE "sections/non-renewing-android-intro.md"

## 1. Platform Setup

First, ensure your Google Play Console (including creating the one-time product used for non-renewing access), application build, and test environment are correctly configured.

&rArr; [Setup instructions here](/use-cases/setup/setup-googleplay).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your non-renewing product, and display its information based on the access expiry date managed by your app.

!INCLUDE "./sections/non-renewing-generic-initialization.md"
*   **Note:** Replace the placeholder product ID (`'non_renewing_1_month'`) and the storage key (`ACCESS_EXPIRY_KEY`) with your actual values. Update the `store.register` call within the included code to specify `Platform.GOOGLE_PLAY`. Use a secure method instead of `localStorage` to store the expiry date in production.

## 3. Purchase Flow

Implement the logic to handle the purchase process. This involves initiating the order, handling `approved` and `verified` (recommended for accurate purchase date), calculating and storing the expiry date, and **acknowledging** the purchase with `transaction.finish()`. Acknowledgment is mandatory within 3 days on Google Play for this type.

!INCLUDE "./sections/non-renewing-android-purchase.md"

## 4. Receipt Validation (Recommended)

Validating the receipt provides a secure way to confirm the purchase and obtain a reliable `purchaseDate` for calculating the expiry.

!INCLUDE "./sections/receipt-validation-reminder.md"

## 5. Testing

Follow the specific testing procedures for Google Play (signed release build, testing tracks, license tester accounts) outlined in the platform-specific purchase flow section above. Test purchasing, expiry checks, and potentially extending access by purchasing again.
