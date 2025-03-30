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


Needless to say, make sure you have the tools installed on your machine. During the writing of this guide, I've been using the following environment:

* **NodeJS** v10.12.0
* **Cordova** v8.1.2
* **macOS** 10.14.1

I'm not saying it won't work with different version. If you start fresh, it might be a good idea to use an up-to-date environment.


### 2. Create Cordova Project


Making sure we have a Cordova project that we can build for Android and/or iOS.

#### Create the project

#### Create the project

If it isn't already created:

```text
$ cordova create CordovaProject cc.fovea.purchase.demo PurchaseNC
Creating a new cordova project.
```

For details about what those parameters are:

```text
$ cordova help create
```

Note, feel free to pick a different project ID and name. Remember whatever values you put in here.

Let's head into our cordova project's directory \(should match whatever we used in the previous step.

```text
$ cd CordovaProject
```
#### Add Android platform

```text
$ cordova platform add android
```

Will output:

```text
    Using cordova-fetch for cordova-android@~11.0.0
    Adding android project...
    [...]
    Saving android@~11.0.0 into config.xml file ...
```

Let's check if that builds.

```text
$ cordova build android
```

Which outputs:

```text
    Android Studio project detected
    Starting a Gradle Daemon (subsequent builds will be faster)
    [...]
    BUILD SUCCESSFUL in 1m 49s
    Built the following apk(s):
    __EDITED__/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

Hopefully there's no problems with our Android build chain. If you do have problems, fixing it is out of scope from this guide but it's required!


### 3. Setup Google Play Application & Billing

*   **Google Play Developer Account:** Ensure you have an active developer account ([Play Console](https://play.google.com/console/)).
*   **Create Application:** Create your application entry in the Google Play Console if it doesn't exist yet. You don't need to publish it publicly, but the app record must be created.
*   **Billing Setup:** Link a Google Merchant Account if you haven't already. This is usually done under "Setup" -> "Payments profile" in the Play Console. Ensure it's active.
*   **License Testing:** Add Google accounts (full Gmail addresses) you'll use for testing under "Setup" -> "License testing" in the Play Console. These accounts can make test purchases without being charged real money.


Make sure we have a Google Play application created and configured.

### Create the App

* Open the [Google Play Console](https://play.google.com/apps/publish).
* Click "Create Application", fill in the required fields.

{% hint style="info" %}
Need more help? I recommend you check [Google's own documentation](https://support.google.com/googleplay/android-developer/answer/113469?hl=en&ref_topic=7072031). It's well detailed, easy to follow and probably the most up-to-date resource you can find.
{% endhint %}


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


There is still a bit more preparatory work: we need to setup our in-app product.

Back in the "Google Play Console", open the "Store presence" ⇒ "In-app products" section.

![](../.gitbook/assets/google-play-in-app-products.png)

If you haven't yet uploaded an APK, it'll warn you that you need to upload a *release* APK.

Once this is done, you can create a product. Google offers 2 kinds of products:

* Managed Products
* Subscriptions

The latest is for auto-renewing subscriptions, in all other cases, you should a "Managed Product".

* Click the **CREATE** button.
* Fill in all the required information \(title, description, prices\).
* Make sure the Status is **ACTIVE**.
* **SAVE**

And we're done!

{% hint style="info" %}
There's might be some delay between creating a product on the Google Play Console and seeing it in your app. If your product doesn't show up after 24h, then you should start to worry.
{% endhint %}


### 6. Upload Signed Build for Testing

**Crucial Step:** Google Play Billing requires Google to know the signature of your app to allow purchases, even for testing.

1.  **Generate a release signing key** if you don't have one ([Official Guide](https://developer.android.com/studio/publish/app-signing#generate-key)). Keep this key file (`.keystore` or `.jks`) and its passwords extremely safe!
2.  **Build a signed release APK or AAB** using this key. Debug builds **will not work** for testing IAPs.
3.  **Upload this build** to a testing track in the Google Play Console (e.g., "Internal testing" is recommended). You don't need to publish publicly.
4.  Ensure your **test account** (from step 3) is added as a tester for that track and has accepted the testing invitation (usually via a Play Store link).
5.  Install this signed version (or a *subsequent* version signed with the *same key*) onto your test device, ensuring the test account is the primary Google account on the device. Installation *must* typically come via the Play Store's testing mechanism, not `adb install`.


Once you have built your release APK, you need to upload it to Google Play in order to be able to test In-App Purchases. In-App Purchase is not enabled in "debug build". In order to test in-app purchase, your APK needs to be signed with your release signing key. In order for Google to know your release signing key for this application, you need to upload a release APK:

* Signed with this key.
* Have the BILLING permission enabled
  * it is done when you add the plugin to your project, so make sure you didn't skip this step.

Google already provides [detailed resource on how to upload a release build](https://support.google.com/googleplay/android-developer/answer/7159011). What we want here is to:

1. create an **internal testing release**
2. **upload** it
3. **publish** it \(privately probably\).

Once you went over those steps, you can test your app with in-app purchase enabled without uploading to Google Play each time, but you need to sign the APK with the same "release" signing key.

{% hint style="warning" %}
Note that it might up to 24 hours for your IAP to work after you uploaded the first release APK.
{% endhint %}


### 7. (Recommended) Setup Receipt Validation Service

Server-side validation is essential for security and reliable subscription management.

### 7. (Recommended) Setup Receipt Validation Service

For subscriptions (and non-consumables), **server-side receipt validation is essential** for security and reliable status tracking.

{% hint style="info" icon="info" %}
**Receipt Validation Reminder**

Remember, for subscriptions and non-consumables, relying solely on local device data is insecure and unreliable for managing entitlements.

**Always implement server-side receipt validation** using your own backend or a service like [Iaptic](https://www.iaptic.com/) to:
*   Confirm purchase legitimacy.
*   Get the authoritative subscription status and expiry date.
*   Prevent fraud.
*   Support cross-platform/device access.

Ensure `store.validator` is configured in your `initStore()` function.
{% endhint %}
**Options:**

1.  **Use Iaptic (Recommended):**
    *   [Iaptic](https://www.iaptic.com/) handles the complexities of validating Google Play receipts, including the newer SubscriptionV2 API required for Billing Library v5+.
    *   Sign up and get your API Key and App Name.
    *   Configure the plugin:

        ```javascript
        const { store } = CdvPurchase;
        const iaptic = new CdvPurchase.Iaptic({
          url: 'https://validator.iaptic.com', // Or your custom endpoint
          appName: 'YOUR_IAPTIC_APP_NAME',
          apiKey: 'YOUR_IAPTIC_API_KEY'
        });
        store.validator = iaptic.validator;

        store.initialize([CdvPurchase.Platform.GOOGLE_PLAY]);
        ```
    *   You will need to provide Iaptic with your **Google Play Developer API credentials** (Service Account JSON key). Follow Iaptic's setup guide for instructions.

2.  **Build Your Own Server:**
    *   Requires significant backend development using the [Google Play Developer API](https://developers.google.com/android-publisher).
    *   Specifically, use the `purchases.subscriptionsv2.get` endpoint: [Google Subscription Purchase Get Docs](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2/get).
    *   Handle API authentication using a Service Account.
    *   Store and manage subscription status, expiry dates, and renewal events.
    *   Implement secure communication.
    *   Set `store.validator` to your server's endpoint URL.
    *   You will need your **Service Account JSON Key**.

**Skipping server-side validation for Google Play subscriptions is highly problematic as local receipts often lack accurate expiry dates and renewal status information.**