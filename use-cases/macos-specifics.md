# macOS Specifics

Implementing In-App Purchases on macOS using the `cordova-plugin-purchase` is very similar to iOS, as both platforms use Apple's StoreKit framework. However, there are a few specific setup steps and considerations.

## Prerequisites

*   Follow the general [Setup for iOS AppStore](../sections/setup-appstore.md) guide, as most steps apply to macOS as well (App Store Connect setup, product creation, shared secret).
*   Ensure you have the `cordova-osx` platform added to your project (`cordova platform add osx`).

## Xcode Project Configuration

In addition to the **"In-App Purchase"** capability required for iOS, macOS apps typically require the **"App Sandbox"** capability for distribution through the Mac App Store.

1.  Open your project in Xcode (`platforms/osx/YourApp.xcworkspace`).
2.  Select your project target in the Project Navigator.
3.  Go to the **"Signing & Capabilities"** tab.
4.  Click **"+ Capability"** and add **"App Sandbox"**.
5.  Under the "App Sandbox" settings, ensure **"Network: Outgoing Connections (Client)"** is checked. This is often required for the app to communicate with validation servers or other necessary network services.

    !INCLUDE "../images/xcode-capability-app-sandbox.md" *(Placeholder: Add image showing sandbox settings)*
6.  Ensure the **"In-App Purchase"** capability is also added, just like for iOS.

## Testing on macOS

Testing macOS In-App Purchases uses **Sandbox Tester accounts** created in App Store Connect, similar to iOS. However, the login process is different:

1.  **Sign Out of Mac App Store:** Crucially, you must **sign out** of your regular Apple ID in the **Mac App Store application** (Store menu -> Sign Out). *Do not* sign out of iCloud system-wide.
2.  **Launch Your Test Build:** Run your application build directly from Xcode or as an exported `.app` file (signed with your Development certificate).
3.  **Initiate Purchase:** When you attempt to make an In-App Purchase within your test build, macOS will prompt you to sign in.
4.  **Sign In with Sandbox Account:** Use the email and password for one of your **Sandbox Tester accounts** created in App Store Connect. **Do not** use your regular Apple ID.
5.  **Complete Purchase:** Proceed through the purchase flow. It will use the sandbox environment and won't charge real money.

{% hint style="danger" icon="skull" %}
**Do NOT sign in with a Sandbox account directly into the Mac App Store application.** You must sign out of the production store and sign in with the Sandbox account *only when prompted by your app during a purchase*. Signing into the main Mac App Store with a Sandbox account can invalidate the account.
{% endhint %}

## Code Implementation

The JavaScript code using `CdvPurchase.store` is generally **identical** to the iOS implementation for the same product types (Consumable, Non-Consumable, Subscription). Refer to the relevant iOS use-case guides:

*   [Consumable with AppStore](consumable-appstore.md)
*   [Non-Consumable with AppStore](non-consumable-appstore.md)
*   [Subscription with AppStore](subscription-appstore.md)
*   [Non-Renewing Subscription with AppStore](non-renewing-appstore.md)

Remember to set the platform correctly when registering products if you are building for multiple platforms:

```javascript
const { store, ProductType, Platform } = CdvPurchase;

store.register({
    id: 'my_macos_feature',
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.APPLE_APPSTORE // Correct for both iOS and macOS
});

// ... rest of your initialization and event handlers ...
```

**Receipt Validation:** Use the same validation endpoint and App-Specific Shared Secret as you would for iOS. The receipt format is largely the same.

## Distribution

When distributing your macOS app outside the Mac App Store (e.g., direct download), you cannot use StoreKit In-App Purchases. You would need to integrate a different payment provider like Stripe or Braintree (using their respective web/SDK solutions, potentially outside this plugin's scope for macOS unless specifically supported by an extension). For Mac App Store distribution, follow Apple's submission guidelines.