## Setup for iOS AppStore

This guide details the necessary steps to configure your development environment, Apple Developer account, and App Store Connect settings before implementing In-App Purchases for iOS or macOS using `cordova-plugin-purchase` v13+.

{% hint style="warning" icon="warning" %}
**Platform Interfaces Change Frequently!**

The App Store Connect interface and Apple's requirements (like agreements) can change. This guide provides a general overview based on common practices but may become outdated.

**Always refer to the official Apple documentation as the primary source:**
*   [App Store Connect Help](https://help.apple.com/app-store-connect/)
*   [In-App Purchase Configuration](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases)
*   [Setting Up StoreKit Testing in Xcode](https://developer.apple.com/documentation/storekit/setting_up_storekit_testing_in_xcode) (Recommended for local testing)
*   [Generating Keys (Shared Secret)](https://developer.apple.com/documentation/appstoreserverapi/creating_api_keys_to_use_with_the_app_store_server_api) (Needed for Receipt Validation)
{% endhint %}

### 1. Install Dependencies

Ensure you have the basic development tools installed (Node.js, Cordova CLI, Xcode).

!INCLUDE "./install-dependencies.md"

### 2. Create or Prepare Cordova Project

Set up your Cordova project and add the iOS platform.

!INCLUDE "setup-ios-2-create-cordova-project.md"
*   **Important:** Ensure the `<widget id="...">` in your `config.xml` matches the Bundle ID you will use in App Store Connect.

### 3. Setup AppStore Connect Application & Agreements

Configure your app record and ensure all necessary legal agreements are active.

*   **Apple Developer Account:** You need an active Apple Developer Program membership.
*   **App Record:** Create an App Record for your application in [App Store Connect](https://appstoreconnect.apple.com) if you haven't already. Use the same Bundle ID as in your `config.xml`.
*   **Agreements, Tax, and Banking:** This is **critical**.
    1.  Go to the "Agreements, Tax, and Banking" section in App Store Connect.
    2.  Review and accept all required agreements, especially the **"Paid Apps" agreement**.
    3.  Ensure their status is **Active**.
    4.  Provide complete banking and tax information as requested.
    *   **Failure to complete this step will prevent all In-App Purchases (including sandbox tests) from working.**
*   **App-Specific Shared Secret:** You will need this secret for server-side receipt validation.
    1.  Go to your App Record in App Store Connect.
    2.  Navigate to "App Information" -> "App-Specific Shared Secret" (or similar path).
    3.  Generate or view the secret.
    4.  **Copy and securely store this secret.** It will be needed for your validation server (e.g., in your Iaptic settings or custom backend).

!INCLUDE "setup-ios-3-create-app-store-application.md"

### 4. Install Plugin and Configure Xcode Project

Install the purchase plugin and enable the necessary capability in Xcode.

1.  **Install Plugin:**
    ```bash
    cordova plugin add cordova-plugin-purchase
    ```
2.  **Prepare iOS Platform:**
    ```bash
    cordova prepare ios
    ```
3.  **Configure Xcode:**
    *   Open your project's `.xcworkspace` (or `.xcodeproj`) file located in `platforms/ios/`.
    *   Select your project target in the Project Navigator (left sidebar).
    *   Go to the **"Signing & Capabilities"** tab.
    *   Ensure a valid "Team" is selected and signing is configured.
    *   Click **"+ Capability"**.
    *   Search for and add **"In-App Purchase"**. Verify it appears in the list.

!INCLUDE "../images/xcode-capability-in-app-purchase.md"

!INCLUDE "setup-ios-5-create-in-app-products.md"

*   **Product IDs:** Note down the exact Product IDs you create; you'll need them for `store.register()`.
*   **Cleared for Sale:** Ensure products are marked "Cleared for Sale".
*   **Metadata:** Fill in all required metadata, including pricing, localization, and review information (even a placeholder screenshot is often needed for testing).

### 6. Create Sandbox Test Users

Create special Apple IDs for testing purchases without real money.

!INCLUDE "setup-ios-6-test-users.md"

*   **Important:** Use these accounts *only* when prompted by your app during a purchase flow on a test device/build. Do not sign into the main App Store settings with them.

!INCLUDE "setup-subscription-ios-7-validation-server.md"

*   **Remember:** You'll need the **App-Specific Shared Secret** obtained in Step 3 for your validation server.

---

After completing these steps, your Apple Developer account, App Store Connect record, and Xcode project should be configured to support In-App Purchases using `cordova-plugin-purchase`. You can now proceed to implement the purchase logic in your application code as shown in the specific [Use Cases](..).
