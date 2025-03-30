# Non-Consumable Product with Google Play



# Non Consumable on Android

In this guide, we will build a small application with a non-consumable product that works on Android.


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


## Code Implementation

This section describes the minimal code required to implement a non-consumable product (e.g., remove ads, unlock premium features) on Android using the Google Play platform.

### Base framework

First, we set up the basic HTML structure and the initial JavaScript to load the plugin.


#### index.html

Assuming you're starting from a blank project, we'll add the minimal amount of HTML for the purpose of this tutorial. Let's replace the `<body>` from the `www/index.html` file with the below.

```markup
<body>
  <div id="app"></div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
```

Let's also make sure to comment out Cordova template project's CSS.

You also need to enable the `'unsafe-inline'` `Content-Security-Policy` by adding it to the `default-src` section:

```markup
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self' 'unsafe-inline' [...]" />
```

You can download the [full index.html file here](https://gist.github.com/j3k0/80c69837e5bacf83c4fc2320ba2e5dc2).
#### javascript


We will now create a new JavaScript file and load it from the HTML. The code below will initialize the plugin.

{% code lineNumbers="true" %}
{% endcode %}

Here's a little explanation:

**Line 1**, it's important to wait for the "deviceready" event before using cordova plugins.

**Lines 5-8**, we check if the plugin was correctly loaded.

**Lines 11-13**, we setup an error handler. It just logs errors to the console.

> Whatever your setup is, you should make sure this runs as soon as the javascript application starts. You have to be ready to handle IAP events as soon as possible.

### Initialization & Presentation

Next, we initialize the plugin, register our non-consumable product, and set up the UI. This involves:
*   Registering the product with type `NON_CONSUMABLE`.
*   Displaying product details (title, description, price).
*   Showing a "Buy" or "Unlock" button only when the product `canPurchase`.
*   Checking the `product.owned` status to reflect whether the feature is unlocked in the UI.

### Initialization

Let's set up the basic HTML and JavaScript structure.

**HTML (`index.html` body):**

```html
<body>
  <div class="app">
    <!-- Status messages will go here -->
    <div id="messages">Loading...</div>
    <!-- Product details and purchase button -->
    <div id="product-details">Please wait...</div>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
```

**JavaScript (`index.js` or equivalent):**

```javascript
document.addEventListener('deviceready', initStore, false);

// Placeholder Product ID - REPLACE THIS with your actual Product ID
const MY_PRODUCT_ID = 'nonconsumable1';

function initStore() {

    const { store, ProductType, Platform, ErrorCode } = CdvPurchase;

    if (!store) { // Ensure the store object is available
        log('Store not available');
        return;
    }

    // Log all errors
    store.error(error => {
        log('ERROR ' + error.code + ': ' + error.message);
        updateMessages('Error: ' + error.message);
    });

    // Register the non-consumable product
    store.register({
        id: MY_PRODUCT_ID,
        type: ProductType.NON_CONSUMABLE,
        platform: store.defaultPlatform() // Or specify Platform.APPLE_APPSTORE, Platform.GOOGLE_PLAY
    });

    // Setup the validator (RECOMMENDED)
    // store.validator = "YOUR_VALIDATOR_URL";
    // store.validator = new CdvPurchase.Iaptic({...}).validator;

    // Setup event listeners
    store.when()
      .productUpdated(renderProduct) // Render the product UI when its data is available/updated
      .approved(transaction => {
          log('Approved: ' + transaction.products[0].id);
          // If using validation:
          if (store.validator) {
              updateMessages('Purchase approved. Verifying...');
              transaction.verify();
          } else {
              // WARNING: No validation - insecure for non-consumables
              log('WARNING: Skipping receipt validation.');
              updateMessages('Purchase approved. Finishing...');
              grantEntitlement(transaction.products[0].id);
              transaction.finish();
          }
      })
      .verified(receipt => {
          log('Verified: ' + receipt.id);
          updateMessages('Purchase verified. Finishing...');
          // Grant entitlement based on the verified purchase
          receipt.collection.forEach(purchase => grantEntitlement(purchase.id));
          receipt.finish(); // IMPORTANT: Finish the transaction
      })
      .unverified(unverifiedReceipt => {
          log('Purchase not verified.');
          updateMessages('Purchase failed verification.');
          // Decide how to handle failed verification (e.g., deny entitlement, retry?)
      })
      .finished(transaction => {
          log('Finished: ' + transaction.transactionId);
          updateMessages('Purchase complete!');
          renderUI(); // Ensure UI reflects the final owned state
      });

    // Initialize the store
    updateMessages('Initializing Store...');
    store.initialize([store.defaultPlatform()])
      .then(() => {
          log('Store initialized');
          updateMessages('Store ready.');
          renderUI();
      });
}

// --- Placeholder Functions (Implement in your main use-case file) ---

function renderProduct(product) {
    // Find the element to update
    const el = document.getElementById('product-details');
    if (!el) return;

    // Basic rendering - customize this in your use-case file
    log('Rendering product: ' + product.id);
    let html = `<h3>${product.title}</h3><p>${product.description}</p>`;
    const offer = product.getOffer();
    if (offer) {
        html += `<p>Price: ${offer.pricingPhases[0].price}</p>`;
        if (offer.canPurchase) {
            html += `<button onclick="requestPurchase('${product.platform}', '${product.id}', '${offer.id}')">Buy</button>`;
        } else if (product.owned) {
            html += `<p>(Already Owned)</p>`;
        } else {
            html += `<p>(Cannot Purchase)</p>`;
        }
    } else {
        html += `<p>Loading price...</p>`;
    }
    el.innerHTML = html;
}

function renderUI() {
    // This function should update the overall UI based on ownership state.
    // Implement the specific logic in your main use-case file.
    log('Rendering main UI...');
    // Example: Check ownership and update a status message or unlock UI elements
    const owned = CdvPurchase.store.owned(MY_PRODUCT_ID);
    updateMessages(owned ? 'Product Owned' : 'Product Not Owned');
}

function grantEntitlement(productId) {
    // This function grants access to the purchased content/feature.
    // Implement the specific logic in your main use-case file.
    log('Granting entitlement for: ' + productId);
    // Example: Set a flag in secure storage, update user profile on backend, etc.
}

function requestPurchase(platform, productId, offerId) {
    // This function initiates the purchase flow.
    log(`Requesting purchase: ${platform}, ${productId}, ${offerId}`);
    const offer = CdvPurchase.store.get(productId, platform)?.getOffer(offerId);
    if (offer) {
        updateMessages('Initiating purchase...');
        offer.order().then(error => {
            if (error) {
                if (error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
                    updateMessages('Purchase cancelled.');
                } else {
                    updateMessages(`Purchase failed: ${error.message}`);
                }
            } else {
                // Purchase flow initiated, waiting for 'approved' or 'cancelled'/'failed'
                updateMessages('Purchase flow started...');
            }
        });
    } else {
        updateMessages('Offer not found for purchase.');
    }
}

function updateMessages(text) {
    // Helper to show status messages
    const el = document.getElementById('messages');
    if (el) el.textContent = text;
}

// Simple log function for the example
function log(msg) {
    console.log('[Store Init] ' + msg);
}

// Initial UI update on device ready
document.addEventListener('deviceready', renderUI, false);

```
*Initial HTML modification suggestion for `./use-cases/sections/non-consumable-generic-initialization.md`: Adapt the example to reflect unlocking a feature. Instead of `window.localStorage.goldCoins`, use something like `window.localStorage.featureUnlocked = "YES"` and update the UI based on this flag.*

### Purchase Flow

Finally, we handle the purchase events. For non-consumables on Google Play, the key is to **acknowledge** the purchase to prevent automatic refunds.
*   Initiate the order when the "Buy/Unlock" button is clicked.
*   Handle the `approved` state. Verification is optional but highly recommended to prevent fraud.
*   **Acknowledge** the purchase by calling `transaction.finish()`. This confirms delivery to Google Play. **Do not consume** non-consumable products.
*   Update your application state (e.g., set `window.localStorage.featureUnlocked = "YES"`) and refresh the UI.

### Purchase Flow (Android/Google Play Non-Consumable)

With the store initialized and product details displayed, we now implement the purchase logic specific to Google Play for non-consumable items. The key difference on Android is the need to **acknowledge** the purchase within 3 days to prevent automatic refunds.

**Step 1: Implement the Purchase Action**

*   **What:** Fill in the `window.purchaseFeature` function stub (created in the generic section) to call `store.order()` for the Google Play platform.
*   **Why:** This triggers the Google Play purchase dialog when the user clicks the "Unlock Now!" button.

Replace the placeholder `window.purchaseFeature` function in `www/js/index.js` with this implementation:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.purchaseFeature = function() {
    const productId = 'nonconsumable1'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for ${productId}`);
    const { store, Platform } = CdvPurchase; // Get Platform enum

    // Ensure we target the correct platform product
    const product = store.get(productId, Platform.GOOGLE_PLAY); // Explicitly get Google Play version
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for offer: ${offer.id} on platform ${offer.platform}`);
        // Optional: Update UI to show a loading/processing state
        // setState({ isPurchasing: true });

        store.order(offer)
            .then(result => {
                // Order initiation successful or user cancelled.
                // Completion is handled by event listeners.
                if (result && result.code === store.ErrorCode.PAYMENT_CANCELLED) {
                    console.log("User cancelled the purchase via Google Play.");
                    // Optionally update UI, e.g., setState({ isPurchasing: false });
                } else if (result && result.isError) {
                    console.error("Order initiation failed: " + result.message);
                    // Optionally update UI, e.g., setState({ isPurchasing: false, error: result.message });
                } else {
                    console.log("Order initiated with Google Play. Waiting for approval...");
                    // UI state like 'isPurchasing' might remain true
                }
            })
            .catch(err => {
                 console.error("Unexpected error during order initiation:", err);
                 // Optionally update UI, e.g., setState({ isPurchasing: false, error: 'Unexpected error' });
            });

    } else {
        console.error(`Cannot purchase feature: Product (${productId}) or its offer not found or not loaded yet.`);
        alert('Unable to purchase. Product details might still be loading or the product ID is incorrect.');
    }
}
```

**Step 2: Handle the "Approved" State**

*   **What:** Add an `.approved()` listener. This fires when the Google Play Billing library indicates the payment has been processed successfully on Google's side, but before your app has acknowledged it.
*   **Why:** This is the signal to verify the purchase (if using a validator) or proceed directly to acknowledging it.

Add the `.approved()` handler within the `store.when()` chain in your `initializeStore` function:

```javascript
// Inside initializeStore() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);

        // Verification is recommended for security.
        if (store.validator) {
            console.log('Verification pending for ' + transaction.transactionId);
            // Optional: Update UI to indicate verification
            // setState({ isVerifying: true });
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Finishing purchase without server verification.");
             // Acknowledge directly if no validator
             acknowledgeFeatureAndFinish(transaction);
        }
    })
    // Add .verified() and .finished() next
```

**Step 3: Handle the "Verified" State (Recommended)**

*   **What:** Add a `.verified()` listener. This is called after successful validation via `transaction.verify()`.
*   **Why:** Confirms the purchase is legitimate according to your server. This is the ideal point to grant entitlement and acknowledge the purchase to Google.

Add the `.verified()` handler within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        // Optional: Update UI
        // setState({ isVerifying: false });

        // Find the relevant transaction
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === 'nonconsumable1'); // Use your product ID

        if (verifiedTransaction) {
            acknowledgeFeatureAndFinish(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected transaction?");
        }
    })
    // Add .finished() next
```

**Step 4: Handle the "Finished" State**

*   **What:** Add a `.finished()` listener. This fires after `transaction.finish()` successfully acknowledges the purchase with Google Play.
*   **Why:** Indicates the transaction is fully complete in the Google Play system. Useful for final UI updates or logging.

Add the `.finished()` handler within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished (acknowledged) for ${transaction.products[0]?.id}.`);
        // Feature should already be unlocked. Refresh UI to be sure.
        refreshFeatureUI();
    });
```

**Step 5: Implement Feature Unlock and Acknowledge Logic**

*   **What:** Create the `acknowledgeFeatureAndFinish` function. This function updates your app's state (`localStorage`) to unlock the feature and calls `transaction.finish()` to acknowledge the purchase with Google Play.
*   **Why:** You **must** acknowledge non-consumable purchases on Google Play within 3 days, otherwise Google will automatically refund the user. Calling `transaction.finish()` performs this acknowledgment. **Do not consume non-consumables.**

Add this new function to `www/js/index.js`:

```javascript
// In js/index.js

function acknowledgeFeatureAndFinish(transaction) {
    // Grant the entitlement if not already granted
    const isUnlocked = window.localStorage.getItem(FEATURE_KEY) === 'YES';
    if (isUnlocked) {
        console.log(`Feature already unlocked, acknowledging transaction ${transaction.transactionId} again just in case.`);
    } else {
        console.log(`Unlocking feature for transaction ${transaction.transactionId}...`);
        // Persist the unlock status
        window.localStorage.setItem(FEATURE_KEY, 'YES');
        // Refresh the UI immediately
        refreshFeatureUI();
        alert('Feature Unlocked! Thank you.');
    }

    // Acknowledge the purchase with Google Play.
    // This is CRUCIAL for non-consumables on Android.
    console.log(`Acknowledging (finishing) transaction ${transaction.transactionId}...`);
    transaction.finish();
}
```

---

**Build and Test (Android/Google Play)**

Testing Google Play In-App Purchases requires specific steps:

**1. Create a Release Build:**

*   Google Play Billing often only works correctly with **release-signed APKs/AABs**. Debug builds usually fail.
*   You need a Java Keystore to sign your release build. If you don't have one, create it:
    ```bash
    keytool -genkey -v -keystore my-release-key.keystore -alias mykeyalias -keyalg RSA -keysize 2048 -validity 10000
    ```
    Remember the alias and passwords you set. **Back up this keystore file securely!**
*   Build the signed release APK. You can use Cordova CLI with a `build.json` or Android Studio. A helper script like `android-release.sh` (mentioned in setup section [setup-android-5-android-release-apk.md](!UNRESOLVED-LINK:./sections/setup-android-5-android-release-apk.md)) simplifies this:
    ```bash
    # Set environment variables or the script will prompt you
    export KEYSTORE_PATH=/path/to/my-release-key.keystore
    export KEYSTORE_ALIAS=mykeyalias
    # export KEYSTORE_PASSWORD=your_store_password # Optional, script prompts if not set
    # export KEY_PASSWORD=your_key_password       # Optional, script prompts if not set

    ./android-release.sh # Assuming you have the script from the setup guide
    ```
    This produces an APK like `android-release-YYYYMMDD-HHMM.apk`.

**2. Upload to Google Play:**

*   Go to the Google Play Console.
*   Navigate to your app.
*   Go to **Release -> Testing -> Internal testing** (or Closed testing).
*   Create a new release and **upload the signed release APK** you just built.
*   Add testers' Google account email addresses to the tester list for that track.
*   **Save and roll out** the release to your testers. It might take some time (minutes to hours) for the release to become available.

**3. Prepare Test Device:**

*   Use a **physical Android device**. Emulators are often unreliable for IAP testing.
*   Log into the device with a Google account that is listed as a **tester** in the Play Console for your internal/closed track. **Ensure this is the *only* Google account active on the device**, or the primary one, to avoid conflicts.
*   Make sure the Google Play Store app is up-to-date.

**4. Install and Run:**

*   Testers need to **accept the testing invitation** (usually via a link provided by the Play Console).
*   Install the app **from the Google Play Store** using the testing link, **not** by manually installing the APK via `adb install` (this often bypasses required Play Store initialization).
*   Alternatively, if you built an APK (not AAB), you can install the *release signed* APK directly for quick tests *after* having uploaded at least one version to Play Console:
    ```bash
    adb install -r path/to/android-release-....apk
    ```
*   Open the app.
*   Use `adb logcat` to monitor logs:
    ```bash
    adb logcat CordovaPurchase:D CordovaLog:D chromium:D *:S
    ```

**5. Test the Purchase:**

*   Navigate to the feature/product in your app.
*   Observe the logs and UI:
    *   Store initialization messages should appear.
    *   Feature status should be "Locked".
    *   Product details (title, price) should load, and the "Unlock Now!" button should appear.
*   Tap **"Unlock Now!"**.
*   The Google Play purchase sheet should appear. It might mention "Test card, always approves".
*   Confirm the purchase.
*   Observe Logcat and the app UI:
    *   `Transaction ... approved...` log.
    *   `(If validator set) Verification pending...` / `Receipt verified...` logs.
    *   `Unlocking feature...` log.
    *   `Acknowledging (finishing) transaction...` log.
    *   `Transaction ... finished...` log.
*   The UI should update to "Feature Status: UNLOCKED! 🎉", and the button should change to "_(Already Purchased)_".
*   **Restart the app:** Verify the unlocked status persists.

---

This completes the non-consumable purchase flow for Android. The key takeaway is the necessity of **acknowledging** the purchase using `transaction.finish()`.