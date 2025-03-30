# Consumable on Google Play

This use case explains how to implement a **consumable** product (like virtual currency or extra lives) on Android using the Google Play platform and `cordova-plugin-purchase` v13+.

## 1. Platform Setup

First, ensure your Google Play Console, application build, and test environment are correctly configured for Google Play Billing.

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


Needless to say, make sure you have the tools installed on your machine. During the writing of this guide, I've been using the following environment:

* **NodeJS** v10.12.0
* **Cordova** v8.1.2
* **macOS** 10.14.1

I'm not saying it won't work with different version. If you start fresh, it might be a good idea to use an up-to-date environment.


### 2. Create or Prepare Cordova Project

Set up your Cordova project and add the Android platform.


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

*   **Important:** Ensure the `<widget id="...">` in your `config.xml` **exactly matches** the **Package Name** (Application ID) you will use in the Google Play Console.

### 3. Setup Google Play Console Application & Billing

Configure your app record and billing settings in the Google Play Console.

*   **Google Play Developer Account:** You need an active Google Play Developer account ([Play Console](https://play.google.com/console/)).
*   **Create Application:** Create your application entry in the Play Console if it doesn't exist yet. Use the same Package Name as in your `config.xml`.
*   **Billing Setup:** Ensure you have set up a Payments Profile linked to your developer account (usually under "Setup" -> "Payments profile"). It must be active to test or publish IAPs.
*   **License Testing:** Add the Google account(s) (full Gmail addresses) you will use for testing under "Setup" -> "License testing". These accounts can make test purchases without being charged.


Make sure we have a Google Play application created and configured.

### Create the App

* Open the [Google Play Console](https://play.google.com/apps/publish).
* Click "Create Application", fill in the required fields.

{% hint style="info" %}
Need more help? I recommend you check [Google's own documentation](https://support.google.com/googleplay/android-developer/answer/113469?hl=en&ref_topic=7072031). It's well detailed, easy to follow and probably the most up-to-date resource you can find.
{% endhint %}

*(Review included content for consistency)*

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


To install the plugin, we will use the usual `cordova plugin add` command.

```text
cordova plugin add cordova-plugin-purchase"
```

Now let's try to build.

```text
cordova build android
```

Successful build?

```text
[...]
BUILD SUCCESSFUL in 2s
```

All good! Seems like we can build an app with support for the Billing API.

Let's now prepare a release APK.

*(Review included content for consistency)*

### 5. Create In-App Products in Google Play Console

Define the specific items (consumables, non-consumables, subscriptions) you want to sell.

*   Navigate to your app in the Play Console.
*   Go to the "Monetize" section -> "Products" or "Subscriptions".
*   Click "Create product" or "Create subscription".
*   Fill in all required details: **Product ID** (unique, used in `store.register`), Name, Description, Price.
*   **Activate** the product/subscription.


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

*(Review included content for consistency)*
*   **Product IDs:** Note down the exact Product IDs.

### 6. Build and Upload a Signed Build for Testing

**CRITICAL STEP:** Google Play Billing requires a **release-signed build** to be uploaded to a testing track before IAPs (even test purchases) will work correctly. Debug builds **will not work**.

1.  **Generate Release Key:** If you don't have one, create a Java Keystore (`.keystore` or `.jks`) using `keytool`. **Back up this file and its passwords securely!** You need it for all future updates.
    ```bash
    keytool -genkey -v -keystore my-release-key.keystore -alias mykeyalias -keyalg RSA -keysize 2048 -validity 10000
    ```
2.  **Build Signed APK/AAB:** Use the Cordova CLI with build configuration or Android Studio, ensuring you sign with your release key. A helper script can simplify this:
    !INCLUDE "./setup-android-5-android-release-apk.md" *(Review included script/steps)*
3.  **Upload to Play Console:**
    *   Go to **Release -> Testing -> Internal testing** (recommended) or Closed testing.
    *   Create a new release and **upload the signed APK or AAB**.
    *   Add your **License Tester** email addresses (from Step 3) to the tester list for this track.
    *   Save and **roll out** the release. It may take time (minutes to hours) to become available to testers.


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

*(Review included content for consistency)*

### 7. Configure Test Device

*   Use a **physical Android device**.
*   Log into the device **only** with a Google account that is listed as a **License Tester** and is part of the **testing track** you uploaded the build to.
*   Install the app **from the Google Play Store** using the testing link/invitation provided by the Play Console. **Do not** install manually via `adb` if possible, as this can cause issues.


To test your Google Play Billing implementation with actual in-app purchases, you must use a test account. By default, the only test account registered is the one that's associated with your developer account. You can register additional test accounts by using the Google Play Console.

1. Navigate to Settings > Account details.
2. In the License Testing section, add your tester's email addresses to Gmail accounts with testing access field.
3. Save your changes.

{% hint style="info" %}
Testers can begin making purchases of your in-app products within 15 minutes.
{% endhint %}

*(Review included content for consistency)*

### 8. (Recommended) Setup Receipt Validation Service

Server-side validation is essential for security and reliable subscription management.

### 9. Setup Receipt Validation Server (Google Play)

Reliably managing Android subscriptions, especially determining the exact expiry date and renewal status, requires communication with the **Google Play Developer API**. The purchase plugin itself does not directly communicate with this server-side API. You need an intermediary service for this, often referred to as a receipt validation server.

While you can build your own server to interact with the Google Play Developer API, this guide will use **Iaptic** (the service developed by the plugin's author) which simplifies this process.

**Why is this needed for Android Subscriptions?**

*   **Accurate Expiry Dates:** Local receipt data on Android doesn't always contain a reliable expiry date, especially after renewals or cancellations. The Google Play Developer API is the source of truth.
*   **Renewal Status:** Checking if a subscription will auto-renew or has been cancelled requires server-side checks.
*   **Grace Periods & Account Hold:** Handling billing issues requires server-side status information.

**Steps using Iaptic:**

1.  **Create an Iaptic Account:** If you haven't already, sign up at [iaptic.com](https://www.iaptic.com/).
2.  **Connect with Google Play Developer API:**
    *   Navigate to your Iaptic project settings.
    *   Find the "Google Play" section.
    *   Follow the instructions provided by Iaptic to connect your Google Play Developer account. This typically involves:
        *   Creating a **Service Account** in your Google Cloud Console project that is linked to your Google Play Developer Console.
        *   Granting the necessary permissions (like "View financial data" and "Manage orders and subscriptions") to this Service Account within the Google Play Console.
        *   Uploading the JSON key file for the Service Account to Iaptic.
    *   Iaptic provides detailed guides for this process: [Connect With Google](https://www.iaptic.com/documentation/connect-with-google-publisher-api/)
3.  **Configure the Plugin:**
    *   Go to the "Setup" section in your Iaptic dashboard and find the "Cordova" setup instructions.
    *   Copy the provided `store.validator` URL. It will look something like `https://validator.iaptic.com/...`.
    *   Paste this URL into your application's initialization code where you configure the store validator:

    ```javascript
    // In your initStore() or equivalent function
    const iaptic = new CdvPurchase.Iaptic({
      appName: "[Your Iaptic App Name]", // Replace with your actual App Name
      apiKey: "[Your Iaptic Public Key]" // Replace with your actual Public Key
    });
    CdvPurchase.store.validator = iaptic.validator;
    ```

    *   Ensure your `Content-Security-Policy` in `index.html` allows connections to `validator.iaptic.com` (or your custom Iaptic domain).

{% hint style="info" %}
Iaptic's validation service is often free or has a generous free tier during development (using test purchases) and offers paid plans for production use. Check their pricing for details.
{% endhint %}

{% hint style="warning" %}
Skipping this server-side validation step for Android subscriptions will lead to unreliable expiry date information and difficulty in managing subscription states correctly.
{% endhint %}

With the validator configured and connected to the Google Play Developer API, the plugin, via Iaptic, can now retrieve accurate subscription details during the validation process.*   **Remember:** You'll need **Google Play Developer API access** (via a Service Account JSON key) configured on your validation server.

---

After completing these steps, your Google Play Console, application build, and test device should be configured to support In-App Purchases using `cordova-plugin-purchase`. You can now proceed to implement the purchase logic in your application code as shown in the specific [Use Cases](..).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your consumable product, and display its information and the user's balance.

This section covers the initial setup and UI display for a **consumable** product (like virtual currency or game lives) using the `cordova-plugin-purchase` plugin (v13+). It focuses on registering the product and displaying its information, deferring the actual purchase logic to platform-specific guides.

**Assumptions:**

*   You have completed the [basic JavaScript setup](code-initial-javascript.md).
*   You have created a consumable product in your target platform's developer console (App Store Connect or Google Play Console).

**Step 1: Implement `initializeStoreAndSetupListeners`**

Replace the placeholder `initializeStoreAndSetupListeners` function (from the initial JavaScript setup) with the following code. This function registers your consumable product, optionally sets up a validator, adds a listener to update the UI when product data loads, and initializes the store.

{% code title="www/js/index.js (initializeStoreAndSetupListeners)" lineNumbers="true" %}
```javascript
// This function should be called by onDeviceReady after basic setup
function initializeStoreAndSetupListeners() {
  console.log('Setting up store for Consumables...');
  setStatus('Initializing Store for Consumables...');

  const { store, ProductType, Platform, LogLevel } = CdvPurchase;

  // --- Product Definition ---
  // Define the consumable product ID you configured in the App/Play Store.
  const MY_CONSUMABLE_ID = 'consumable1'; // Replace with your actual ID

  // --- Register Product ---
  // Register the product with the store.
  store.register({
    id: MY_CONSUMABLE_ID,
    type: ProductType.CONSUMABLE,
    platform: store.defaultPlatform() // Or specify Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE
  });

  // --- Optional: Setup Receipt Validator ---
  // While less critical than for subscriptions, validating consumables
  // prevents simple fraud and ensures purchases are legitimate.
  // Replace with your actual validator URL or function.
  // store.validator = "https://your-validator.com/validate";
  // store.validator = new CdvPurchase.Iaptic({...}).validator; // Example using Iaptic helper

  // --- Setup Event Listeners ---
  store.when()
    .productUpdated(product => {
      // Called when product data is loaded or updated.
      console.log('Product updated: ' + product.id);
      // Store the product reference for later use if needed
      if (product.id === MY_CONSUMABLE_ID) {
        // myProductReference = product; // Store if needed globally
      }
      refreshUI(); // Update the UI with product details
    })
    // Purchase flow listeners (.approved, .verified, .finished, .cancelled)
    // will be added in the platform-specific purchase flow sections.
    // For now, we only need productUpdated for display purposes.
    ; // End of store.when() chain

  // --- Initialize the Store ---
  // Initialize the platform specified during registration.
  store.initialize([store.defaultPlatform()])
    .then(() => {
      console.log('Store initialized successfully.');
      setStatus('Store ready.');
      refreshUI(); // Render the UI with initial data
    })
    .catch(err => {
      console.error('Store initialization failed:', err);
      setStatus('Store failed to initialize.');
    });
}

// --- UI Rendering ---

// Example: Store balance in localStorage (INSECURE - use SecureStorage or backend!)
let userCoinBalance = 0;
const COIN_BALANCE_KEY = 'userCoinBalance';
const COINS_GRANTED = 100; // Example amount granted by MY_CONSUMABLE_ID

function loadBalance() {
  try {
    userCoinBalance = parseInt(window.localStorage.getItem(COIN_BALANCE_KEY) || '0');
  } catch (e) {
    console.error('Error loading balance: ' + e);
    userCoinBalance = 0;
  }
}
function saveBalance() {
  try {
    window.localStorage.setItem(COIN_BALANCE_KEY, userCoinBalance.toString());
  } catch (e) {
    console.error('Error saving balance: ' + e);
  }
}

// This function updates the UI based on product data and coin balance
function refreshUI() {
  loadBalance(); // Load the current balance
  console.log('Refreshing UI...');
  const { store, Platform } = CdvPurchase; // Get store instance

  const product = store.get(MY_CONSUMABLE_ID); // Get our registered product
  const productEl = document.getElementById('product-details'); // Target the product display area
  const balanceEl = document.getElementById('user-status'); // Target the balance display area

  if (balanceEl) {
    balanceEl.innerHTML = `<b>Coins: ${userCoinBalance}</b>`;
  }

  if (productEl) {
    if (!product) {
      productEl.innerHTML = '<p>Loading product details...</p>';
      return;
    }

    // Product loaded, display its details
    let productHtml = `
      <h3>${product.title}</h3>
      <p>${product.description}</p>
    `;
    const offer = product.getOffer(); // Get the default offer
    if (offer) {
      productHtml += `<p>Price: ${offer.pricing?.price ?? 'N/A'}</p>`;
      // Consumables can generally always be purchased if the offer is valid
      if (offer.canPurchase) {
        // The buyConsumable function will be implemented in platform-specific guides
        productHtml += `<button id="buy-button" onclick="buyConsumable()">Buy ${COINS_GRANTED} Coins</button>`;
      } else {
        productHtml += `<p>(Cannot purchase at this time)</p>`;
      }
    } else {
      productHtml += `<p>Pricing information not available.</p>`;
    }
    productEl.innerHTML = productHtml;
  }
}

// --- Placeholder for Purchase Action ---
// This will be implemented in the platform-specific guides (consumable-android.md, consumable-ios.md)
window.buyConsumable = function() {
  console.log('Placeholder: buyConsumable() called.');
  alert('Purchase logic needs to be implemented for the specific platform.');
};

// --- Placeholder for Granting Logic ---
// This will be implemented in the platform-specific guides
function grantCoins(amount) {
  console.log(`Placeholder: Granting ${amount} coins.`);
  userCoinBalance += amount;
  saveBalance();
  refreshUI();
}

// Initial UI update on device ready (after basic setup in index.js)
document.addEventListener('deviceready', () => {
  // Ensure the initial call to initializeStoreAndSetupListeners happens
  // This line assumes the function from code-initial-javascript.js is named this way
  if (typeof initializeStoreAndSetupListeners === 'function') {
     // Already called by onDeviceReady in the initial script
  } else {
     // Fallback if the structure differs
     initializeStoreAndSetupListeners = initializeStore; // Assign our function
     initializeStoreAndSetupListeners();
  }
  // Load initial balance and render
  loadBalance();
  refreshUI();
}, false);

// Ensure setStatus is defined (it should be in the initial script)
if (typeof setStatus !== 'function') {
  setStatus = (message) => console.log('[Status] ' + message);
}

```
{% endcode %}

**Explanation:**

1.  **Product Definition (Line 9):** Define the `id` of your consumable product exactly as it appears in App Store Connect or Google Play Console.
2.  **Register Product (Lines 13-17):** Call `store.register()` with the `id`, `type` set to `ProductType.CONSUMABLE`, and the correct `platform`.
3.  **Validator Setup (Lines 20-24):** Optionally configure `store.validator` with your validation service URL. While not strictly mandatory for basic consumable functionality, it's recommended for security.
4.  **Event Listeners (Lines 27-38):** Set up a listener for `productUpdated`. This event fires when the product's details (title, price, etc.) are loaded from the store. Inside the callback, we call `refreshUI()` to display this information. Purchase-related listeners (`approved`, `verified`, `finished`) will be added later.
5.  **Initialize Store (Lines 41-50):** Call `store.initialize()` with the platform(s) you registered products for. This starts the connection to the store and begins loading product data.
6.  **UI Rendering (Lines 54-100):**
    *   The `refreshUI` function is responsible for displaying the product information and the user's current balance (e.g., number of coins).
    *   It uses `store.get(MY_CONSUMABLE_ID)` to retrieve the loaded product data.
    *   It displays the title, description, and price from the product's default `Offer`.
    *   It shows a "Buy" button if `offer.canPurchase` is true. The `onclick` calls `buyConsumable()`, which will be implemented next.
    *   It displays the user's coin balance (using `localStorage` here for simplicity – **use secure storage or a server backend in production**).
7.  **Placeholders (Lines 103-113):** Empty functions `buyConsumable` and `grantCoins` are defined. Their specific implementation depends on the platform and will be covered in the next steps.
8.  **Initial Load (Lines 116-126):** Ensures the initialization runs and the initial UI (including balance) is rendered when the device is ready.

This setup prepares your app to display the consumable product. The next steps involve implementing the platform-specific purchase flow (Android or iOS) to handle the actual buying process and granting the item.
*   **Note:** Replace the placeholder product ID (`'consumable1'`) in the code with your actual Google Play Product ID. Adapt the `grantCoins` function and UI rendering (`refreshUI`) to match your specific consumable item. Remember to use secure storage instead of `localStorage` for balances in production. Also, update the `store.register` call within the included code to specify `Platform.GOOGLE_PLAY`.

## 3. Purchase Flow

Implement the logic to handle the purchase process when the user taps the "Buy" button. This involves initiating the order and handling the `approved`, `verified` (optional but recommended), and `finished` events to grant the item and **consume** the purchase using `transaction.finish()`.

### Purchase Flow (Android/Google Play Consumable)

This section implements the purchase logic for consumable items (like virtual currency) on Android using Google Play, assuming you have completed the [generic consumable initialization](consumable-generic-initialization.md). The key step here is **consuming** the purchase using `transaction.finish()` after it's been granted to the user.

**Step 1: Implement the Purchase Action (`buyConsumable`)**

*   **What:** Replace the placeholder `window.buyConsumable` function (from the generic initialization) to call `offer.order()` for the Google Play platform.
*   **Why:** Initiates the Google Play purchase dialog when the user clicks the "Buy Coins" button.

Replace the placeholder `window.buyConsumable` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.buyConsumable = function() {
    const productId = 'consumable1'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for consumable: ${productId}`);
    const { store, Platform } = CdvPurchase; // Get Platform enum

    // Ensure we target the correct platform product
    const product = store.get(productId, Platform.GOOGLE_PLAY); // Explicitly get Google Play version
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for consumable offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating purchase...');

        // For Android, you might pass obfuscated account/profile IDs for fraud prevention
        // const additionalData = { googlePlay: { accountId: 'hashed_user_id', profileId: 'hashed_profile_id' } };
        // store.order(offer, additionalData)
        offer.order()
            .then(result => {
                // This promise resolves when the purchase flow UI is dismissed (successfully or not).
                // The final outcome is handled by the .approved, .cancelled, or .error listeners.
                if (result && result.isError) {
                    // Handle potential errors during order initiation (rare)
                    setStatus(`Order failed: ${result.message}`);
                } else {
                    // Purchase flow started, waiting for events...
                    // Status message will be updated by listeners.
                }
                refreshUI(); // Refresh UI in case button state needs update
            })
            .catch(err => {
                 // Should generally not happen if store.error is set up
                 console.error("Unexpected error during consumable order:", err);
                 setStatus('Unexpected error during purchase.');
                 refreshUI();
            });

    } else {
        console.error(`Cannot purchase: Product (${productId}) or offer not found or not loaded yet.`);
        setStatus('Error: Unable to purchase. Product details missing.');
    }
}
```

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function (created during generic initialization).
*   **Why:** These listeners handle the progression of the purchase: approval by Google Play, optional verification, and finalization (consumption).

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is recommended for security, even for consumables.
        if (store.validator) {
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting consumable without server verification.");
             // Grant and consume directly if no validator.
             grantAndConsumeItem(transaction);
        }
    })
    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        setStatus('Purchase verified. Finishing...');

        // Find the relevant transaction within the verified receipt
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === MY_CONSUMABLE_ID); // Use your consumable product ID

        if (verifiedTransaction) {
            // Grant the item and CONSUME the transaction
            grantAndConsumeItem(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected consumable transaction?");
            // Finish anyway to clear the queue if possible
            receipt.finish();
        }
    })
    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished (consumed) for ${transaction.products[0]?.id}.`);
        setStatus('Purchase complete! Coins granted.');
        // Item should already be granted. Update UI to allow repurchase.
        refreshUI(); // Refresh coin display & product UI
    })
    .cancelled(transaction => {
        console.log('Purchase Cancelled:', transaction.transactionId);
        setStatus('Purchase cancelled.');
        refreshUI();
    });
    // Ensure the .productUpdated listener from the generic setup is still present
```

**Step 3: Implement Granting and Consumption Logic (`grantAndConsumeItem`)**

*   **What:** Replace the placeholder `grantAndConsumeItem` function. It updates the user's balance and calls `transaction.finish()`.
*   **Why:** This function delivers the item. Crucially, for consumables on Google Play, calling `transaction.finish()` **triggers consumption** via the Billing Library's `consumeAsync`, making the item available for purchase again.

Replace the placeholder `grantAndConsumeItem` function in `www/js/index.js`:

```javascript
// In js/index.js

// Replace the placeholder function
function grantAndConsumeItem(transaction) {
    console.log(`Granting consumable for transaction ${transaction.transactionId}...`);

    // Determine quantity - Google Play supports multi-quantity, default to 1
    const quantity = transaction.quantity || 1;
    const coinsToAdd = COINS_GRANTED * quantity; // Use the constant defined earlier

    // Add item(s) to inventory/balance
    const currentCoins = parseInt(window.localStorage.getItem(COIN_BALANCE_KEY) || '0', 10);
    window.localStorage.setItem(COIN_BALANCE_KEY, (currentCoins + coinsToAdd).toString());

    console.log(`Added ${coinsToAdd} coins (Quantity: ${quantity}). New balance: ${currentCoins + coinsToAdd}`);

    // Refresh UI immediately (optional, .finished listener also calls refreshUI)
    // refreshUI();

    // Consume the purchase with Google Play by calling finish()
    console.log(`Consuming (finishing) transaction ${transaction.transactionId}...`);
    transaction.finish();
}
```

---

**Build and Test (Android/Google Play Consumable)**

Follow the testing procedure outlined for non-consumables on Android, keeping consumables in mind:

1.  **Create Release Build:** Use your release keystore.
2.  **Upload to Play Console:** Upload the signed APK/AAB to an internal or closed testing track. Add testers. Roll out.
3.  **Prepare Test Device:** Use a physical device logged in *only* with a tester Google account. Install the app *from the Play Store* using the test link/invitation.
4.  **Run & Monitor:** Launch the app and monitor logs with `adb logcat CordovaPurchase:V CordovaLog:V chromium:D *:S`.
5.  **Test Purchase:**
    *   Verify initial UI (coin count, product details, buy button).
    *   Tap "Buy Coins".
    *   Confirm purchase in the Google Play dialog ("Test card, always approves").
    *   Observe logs: `approved`, `verified` (if validator set), `Granting consumable...`, `Consuming (finishing) transaction...`, `finished`.
    *   Verify the coin count increases correctly.
    *   The "Buy Coins" button should remain available, allowing repurchase.

---

This completes the consumable purchase flow for Android/Google Play. The key step is using `transaction.finish()`, which implicitly consumes the product on this platform for this product type, making it available for purchase again.

## 4. Receipt Validation (Recommended)

Validating receipts server-side prevents fraud and ensures purchases are legitimate before granting items, even for consumables.

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
## 5. Testing

Follow the specific testing procedures for Google Play (signed release build, testing tracks, license tester accounts) outlined in the platform-specific purchase flow section above.
