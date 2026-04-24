# About the Plugin

The Cordova Purchase plugin (`cordova-plugin-purchase`) provides a unified JavaScript API (`CdvPurchase.store`) for interacting with various In-App Purchase platforms and payment providers from within Cordova, Capacitor, and Ionic applications.

## Core Goal: Abstraction

The primary goal is to abstract the complexities and differences between platform-specific SDKs (like Apple's StoreKit and Google Play Billing Library) and payment gateways (like Braintree). This allows developers to write purchase-related code once using the `CdvPurchase.store` API and have it work across multiple platforms with minimal platform-specific adjustments.

## Key Components & Flow (v13+)

The plugin manages interactions with the underlying payment platforms through a structured flow:

1.  **Initialization (`store.initialize()`):**
    *   **What:** This is the first step after `deviceready`. You specify which payment platforms (e.g., `Platform.APPLE_APPSTORE`, `Platform.GOOGLE_PLAY`) your app uses.
    *   **Why:** Activates the necessary native SDKs, establishes connections to the stores, loads existing purchase receipts from the device, and fetches initial product details.

2.  **Product Registration (`store.register()`):**
    *   **What:** You inform the plugin about the products (consumables, subscriptions, etc.) you've configured in the respective platform consoles (App Store Connect, Google Play Console). You provide the `id`, `type`, and `platform` for each.
    *   **Why:** Allows the plugin to request detailed information (like localized price and title) for these specific products during initialization and updates.

3.  **Event Handling (`store.when()`):**
    *   **What:** The plugin operates asynchronously. You register listeners using `store.when()` to react to various events in the purchase lifecycle.
    *   **Why:** This is how your application logic responds to successful purchases, updates, failures, etc. Key events include:
        *   **`productUpdated`:** Fires when product details (like price or title) are loaded or refreshed from the store. Use this to update your UI.
        *   **`receiptUpdated`:** Fires when the *local* device receipt information changes (e.g., a new purchase is detected by the SDK, a transaction is finished locally).
        *   **`approved`:** Fires when a payment is authorized by the platform (e.g., user confirms purchase) but *before* it's finalized or validated. **Crucially, you must call `transaction.verify()` here.**
        *   **`verified`:** Fires *after* a receipt/transaction has been successfully validated by your configured `store.validator`. This is the secure point to grant entitlement (unlock features, add currency, etc.).
        *   **`finished`:** Fires after `transaction.finish()` or `receipt.finish()` successfully completes, acknowledging the transaction with the platform.
        *   **`pending`:** Fires if a transaction requires external action (e.g., Ask to Buy, delayed payment methods like cash).
        *   **`error`:** Catches general plugin errors. Purchase-specific errors are typically handled via the promise returned by `order()` or `requestPayment()`.

4.  **Initiating Purchases/Payments:**
    *   **`offer.order()`:** Call this method on a specific `Offer` object (obtained via `product.getOffer()`) to initiate the standard purchase flow for store products (App Store, Google Play).
    *   **`store.requestPayment()`:** Use this for custom payment amounts, typically with payment gateways like Braintree, by providing payment details like `items`, `amountMicros`, and `currency`.

5.  **Managing Purchases:**
    *   **`transaction.verify()`:** Sends the transaction's receipt data to your configured `store.validator` endpoint for server-side validation. **Essential for security.**
    *   **`transaction.finish()` / `receipt.finish()`:** Acknowledges the transaction(s) with the platform. This is **mandatory** to complete the purchase cycle. For consumables, it also consumes the item, allowing repurchase. For non-consumables and subscriptions, it confirms delivery/processing.
    *   **`store.owned()`:** Checks if a product is currently considered owned based on available (preferably *verified*) receipt data.
    *   **`store.restorePurchases()`:** Asks the platform to restore previously purchased non-consumables and active subscriptions associated with the user's store account.

6.  **Receipt Validation (`store.validator`):**
    *   **What:** You configure the plugin with a URL pointing to your backend server or a third-party validation service (like [Iaptic](https://www.iaptic.com/)).
    *   **Why:** The plugin sends receipt data to this endpoint during the `verify()` step. The validator confirms the purchase with Apple/Google servers and returns the authoritative purchase details (including subscription status and expiry). **This is the cornerstone of secure entitlement management.** [Read Why](receipt-validation-importance.md).

## Architecture

*   **JavaScript Core (`CdvPurchase.store`):** Provides the unified API and manages platform adapters.
*   **Platform Adapters:** Internal components responsible for implementing the unified API for each specific platform (App Store, Google Play, Braintree, Test).
*   **Native Bridges:** Framework-specific native code that communicates directly with platform SDKs:
    *   **Cordova:** Native plugins (Objective-C/Swift for iOS/macOS, Java/Kotlin for Android).
    *   **Capacitor:** Dedicated native bridges via `capacitor-plugin-cdv-purchase` — StoreKit 2 on iOS, Google Play Billing on Android — with no Cordova dependency.

This layered approach allows the JavaScript API (`CdvPurchase.store`) to remain consistent while the adapters and native bridges handle the platform-specific implementation details.

## Framework Support

The plugin ships as two packages that share the same JavaScript API:

| Framework | Package | Install |
|-----------|---------|---------|
| Cordova / Ionic (Cordova) | `cordova-plugin-purchase` | `cordova plugin add cordova-plugin-purchase` |
| Capacitor / Ionic (Capacitor) | `capacitor-plugin-cdv-purchase` | `npm install capacitor-plugin-cdv-purchase && npx cap sync` |

See [Capacitor Setup](../setup/setup-capacitor.md) for full installation and configuration instructions when using Capacitor.
