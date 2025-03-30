## Setup for Google Play

{% hint style="warning" icon="warning" %}
**Platform Interfaces Change Frequently!**

The Google Play Console interface and Google's requirements change often. This guide provides a general overview but may become outdated.

**Always refer to the official Google documentation as the primary source:**
*   [Google Play Billing Overview](https://developer.android.com/google/play/billing/billing_overview)
*   [Set up Google Play Billing](https://developer.android.com/google/play/billing/integrate)
*   [Create & Manage Products/Subscriptions](https://developer.android.com/google/play/billing/subscriptions)
*   [Testing Google Play Billing](https://developer.android.com/google/play/billing/test)
*   [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
*   [Setting up Google Play Developer API Access](https://developers.google.com/android-publisher/getting_started) (Needed for Server-Side Validation)
{% endhint %}

This section covers the essential steps for setting up your Android app for In-App Purchases with the Cordova plugin.

### 1. Install Dependencies

!INCLUDE "./install-dependencies.md"

### 2. Create Cordova Project

!INCLUDE "setup-android-2-create-cordova-project.md"

### 3. Setup Google Play Application & Billing

*   **Google Play Developer Account:** Ensure you have an active developer account ([Play Console](https://play.google.com/console/)).
*   **Create Application:** Create your application entry in the Google Play Console if it doesn't exist yet. You don't need to publish it publicly, but the app record must be created.
*   **Billing Setup:** Link a Google Merchant Account if you haven't already. This is usually done under "Setup" -> "Payments profile" in the Play Console. Ensure it's active.
*   **License Testing:** Add Google accounts (full Gmail addresses) you'll use for testing under "Setup" -> "License testing" in the Play Console. These accounts can make test purchases without being charged real money.

!INCLUDE "setup-android-3-google-play.md"

### 4. Install Plugin and Configure Project

Install the plugin:
```bash
cordova plugin add cordova-plugin-purchase
```

The plugin automatically adds the necessary `com.android.vending.BILLING` permission to your `AndroidManifest.xml`. You can verify this in `platforms/android/app/src/main/AndroidManifest.xml` after preparing the platform.

**Important:** Ensure your `config.xml`'s `<widget id="...">` attribute exactly matches the **Package Name** (Application ID) you configured in the Google Play Console.
```xml
<!-- config.xml -->
<widget id="com.yourcompany.yourapp" version="1.0.0" ...>
    <!-- ... other settings ... -->
    <platform name="android">
        <!-- Plugin adds permission automatically, but verify if needed -->
        <!-- <config-file target="AndroidManifest.xml" parent="/*">
            <uses-permission android:name="com.android.vending.BILLING" />
        </config-file> -->
    </platform>
</widget>
```

### 5. Create In-App Products in Google Play Console

Define each virtual item under your app in the Play Console -> "Monetize" section -> "Products" (for one-time purchases like consumables/non-consumables) or "Subscriptions".

!INCLUDE "setup-android-7-google-play-products.md"

### 6. Upload Signed Build for Testing

**Crucial Step:** Google Play Billing requires Google to know the signature of your app to allow purchases, even for testing.

1.  **Generate a release signing key** if you don't have one ([Official Guide](https://developer.android.com/studio/publish/app-signing#generate-key)). Keep this key file (`.keystore` or `.jks`) and its passwords extremely safe!
2.  **Build a signed release APK or AAB** using this key. Debug builds **will not work** for testing IAPs.
3.  **Upload this build** to a testing track in the Google Play Console (e.g., "Internal testing" is recommended). You don't need to publish publicly.
4.  Ensure your **test account** (from step 3) is added as a tester for that track and has accepted the testing invitation (usually via a Play Store link).
5.  Install this signed version (or a *subsequent* version signed with the *same key*) onto your test device, ensuring the test account is the primary Google account on the device. Installation *must* typically come via the Play Store's testing mechanism, not `adb install`.

!INCLUDE "setup-android-6-upload-to-google-play.md"

### 7. (Recommended) Setup Receipt Validation Service

Server-side validation is essential for security and reliable subscription management.

!INCLUDE "sections/setup-subscription-android-7-validation-server.md"