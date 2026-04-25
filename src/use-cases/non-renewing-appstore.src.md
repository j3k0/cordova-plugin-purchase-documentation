# Non-Renewing Subscription on AppStore (iOS & macOS)

This use case explains how to implement a **non-renewing subscription** product (granting access for a fixed period) on iOS and macOS using the App Store platform and `cordova-plugin-purchase` v13+. Your application is responsible for managing the expiry date.

> **Capacitor:** This guide applies to both Cordova and Capacitor projects. The purchase API is identical — only the [installation](../setup/setup-capacitor.md) differs. In Capacitor, import the plugin directly instead of waiting for `deviceready`.


!INCLUDE "./sections/non-renewing-ios-intro.src.md"


## 1. Platform Setup

First, ensure your Apple Developer account, App Store Connect (including creating the non-renewing subscription product), and Xcode project are correctly configured.

&rArr; [Setup instructions here](../setup/setup-appstore.md).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your non-renewing product, and display its information based on the access expiry date managed by your app.


!INCLUDE "./sections/non-renewing-generic-initialization.src.md"


*   **Note:** Replace the placeholder product ID (`'non_renewing_1_month'`) and the storage key (`ACCESS_EXPIRY_KEY`) with your actual values. Use a secure method (SecureStorage plugin or server backend) instead of `localStorage` to store the expiry date in production.

## 3. Purchase Flow

Implement the logic to handle the purchase process. This involves initiating the order, handling `approved` and `verified` (recommended for accurate purchase date), calculating and storing the expiry date, and acknowledging the purchase with `transaction.finish()`.


!INCLUDE "./sections/non-renewing-ios-purchase.src.md"


## 4. Receipt Validation (Recommended)

While your app manages the expiry, validating the receipt provides a secure way to confirm the purchase happened and obtain a reliable `purchaseDate` for calculating the expiry.


!INCLUDE "./sections/receipt-validation-reminder.src.md"


## 5. Testing

Follow the specific testing procedures for iOS/macOS Sandbox environments outlined in the platform-specific purchase flow section above. Test purchasing, expiry checks, and potentially extending access by purchasing again.
