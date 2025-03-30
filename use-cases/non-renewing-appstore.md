# Non-Renewing Subscription on AppStore (iOS & macOS)

This use case explains how to implement a **non-renewing subscription** product (granting access for a fixed period) on iOS and macOS using the App Store platform and `cordova-plugin-purchase` v13+. Your application is responsible for managing the expiry date.

# Non-Renewing Subscription on iOS & macOS

This guide demonstrates how to implement a **non-renewing subscription** product using the AppStore platform for iOS and macOS applications.

Non-renewing subscriptions grant access to content or services for a **fixed, limited duration** (e.g., 1 month, 6 months, 1 year). Unlike auto-renewing subscriptions, they **do not automatically renew** at the end of the period. The user must explicitly purchase the subscription again to extend access.

Key characteristics on Apple platforms:

*   Purchased as a one-time transaction via StoreKit.
*   Entitlement management (tracking expiry) is **entirely handled by your application logic** after the initial purchase. Apple does not track the expiry or renewal status for these.
*   Often used for time-limited access to content archives, seasonal passes, or services where auto-renewal isn't desired or appropriate.
*   Requires careful handling of expiry dates based on the purchase time and product duration.
*   Requires **acknowledging** the purchase using `transaction.finish()` to remove it from the payment queue.
*   Requires syncing purchase status and expiry across devices if you support user accounts (typically via your own backend).

In this guide, we will build a simple application that allows users to purchase a non-renewing subscription which grants access for a defined period, managing the expiry date within the app.

## 1. Platform Setup

First, ensure your Apple Developer account, App Store Connect (including creating the non-renewing subscription product), and Xcode project are correctly configured.


## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your non-renewing product, and display its information based on the access expiry date managed by your app.

*   **Note:** Replace the placeholder product ID (`'non_renewing_1_month'`) and the storage key (`ACCESS_EXPIRY_KEY`) with your actual values. Use a secure method (SecureStorage plugin or server backend) instead of `localStorage` to store the expiry date in production.

## 3. Purchase Flow

Implement the logic to handle the purchase process. This involves initiating the order, handling `approved` and `verified` (recommended for accurate purchase date), calculating and storing the expiry date, and acknowledging the purchase with `transaction.finish()`.


## 4. Receipt Validation (Recommended)

While your app manages the expiry, validating the receipt provides a secure way to confirm the purchase happened and obtain a reliable `purchaseDate` for calculating the expiry.


## 5. Testing

Follow the specific testing procedures for iOS/macOS Sandbox environments outlined in the platform-specific purchase flow section above. Test purchasing, expiry checks, and potentially extending access by purchasing again.
