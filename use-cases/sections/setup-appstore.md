## Setup for iOS AppStore

{% hint style="warning" icon="warning" %}
**Platform Interfaces Change Frequently!**

The App Store Connect interface and Apple's requirements change often. This guide provides a general overview but may become outdated.

**Always refer to the official Apple documentation as the primary source:**
*   [App Store Connect Help](https://help.apple.com/app-store-connect/)
*   [In-App Purchase Configuration](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases)
*   [Setting Up StoreKit Testing in Xcode](https://developer.apple.com/documentation/storekit/setting_up_storekit_testing_in_xcode) (Recommended for local testing)
*   [Generating Keys (Shared Secret)](https://developer.apple.com/documentation/appstoreserverapi/creating_api_keys_to_use_with_the_app_store_server_api) (Needed for Receipt Validation)
{% endhint %}

This section covers the essential steps for setting up your iOS/macOS app for In-App Purchases with the Cordova plugin.

### 1. Install Dependencies

!INCLUDE "./install-dependencies.md"

### 2. Create Cordova Project

!INCLUDE "setup-ios-2-create-cordova-project.md"

### 3. Setup AppStore Application & Agreements

*   **Apple Developer Account:** Ensure you have an active Apple Developer Program membership.
*   **App Record:** Create an App Record for your application in [App Store Connect](https://appstoreconnect.apple.com). You'll need a unique Bundle ID.
*   **Agreements, Tax, and Banking:** This is **critical**. Navigate to the "Agreements, Tax, and Banking" section in App Store Connect. Ensure all agreements, especially the "Paid Apps" agreement, are reviewed, accepted, and **Active**. Provide complete banking and tax information. Your app won't be able to process *any* purchases (even free trials or sandbox tests) if this section isn't fully set up and active.
*   **Bundle ID:** Go to "App Information" for your app record. Verify the Bundle ID listed exactly matches the `id` attribute in your project's `config.xml` widget tag (`<widget id="com.yourcompany.yourapp" ...>`).

!INCLUDE "setup-ios-3-create-app-store-application.md"

### 4. Install Plugin and Configure Xcode Project

Install the plugin:
```bash
cordova plugin add cordova-plugin-purchase
```

Then, configure your Xcode project:

1.  Prepare the Cordova iOS platform:
    ```bash
    cordova prepare ios
    ```
2.  Open your project in Xcode (use the `.xcworkspace` file if it exists, otherwise the `.xcodeproj`):
    ```bash
    open platforms/ios/*.xcworkspace  # or .xcodeproj if no workspace
    ```
3.  Select your project target in the Project Navigator (the left sidebar).
4.  Go to the **"Signing & Capabilities"** tab.
5.  Ensure a valid "Team" is selected and signing (Development or Distribution) is configured.
6.  Click **"+ Capability"** near the top.
7.  Search for and add **"In-App Purchase"**. It should appear in the capabilities list.

    !INCLUDE "../images/xcode-capability-in-app-purchase.md"

!INCLUDE "setup-ios-4-install-cordova-plugin.md"
*Note: The included section primarily repeats the capability step, ensure it's consistent.*

### 5. Create In-App Products in App Store Connect

You need to define each virtual item you want to sell within App Store Connect.

!INCLUDE "setup-ios-5-create-in-app-products.md"

### 6. Create Sandbox Test Users

Real purchases cost real money. For testing, you need **Sandbox Apple IDs**.

!INCLUDE "setup-ios-6-test-users.md"

### 7. (Recommended) Setup Receipt Validation Service

Server-side validation is essential for security and reliable subscription management.

!INCLUDE "sections/setup-subscription-ios-7-validation-server.md"