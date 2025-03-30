# Non-Renewing Subscription on Google Play

This use case explains how to implement a **non-renewing subscription** product (granting access for a fixed period) on Android using the Google Play platform and `cordova-plugin-purchase` v13+. Your application is responsible for managing the expiry date, and the purchase must be acknowledged.

# Non-Renewing Subscription on Android

This guide demonstrates how to implement a **non-renewing subscription** product using the Google Play platform for Android applications.

On Google Play, non-renewing subscriptions are technically treated as **one-time products** (similar to consumables or non-consumables) that grant entitlement for a fixed duration. Unlike auto-renewing subscriptions, Google Play **does not automatically manage renewals or cancellations** for these products.

Key characteristics on Google Play:

*   Purchased as a one-time product via the standard purchase flow.
*   Your application is responsible for determining the access duration based on the product purchased (e.g., a product with ID `1_month_access` grants 1 month of entitlement).
*   Your application must calculate and track the expiry date based on the purchase time. Using a receipt validator is recommended to get an accurate purchase time.
*   Purchases **must be acknowledged** within 3 days using `transaction.finish()` to prevent automatic refunds by Google.
*   They **should not be consumed**, as consuming them would remove the entitlement record from Google's perspective (though your app manages the actual expiry).
*   Users can typically purchase the product again (e.g., buy another month) once access expires, or potentially before expiry to extend access, depending on your app's logic for calculating the new expiry date.

In this guide, we will build a simple application that allows users to purchase a non-renewing subscription granting access for a specific period, managing the expiry date within the app.

## 1. Platform Setup

First, ensure your Google Play Console (including creating the one-time product used for non-renewing access), application build, and test environment are correctly configured.


## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your non-renewing product, and display its information based on the access expiry date managed by your app.

*   **Note:** Replace the placeholder product ID (`'non_renewing_1_month'`) and the storage key (`ACCESS_EXPIRY_KEY`) with your actual values. Update the `store.register` call within the included code to specify `Platform.GOOGLE_PLAY`. Use a secure method instead of `localStorage` to store the expiry date in production.

## 3. Purchase Flow

Implement the logic to handle the purchase process. This involves initiating the order, handling `approved` and `verified` (recommended for accurate purchase date), calculating and storing the expiry date, and **acknowledging** the purchase with `transaction.finish()`. Acknowledgment is mandatory within 3 days on Google Play for this type.


## 4. Receipt Validation (Recommended)

Validating the receipt provides a secure way to confirm the purchase and obtain a reliable `purchaseDate` for calculating the expiry.


## 5. Testing

Follow the specific testing procedures for Google Play (signed release build, testing tracks, license tester accounts) outlined in the platform-specific purchase flow section above. Test purchasing, expiry checks, and potentially extending access by purchasing again.
