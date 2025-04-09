# Subscription on Google Play

This use case explains how to implement an **auto-renewing subscription** on Android using the Google Play platform and `cordova-plugin-purchase` v13+. Reliable subscription management **requires server-side receipt validation** connected to the Google Play Developer API.

## 1. Platform Setup

First, ensure your Google Play Console (including creating subscription products), application build, test environment, and **Google Play Developer API access** (for validation) are correctly configured.

&rArr; [Setup instructions here](./sections/setup-googleplay.md).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your subscription products (including `group` if applicable), configure the **mandatory validator**, and display subscription status based on **verified** receipt data obtained via the Google Play Developer API.

!INCLUDE "./sections/subscription-generic-initialization.src.md"
*   **Note:** Replace placeholder product IDs and the group name with your actual values. Update the `store.register` call within the included code to specify `Platform.GOOGLE_PLAY`. Ensure your `store.validator` URL is correctly configured and linked to a backend capable of using the Google Play Developer API.

## 3. Purchase Flow

Implement the logic to handle the subscription purchase or plan change process. This involves initiating the order (potentially with upgrade/downgrade parameters), verifying the transaction via your validator, and **acknowledging** the purchase with `receipt.finish()`.

!INCLUDE "./sections/subscription-android.src.md"

## 4. Receipt Validation (Mandatory)

Server-side validation using the **Google Play Developer API** is **essential** for subscriptions to determine the current status, expiry date, renewal intent, grace periods, and handle renewals and cancellations correctly. Local receipts are insufficient.

!INCLUDE "./sections/receipt-validation-reminder.src.md"

## 5. Testing

Follow the specific testing procedures for Google Play (signed release build, testing tracks, license tester accounts, validator connected to Developer API) outlined in the platform-specific purchase flow section above. Test initial purchases, accelerated renewals, cancellations, and plan changes (if applicable).
