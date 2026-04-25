# macOS Specifics

Implementing In-App Purchases on macOS using the `cordova-plugin-purchase` is very similar to iOS, as both platforms utilize Apple's StoreKit framework. However, there are a few specific setup steps and testing procedures unique to macOS.

{% hint style="warning" icon="warning" %}
**Platform Interfaces Change Frequently!**

The App Store Connect interface, Xcode capabilities, and macOS testing procedures can change. This guide provides a general overview but may become outdated.

**Always refer to the official Apple documentation as the primary source:**
*   [App Store Connect Help](https://help.apple.com/app-store-connect/)
*   [macOS App Sandbox](https://developer.apple.com/documentation/security/app_sandbox)
*   [Testing In-App Purchases on macOS](https://developer.apple.com/documentation/storekit/testing_in-app_purchases_on_macos) (Search Apple Developer Docs for latest testing guides)
{% endhint %}

## Prerequisites

1.  **Cordova macOS Platform:** Ensure you have added the macOS platform to your project:
    ```bash
    cordova platform add osx
    ```
2.  **App Store Connect Setup:** Complete the general [Setup for AppStore](../setup/setup-appstore.md) guide. Most steps (Apple Developer Account, App Record, Agreements, Product Creation, Shared Secret, Sandbox Users) are identical for iOS and macOS apps distributed via the App Store.

## Xcode Project Configuration

For macOS apps, especially those intended for the Mac App Store, you typically need to enable the **App Sandbox** capability in addition to **In-App Purchase**.

1.  **Prepare Project:**
    ```bash
    cordova prepare osx
    ```
2.  **Open Workspace:** Open the `.xcworkspace` file located in `platforms/osx/` using Xcode.
    ```bash
    open platforms/osx/*.xcworkspace
    ```
3.  **Select Target:** In Xcode's Project Navigator (left sidebar), select your main application target.
4.  **Signing & Capabilities Tab:** Go to the "Signing & Capabilities" tab.
5.  **Add Capabilities:**
    *   Click **"+ Capability"**.
    *   Search for and add **"In-App Purchase"**.
    *   Click **"+ Capability"** again.
    *   Search for and add **"App Sandbox"**.
6.  **Configure App Sandbox:**
    *   Under the newly added "App Sandbox" section, review the permissions.
    *   Ensure **"Network: Outgoing Connections (Client)"** is **checked**. This is usually required for your app to communicate with external services, including potentially your receipt validation server.


## Testing on macOS

Testing macOS In-App Purchases requires using **Sandbox Tester accounts** but involves a specific login procedure different from iOS:

1.  **Sign Out of Mac App Store:**
    *   Open the **App Store** application on your Mac (the application used to download apps, *not* App Store Connect).
    *   Go to the **Store** menu in the menu bar.
    *   Select **Sign Out**. You must be signed out of any production Apple ID in the Mac App Store app itself.
    *   **Important:** Do *not* sign out of your primary iCloud account in System Preferences/Settings, only sign out from the *App Store application*.
2.  **Launch Your Test Build:**
    *   Build and run your application directly from Xcode onto your Mac (select "My Mac" as the target device).
    *   Alternatively, you can archive and export a "Development" signed build (`.app` file) and run that.
3.  **Initiate Purchase Within Your App:**
    *   Navigate to the purchase section within your running test build and attempt to buy an In-App Purchase.
4.  **Sign In When Prompted by Your App:**
    *   Your app (via StoreKit) will present a system login prompt.
    *   Enter the email and password for one of your **Sandbox Tester accounts** (created in App Store Connect). **Do NOT use your regular/production Apple ID.**
5.  **Complete Purchase:**
    *   Follow the prompts to confirm the purchase. It will use the sandbox environment and will not involve real money.

{% hint style="danger" icon="skull" %}
**Crucial Testing Point:** Never sign into the main **Mac App Store application** using a Sandbox Tester account. Only use Sandbox credentials when prompted *by your application* during a test purchase. Signing into the production Mac App Store app with a Sandbox account can corrupt or invalidate that test account.
{% endhint %}

## Code Implementation

The JavaScript code using `CdvPurchase.store` for handling products, offers, purchases, validation, and events is generally **identical** for macOS and iOS. Both use `Platform.APPLE_APPSTORE`.

Refer to the relevant iOS use-case guides for code examples:

*   [Consumable (AppStore)](consumable-appstore.md)
*   [Non-Consumable (AppStore)](non-consumable-appstore.md)
*   [Subscription (AppStore)](subscription-appstore.md)
*   [Non-Renewing Subscription (AppStore)](non-renewing-appstore.md)

**Example Registration:**

```javascript
const { store, ProductType, Platform } = CdvPurchase;

// Registering a product for macOS uses the same platform identifier as iOS
store.register({
    id: 'my_macos_premium_feature', // Your product ID from App Store Connect
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.APPLE_APPSTORE // Correct for both iOS and macOS
});

// ... rest of your initialization (including validator) and event handlers ...
```

**Receipt Validation:** Use the same server-side validation endpoint and **App-Specific Shared Secret** as you would for your iOS app. The receipt format generated by macOS StoreKit is compatible.

{% hint style="info" %}
On macOS 12+, the optional [StoreKit 2 Extension](../setup/storekit2.md) provides improved transaction handling with JWS-based receipts.
{% endhint %}

## Distribution

*   **Mac App Store:** If distributing through the Mac App Store, ensure all capabilities (App Sandbox, In-App Purchase) are correctly configured and follow Apple's submission guidelines.
*   **Outside Mac App Store (Direct Distribution/Notarization):** StoreKit In-App Purchases **cannot** be used for apps distributed outside the Mac App Store. For direct distribution, you must integrate a third-party payment provider (e.g., Stripe, Paddle, Braintree via their web/desktop SDKs). This typically falls outside the direct scope of the `cordova-plugin-purchase` StoreKit integration, although the Braintree *payment request* functionality might still be usable if the Braintree extension supports macOS contexts (check the extension's documentation).
