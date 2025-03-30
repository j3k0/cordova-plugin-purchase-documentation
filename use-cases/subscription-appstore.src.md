# Subscription on AppStore (iOS & macOS)

This use case explains how to implement an **auto-renewing subscription** on iOS and macOS using the App Store platform and `cordova-plugin-purchase` v13+. Reliable subscription management **requires server-side receipt validation**.

## 1. Platform Setup

First, ensure your Apple Developer account, App Store Connect (including creating subscription products and groups), and Xcode project are correctly configured.

!INCLUDE "./sections/setup-appstore.md"

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your subscription products (including `group` if applicable), configure the **mandatory validator**, and display subscription status based on **verified** receipt data.

!INCLUDE "./sections/subscription-generic-initialization.md"
*   **Note:** Replace placeholder product IDs (`'subscription_monthly'`, `'subscription_yearly'`) and the group name (`'premium_access'`) with your actual values. Ensure your `store.validator` URL is correctly configured.

## 3. Purchase Flow

Implement the logic to handle the subscription purchase or plan change process. This involves initiating the order, verifying the transaction via your validator, and acknowledging the purchase with `receipt.finish()`.

!INCLUDE "./sections/subscription-ios.md"

## 4. Receipt Validation (Mandatory)

Server-side validation is **essential** for subscriptions to determine the current status, expiry date, renewal intent, and handle events like renewals, cancellations, and billing issues.

!INCLUDE "./sections/receipt-validation-reminder.md"

## 5. Testing

Follow the specific testing procedures for iOS/macOS Sandbox environments outlined in the platform-specific purchase flow section above. Pay close attention to testing initial purchases, accelerated renewals, cancellations, and plan changes (if applicable) via the Sandbox subscription management UI.
