# macOS Specifics for AppStore Purchases

!INCLUDE "sections/plugin-v13.md"

While the `cordova-plugin-purchase` plugin uses the same `Platform.APPLE_APPSTORE` identifier and much of the same underlying StoreKit logic for both iOS and macOS, there are some key differences developers should be aware of during setup, development, and testing.

This guide assumes you are generally familiar with the iOS setup described in the [AppStore Setup Guide](!UNRESOLVED-LINK:./sections/setup-appstore.md).

## Setup Differences

### AppStore Connect Configuration

*   **App Record:** You need a separate App Record specifically for your macOS application in AppStore Connect, even if it shares code with an iOS app.
*   **Bundle ID:** Ensure the Bundle ID configured in AppStore Connect matches the `id` attribute in your macOS `config.xml` widget tag.
*   **In-App Purchases:** You must configure In-App Purchases (products, subscriptions) specifically for the macOS App Record. They are **not** automatically shared from an iOS counterpart. You'll need to recreate or re-link them.
*   **Pricing:** Ensure pricing tiers selected are valid for macOS.

### Xcode Project Configuration

*   **Platform:** When adding the platform, use `cordova platform add osx`.
*   **Capabilities:** Open the generated Xcode project (`platforms/osx/YourApp.xcodeproj`).
    *   Select your App target.
    *   Go to the "Signing & Capabilities" tab.
    *   Click "+ Capability".
    *   Add the **"In-App Purchase"** capability.
    *   Add the **"App Sandbox"** capability. This is typically required for Mac App Store distribution.
    *   Under "App Sandbox", ensure **"Outgoing Connections (Client)"** is checked. This allows your app to communicate with the App Store and potentially your validation server.
*   **Signing:** Configure appropriate macOS App Store signing certificates and provisioning profiles (App Store Distribution, Development).

### Cordova `config.xml`

No specific purchase plugin settings are usually required beyond the standard iOS/macOS shared setup, but ensure your macOS widget `id` is correct.

```xml
<!-- Example for config.xml -->
<widget id="com.yourcompany.macapp" ...>
    <!-- ... other settings ... -->
    <platform name="osx">
        <!-- macOS specific preferences if any -->
    </platform>
</widget>
```

## Development Differences

*   **API Consistency:** The JavaScript API (`CdvPurchase.store`, `Product`, `Offer`, etc.) remains the same as for iOS. Your purchase logic code should largely be reusable.
*   **UI/UX:** The presentation of purchase options, dialogs, and user flows should be adapted to macOS desktop conventions. System-level purchase prompts will look native to macOS.

## Testing Differences

Testing macOS In-App Purchases requires using **Sandbox Testers** configured in AppStore Connect, similar to iOS.

1.  **Create Sandbox Testers:** In AppStore Connect -> Users and Access -> Sandbox Testers, create dedicated tester accounts.
2.  **Build for Development:** Create a development build signed with a macOS Development certificate.
3.  **Log Out of Mac App Store:** On your test Mac, **sign out** of the production Mac App Store account via the App Store application (Store -> Sign Out). **Do NOT** sign in via System Preferences -> Apple ID -> Media & Purchases.
4.  **Run the App:** Launch your development build.
5.  **Sign In When Prompted:** When you initiate a purchase *within your app*, macOS will prompt you to sign in. Use the **Sandbox Tester** email and password you created in Step 1.
6.  **Purchase Flow:** Complete the purchase flow. Sandbox purchases are free and may have accelerated subscription renewal rates (check AppStore Connect settings).
7.  **Receipt Validation:** Test your receipt validation flow using the sandbox environment endpoint for your validator (e.g., Apple's sandbox URL or your server's sandbox mode).

{% hint style="warning" %}
Crucially, **do not sign into the main macOS System Preferences** with your Sandbox account. Sign in only when prompted by your app during the purchase process. Signing in via System Preferences can sometimes cause issues or log you into the production store environment incorrectly.
{% endhint %}

**Troubleshooting:**

*   Ensure the "In-App Purchase" capability is enabled in Xcode.
*   Verify the "App Sandbox" capability is enabled with "Outgoing Connections".
*   Double-check that the Bundle ID in `config.xml` and AppStore Connect match exactly.
*   Confirm you are signed out of the production Mac App Store on your test device.
*   Use a **new** Sandbox Tester account if you encounter persistent issues with an existing one.
