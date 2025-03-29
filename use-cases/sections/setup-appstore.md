## Setup for iOS AppStore

{% hint style="warning" icon="warning" %}
**Platform Interfaces Change Frequently!**

The App Store Connect interface and Apple's requirements change often. This guide provides a general overview but may become outdated.

**Always refer to the official Apple documentation as the primary source:**
*   [App Store Connect Help](https://help.apple.com/app-store-connect/)
*   [In-App Purchase Configuration](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases)
{% endhint %}

This section covers the essential steps for setting up your iOS/macOS app for In-App Purchases with the Cordova plugin.

### 1. Install Dependencies

!INCLUDE "./install-dependencies.md"

### 2. Create Cordova Project

!INCLUDE "setup-ios-2-create-cordova-project.md"

### 3. Setup AppStore Application & Agreements

*   **Apple Developer Account:** Ensure you have an active Apple Developer Program membership.
*   **App Record:** Create an App Record for your application in [App Store Connect](https://appstoreconnect.apple.com).
*   **Agreements, Tax, and Banking:** Ensure all agreements are accepted and banking/tax information is complete in the "Agreements, Tax, and Banking" section of App Store Connect. Your app won't be able to process purchases otherwise.
*   **Bundle ID:** Verify the Bundle ID in App Store Connect exactly matches the `id` in your `config.xml`.

!INCLUDE "setup-ios-3-create-app-store-application.md"

### 4. Install and Prepare with XCode

!INCLUDE "setup-ios-4-install-cordova-plugin.md"

### 5. Create In-App Products

!INCLUDE "setup-ios-5-create-in-app-products.md"

### 6. Create Test Users

!INCLUDE "setup-ios-6-test-users.md"