## Setup for Google Play

This guide details the necessary steps to configure your development environment, Google Play Console, and application settings before implementing In-App Purchases for Android using `cordova-plugin-purchase` v13+.

{% hint style="warning" icon="warning" %}
**Platform Interfaces Change Frequently!**

The Google Play Console interface and Google's requirements (like API access or testing procedures) can change. This guide provides a general overview based on common practices but may become outdated.

**Always refer to the official Google documentation as the primary source:**
*   [Google Play Billing Overview](https://developer.android.com/google/play/billing/billing_overview)
*   [Set up Google Play Billing](https://developer.android.com/google/play/billing/integrate)
*   [Create & Manage Products/Subscriptions](https://developer.android.com/google/play/billing/subscriptions)
*   [Testing Google Play Billing](https://developer.android.com/google/play/billing/test)
*   [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
*   [Setting up Google Play Developer API Access](https://developers.google.com/android-publisher/getting_started) (Needed for Server-Side Validation)
{% endhint %}

### 1. Install Dependencies

Ensure you have the basic development tools installed (Node.js, Cordova CLI, Android SDK/Studio).


!INCLUDE "./install-dependencies.src.md"


### 2. Create or Prepare Cordova Project

Set up your Cordova project and add the Android platform.


!INCLUDE "./setup-android-2-create-cordova-project.src.md"


*   **Important:** Ensure the `<widget id="...">` in your `config.xml` **exactly matches** the **Package Name** (Application ID) you will use in the Google Play Console.

### 3. Setup Google Play Console Application & Billing

Configure your app record and billing settings in the Google Play Console.

*   **Google Play Developer Account:** You need an active Google Play Developer account ([Play Console](https://play.google.com/console/)).
*   **Create Application:** Create your application entry in the Play Console if it doesn't exist yet. Use the same Package Name as in your `config.xml`.
*   **Billing Setup:** Ensure you have set up a Payments Profile linked to your developer account (usually under "Setup" -> "Payments profile"). It must be active to test or publish IAPs.
*   **License Testing:** Add the Google account(s) (full Gmail addresses) you will use for testing under "Setup" -> "License testing". These accounts can make test purchases without being charged.


!INCLUDE "./setup-android-3-google-play.src.md"


### 4. Install Plugin and Configure Project

Install the purchase plugin. The necessary AndroidManifest permission is added automatically.

1.  **Install Plugin:**
    ```bash
    cordova plugin add cordova-plugin-purchase
    ```
2.  **Verify `config.xml` ID:** Double-check that the `<widget id="...">` matches your Google Play Package Name.
3.  **Verify `AndroidManifest.xml`:** After running `cordova prepare android`, you can optionally check `platforms/android/app/src/main/AndroidManifest.xml` to ensure the following permission is present (the plugin adds it):
    ```xml
    <uses-permission android:name="com.android.vending.BILLING" />
    ```


!INCLUDE "./setup-android-4-install-cordova-plugin.src.md"


### 5. Create In-App Products in Google Play Console

Define the specific items (consumables, non-consumables, subscriptions) you want to sell.

*   Navigate to your app in the Play Console.
*   Go to the "Monetize" section -> "Products" or "Subscriptions".
*   Click "Create product" or "Create subscription".
*   Fill in all required details: **Product ID** (unique, used in `store.register`), Name, Description, Price.
*   **Activate** the product/subscription.


!INCLUDE "./setup-android-7-google-play-products.src.md"


*(Review included content for consistency)*
*   **Product IDs:** Note down the exact Product IDs.

### 6. Build and Upload a Signed Build for Testing

**CRITICAL STEP:** Google Play Billing requires a **release-signed build** to be uploaded to a testing track before IAPs (even test purchases) will work correctly. Debug builds **will not work**.

1.  **Generate Release Key:** If you don't have one, create a Java Keystore (`.keystore` or `.jks`) using `keytool`. **Back up this file and its passwords securely!** You need it for all future updates.
    ```bash
    keytool -genkey -v -keystore my-release-key.keystore -alias mykeyalias -keyalg RSA -keysize 2048 -validity 10000
    ```
2.  **Build Signed APK/AAB:** Use the Cordova CLI with build configuration or Android Studio, ensuring you sign with your release key. A helper script can simplify this:


!INCLUDE "./setup-android-5-android-release-apk.src.md"


3.  **Upload to Play Console:**
    *   Go to **Release -> Testing -> Internal testing** (recommended) or Closed testing.
    *   Create a new release and **upload the signed APK or AAB**.
    *   Add your **License Tester** email addresses (from Step 3) to the tester list for this track.
    *   Save and **roll out** the release. It may take time (minutes to hours) to become available to testers.


!INCLUDE "./setup-android-6-upload-to-google-play.src.md"


### 7. Configure Test Device

*   Use a **physical Android device**.
*   Log into the device **only** with a Google account that is listed as a **License Tester** and is part of the **testing track** you uploaded the build to.
*   Install the app **from the Google Play Store** using the testing link/invitation provided by the Play Console. **Do not** install manually via `adb` if possible, as this can cause issues.


!INCLUDE "./setup-android-8-test-accounts.src.md"


### 8. (Recommended) Setup Receipt Validation Service

Server-side validation is essential for security and reliable subscription management.


!INCLUDE "./setup-subscription-android-9-validation-server.src.md"


*   **Remember:** You'll need **Google Play Developer API access** (via a Service Account JSON key) configured on your validation server.

---

After completing these steps, your Google Play Console, application build, and test device should be configured to support In-App Purchases using `cordova-plugin-purchase`. You can now proceed to implement the purchase logic in your application code as shown [here](/use-cases/setup/code-framework).
