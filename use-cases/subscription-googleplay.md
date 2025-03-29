# Paid Subscription with Google Play



# Subscription on Android

In this guide, we will build a small application with a subscription that works on Android with Google Play.


## Setup for Google Play

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


### 3. Create Google Play Application


Make sure we have a Google Play application created and configured.

### Create the App

* Open the [Google Play Console](https://play.google.com/apps/publish).
* Click "Create Application", fill in the required fields.

{% hint style="info" %}
Need more help? I recommend you check [Google's own documentation](https://support.google.com/googleplay/android-developer/answer/113469?hl=en&ref_topic=7072031). It's well detailed, easy to follow and probably the most up-to-date resource you can find.
{% endhint %}


### 4. Install Cordova Purchase Plugin


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


### 5. Android Release APK


To generate a release build, I generally use the following script: [android-release.sh](https://gist.github.com/j3k0/28f60a7d5622508634d09f94c59d6dfc)

The script calls `cordova build android --release` with the correct command line arguments. It requires you have generated a `keystore` file for your application already.

If you haven't generated a keystore file for your application yet, you can use the following command line:

```text
keytool -genkey -v -keystore android-release.keystore -alias release \
-keyalg RSA -keysize 2048 -validity 10000
```

I'll ask you a few questions. The only tricky one is "Do you wan't to use the same password for the alias?", the answer is _yes_. Please note that the above command defines the keystore's `alias` as **release**, you can use any value, but just remember the value you chose.

Keep the `android-release.keystore` file in a safe place, backup it everywhere you can! Don't loose it, don't loose the password. You won't EVER be able to update your app on Google Play without it!

Then build.

```text
$ export KEYSTORE_ALIAS=release
$ export KEYSTORE_PASSWORD=my_password
$ ./android-release.sh
```

Replace `$KEYSTORE_ALIAS` and `$KEYSTORE_PASSWORD` with whatever match your those from your `keystore` file...

The output should end with a line like this:

```text
Build is ready:

<SOME_PATH>/android-release-20181015-1145.apk
```

There you go, this is your first release APK.


### 6. Upload to Google Play


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


### 7. Create In-App Products


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


### 8. Prepare Test Accounts


To test your Google Play Billing implementation with actual in-app purchases, you must use a test account. By default, the only test account registered is the one that's associated with your developer account. You can register additional test accounts by using the Google Play Console.

1. Navigate to Settings > Account details.
2. In the License Testing section, add your tester's email addresses to Gmail accounts with testing access field.
3. Save your changes.

{% hint style="info" %}
Testers can begin making purchases of your in-app products within 15 minutes.
{% endhint %}

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

With the validator configured and connected to the Google Play Developer API, the plugin, via Iaptic, can now retrieve accurate subscription details during the validation process.
## Code Implementation

This section describes the minimal code required to implement an auto-renewing subscription product on Android using the Google Play platform.

### Base framework

First, let's set up the basic HTML structure and the initial JavaScript to load the plugin.


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
```javascript
document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

  if (!window.CdvPurchase) {
      console.log('CdvPurchase is not available');
      return;
  }
  const {store} = CdvPurchase;

  store.error(function(error) {
      console.log('ERROR ' + error.code + ': ' + error.message);
  });

  store.ready(function() {
    console.log("CdvPurchase is ready");
  });
 
  initializeStore();
  refreshUI();
}

function initializeStore() {
  // We will implement this soon
}

function refreshUI() {
  // Soon...
}
```
{% endcode %}

Here's a little explanation:

**Line 1**, it's important to wait for the "deviceready" event before using cordova plugins.

**Lines 5-8**, we check if the plugin was correctly loaded.

**Lines 11-13**, we setup an error handler. It just logs errors to the console.

> Whatever your setup is, you should make sure this runs as soon as the javascript application starts. You have to be ready to handle IAP events as soon as possible.

### Initialization & Presentation

Now, we'll initialize the plugin, register our subscription products, and set up the UI to display their status and purchase options. This involves:
*   Registering products with type `PAID_SUBSCRIPTION`.
*   Setting up a receipt validator connected to the Google Play Developer API (required for reliable subscription handling on Android - see Step 9 in the setup).
*   Displaying product details (title, description, price, billing period, trial info).
*   Displaying the current subscription status (subscribed, expired, in grace period) based on verified receipt data.
*   Showing a "Subscribe" button only when the product `canPurchase`.

### Initialization & UI Setup (Subscriptions)

This section guides you through setting up the initial HTML and JavaScript required to initialize the purchase plugin, register your subscription products, configure a validator (essential for subscriptions), and display product information and subscription status before handling the actual purchase flow.

**Step 1: Basic HTML Structure**

*   **What:** Set up `www/index.html` with placeholders for subscription status, the list of available subscription products, error messages, and management buttons.
*   **Why:** Provides the necessary structure to display dynamic information about subscriptions to the user.

```markup
<!-- www/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://validator.iaptic.com 'unsafe-eval' 'unsafe-inline' gap:; style-src 'self' 'unsafe-inline'; media-src *">
  <!-- IMPORTANT: Replace https://validator.iaptic.com with YOUR actual validator host -->
</head>
<body style="margin-top: 50px">
  <div class="app">
    <h1>Subscription Service</h1>
    <p id="subscription-status">Subscription Status: Loading...</p>
    <hr/>
    <h2>Available Plans</h2>
    <div id="subscription-products">
      <p>Loading subscription plans...</p>
    </div>
    <hr/>
    <div id="management-buttons">
      <!-- Buttons like Restore, Manage will go here -->
    </div>
    <!-- Placeholder for error messages -->
    <div id="error-display" style="color: red; margin-top: 10px;"></div>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
</html>
```

*   **Important:** Update the `Content-Security-Policy` meta tag to allow connections to your receipt validation server. Replace `https://validator.iaptic.com` if you use a different service or host your own. Add `'unsafe-inline'` if using `onclick`.

**Step 2: Initial JavaScript Framework**

*   **What:** Create `www/js/index.js` with the basic structure, waiting for `deviceready`.
*   **Why:** Ensures the plugin is loaded before we attempt to use it.

```javascript
// www/js/index.js

// Wait for Cordova to be ready
document.addEventListener('deviceready', initializeStore);

// Basic state holder (optional, but helps manage UI updates)
let appState = {
  products: [], // Will hold loaded CdvPurchase.Product objects
  activeSubscription: null, // Will hold the active CdvPurchase.VerifiedPurchase object
  status: 'Loading...',
  error: '',
};

// Helper function to update state and trigger UI refresh
function setState(update) {
  Object.assign(appState, update);
  renderUI(); // We'll define renderUI soon
}

function initializeStore() {
    console.log('Device is ready, initializing store for subscriptions...');

    if (!window.CdvPurchase || !window.CdvPurchase.store) {
        console.error('Store plugin not available');
        setState({ error: 'Store plugin failed to load.', status: 'Setup Error' });
        return;
    }

    const { store, ProductType, Platform, LogLevel } = CdvPurchase;
    console.log('Store plugin version: ' + store.version);

    // Optional: Set log level for debugging
    store.verbosity = LogLevel.DEBUG;

    // --- We will add subsequent steps here ---
    // 1. Register Products
    // 2. Configure Validator (Essential for Subscriptions)
    // 3. Setup Error Handling
    // 4. Setup Event Listeners
    // 5. Initialize the Store
}

// --- UI Rendering Function ---
function renderUI() {
    console.log('Rendering UI with current state:', appState);
    // (Implementation in Step 6)
}

// --- Action Functions (stubs for now) ---
// window.subscribe = function(productId, platform, offerId) { ... };
// window.restoreSubs = function() { ... };
```

**Step 3: Register Subscription Products**

*   **What:** Tell the plugin about your subscription products using `store.register()`. Specify `ProductType.PAID_SUBSCRIPTION`.
*   **Why:** The plugin needs to know which products to manage and fetch details for. Use the optional `group` property if you have different subscription tiers (e.g., 'bronze', 'gold') to enable platform-managed upgrades/downgrades where supported.

Add this inside `initializeStore`:

```javascript
// Inside initializeStore()

// 1. Register Products
console.log('Registering subscription products...');
// Replace with your actual product IDs and platforms
store.register([{
    id: 'subscription1', // e.g., 'myapp.monthly.premium'
    type: ProductType.PAID_SUBSCRIPTION,
    platform: store.defaultPlatform(), // Or specific platform like Platform.GOOGLE_PLAY
    group: 'premium' // Optional: Group subscriptions for upgrade/downgrade paths
}, {
    id: 'subscription2', // e.g., 'myapp.yearly.premium'
    type: ProductType.PAID_SUBSCRIPTION,
    platform: store.defaultPlatform(),
    group: 'premium' // Same group as the monthly one
}]);
```

**Step 4: Configure the Validator (Crucial for Subscriptions)**

*   **What:** Set the `store.validator` property to your receipt validation service URL or function.
*   **Why:** Subscriptions require server-side validation to accurately track expiry dates, renewal status, cancellations, grace periods, etc. Local device receipts are often insufficient or unreliable for this. **Do not skip this step for subscriptions.**

Add this inside `initializeStore`:

```javascript
// Inside initializeStore()

// 2. Configure Validator (Essential for Subscriptions)
console.log('Configuring validator...');
// Replace with your actual validation URL (e.g., from Iaptic or your own server)
store.validator = "https://validator.iaptic.com/v1/validate?appName=YOUR_APP&apiKey=YOUR_KEY";
if (store.validator.includes("YOUR_APP")) {
  const msg = "VALIDATOR NOT CONFIGURED. Replace YOUR_APP and YOUR_KEY in js/index.js.";
  console.warn(msg);
  setState({ error: msg, status: 'Setup Error' });
  // Consider preventing further actions if validator isn't set up
  // return;
}
```

**Step 5: Setup Error Handling**

*   **What:** Use `store.error()` to catch general plugin errors.
*   **Why:** Provides essential feedback for debugging and user information.

Add this inside `initializeStore`:

```javascript
// Inside initializeStore()

// 3. Setup Error Handling
console.log('Setting up error handler...');
store.error(function(error) {
    console.error('STORE ERROR ' + error.code + ': ' + error.message);
    setState({ error: `Error: ${error.message} (Code: ${error.code})` });
    // Optionally clear the error after a delay
    setTimeout(() => { if (appState.error === `Error: ${error.message} (Code: ${error.code})`) setState({ error: '' }); }, 10000);
});
```

**Step 6: Implement UI Rendering (`renderUI`)**

*   **What:** Create the `renderUI` function. It should display the overall subscription status (derived from verified purchases) and the details of each available subscription product, including a "Subscribe" button if appropriate.
*   **Why:** Shows the user their current status and available options.

Replace the placeholder `renderUI` function with this:

```javascript
// In js/index.js

function renderUI() {
    console.log('Rendering UI with current state:', appState);
    const { store, ProductType, Platform, RecurrenceMode, PaymentMode, Utils } = CdvPurchase; // Import necessary types/enums

    const statusEl = document.getElementById('subscription-status');
    const productsEl = document.getElementById('subscription-products');
    const errorEl = document.getElementById('error-display');
    const managementEl = document.getElementById('management-buttons');

    if (!statusEl || !productsEl || !errorEl || !managementEl) {
        console.error("Required UI elements not found!");
        return;
    }

    // Display Error
    errorEl.textContent = appState.error || '';

    // Determine Active Subscription Status from *verified* receipts
    // This requires a validator. Without it, this logic needs adjustment.
    const activeSub = store.verifiedPurchases.find(p => {
        const product = store.get(p.id, p.platform);
        // Check if it's a subscription type AND not expired
        return product?.type === ProductType.PAID_SUBSCRIPTION && !p.isExpired;
    });
    appState.activeSubscription = activeSub; // Store for potential reuse

    let statusMessage = 'Not Subscribed';
    if (activeSub) {
        const expiry = activeSub.expiryDate ? new Date(activeSub.expiryDate).toLocaleDateString() : 'N/A';
        const productName = store.get(activeSub.id, activeSub.platform)?.title ?? activeSub.id;
        statusMessage = `Subscribed to ${productName} (Expires: ${expiry})`;
        if (activeSub.renewalIntent === 'Lapse') statusMessage += ' - Will Not Renew';
        if (activeSub.isTrialPeriod) statusMessage += ' (Trial)';
        if (activeSub.isBillingRetryPeriod) statusMessage += ' (Billing Issue!)';
    } else {
        // Check for the latest expired subscription to inform the user
        const latestExpired = store.verifiedPurchases
            .filter(p => store.get(p.id, p.platform)?.type === ProductType.PAID_SUBSCRIPTION && p.isExpired)
            .sort((a, b) => (b.expiryDate ?? 0) - (a.expiryDate ?? 0))[0]; // Get the most recently expired
        if (latestExpired) {
            const expiry = latestExpired.expiryDate ? new Date(latestExpired.expiryDate).toLocaleDateString() : 'N/A';
            statusMessage = `Subscription expired on ${expiry}. Please resubscribe.`;
        }
    }
    statusEl.textContent = `Subscription Status: ${statusMessage}`;

    // Render Subscription Products
    productsEl.innerHTML = store.products
        .filter(p => p.type === ProductType.PAID_SUBSCRIPTION) // Show only subscriptions
        .map(product => {
            let productHtml = `<div><h4>${product.title || product.id}</h4>`;
            if (product.description) productHtml += `<p>${product.description}</p>`;

            if (product.offers && product.offers.length > 0) {
                product.offers.forEach(offer => {
                    productHtml += `<div style="margin-left: 10px; border-left: 2px solid #ccc; padding-left: 10px;">`;
                    const priceDetails = offer.pricingPhases.map(phase => {
                        let phaseDesc = `${phase.price}`;
                        if (phase.billingPeriod) {
                           phaseDesc += ` / ${Utils.formatDurationEN(phase.billingPeriod, { omitOne: true })}`;
                        }
                        if (phase.paymentMode === PaymentMode.FREE_TRIAL) {
                            phaseDesc = `Free Trial for ${Utils.formatDurationEN(phase.billingPeriod)}`;
                        } else if (phase.paymentMode === PaymentMode.PAY_AS_YOU_GO && phase.recurrenceMode === RecurrenceMode.FINITE_RECURRING) {
                            phaseDesc += ` (for ${phase.billingCycles} cycles)`;
                        } else if (phase.paymentMode === PaymentMode.UP_FRONT && phase.billingPeriod) {
                             phaseDesc = `${phase.price} for ${Utils.formatDurationEN(phase.billingPeriod)}`;
                        }
                        return phaseDesc;
                    }).join(' then ');

                    productHtml += `<p><strong>Offer:</strong> ${priceDetails}</p>`;

                    // Button logic:
                    // Show "Subscribe" only if:
                    // 1. There's no active subscription at all OR
                    // 2. There IS an active subscription, BUT it's NOT for this product AND they are in the same group (upgrade/downgrade)
                    // 3. The offer can actually be purchased
                    const isCurrentActiveSub = activeSub && activeSub.id === product.id && activeSub.platform === product.platform;
                    const canUpgradeDowngrade = activeSub && !isCurrentActiveSub && product.group && store.get(activeSub.id, activeSub.platform)?.group === product.group;

                    if ((!activeSub || canUpgradeDowngrade) && offer.canPurchase) {
                        const buttonLabel = canUpgradeDowngrade ? 'Switch Plan' : 'Subscribe';
                        productHtml += `<button onclick="window.subscribe('${product.id}', '${product.platform}', '${offer.id}')">${buttonLabel}</button>`;
                    } else if (isCurrentActiveSub) {
                        productHtml += '<p><em>(Currently Active)</em></p>';
                    } else {
                        productHtml += '<p><em>(Cannot purchase)</em></p>';
                    }
                    productHtml += `</div>`; // Close offer div
                });
            } else {
                productHtml += '<p>Pricing information not available.</p>';
            }
            productHtml += `</div>`; // Close product div
            return productHtml;
        }).join('<hr/>');

    // Render Management Buttons
    managementEl.innerHTML = ''; // Clear previous
    const currentPlatform = activeSub?.platform ?? store.defaultPlatform();
    if (store.checkSupport(currentPlatform, 'manageSubscriptions')) {
        managementEl.innerHTML += `<button onclick="CdvPurchase.store.manageSubscriptions('${currentPlatform}')">Manage Subscription</button> `;
    }
    if (store.checkSupport(currentPlatform, 'manageBilling')) {
        managementEl.innerHTML += `<button onclick="CdvPurchase.store.manageBilling('${currentPlatform}')">Manage Billing</button> `;
    }
    if (store.checkSupport(currentPlatform, 'restorePurchases')) {
         managementEl.innerHTML += `<button onclick="window.restoreSubs()">Restore Purchases</button>`;
    }
}
```

**Step 7: Setup Event Listeners**

*   **What:** Listen for product and receipt updates using `store.when()`.
*   **Why:** To keep the UI synchronized with the latest data fetched from the stores and the validator.

Add this inside `initializeStore`:

```javascript
// Inside initializeStore()

// 4. Setup Event Listeners
console.log('Setting up event listeners...');
store.when()
    .productUpdated(product => {
        console.log("Product updated: " + product.id);
        // Find and update the product in our local state (appState.products)
        const index = appState.products.findIndex(p => p.id === product.id && p.platform === product.platform);
        if (index >= 0) appState.products[index] = product;
        else appState.products.push(product);
        renderUI(); // Refresh the whole UI
    })
    .receiptUpdated(() => {
        console.log("Receipt updated (local)");
        // Re-render to potentially update purchase/owned status based on local data
        renderUI();
    })
    .verified(() => {
        console.log("Receipt verified");
        // Re-render to update purchase/owned status based on verified data
        renderUI();
    });
    // We will add .approved() and .finished() handlers in the platform-specific
    // purchase flow sections.
```

**Step 8: Initialize the Store**

*   **What:** Call `store.initialize()` to start the plugin.
*   **Why:** Activates the registered platforms and begins loading product/purchase data.

Add this at the *end* of `initializeStore`:

```javascript
// Inside initializeStore()

// 5. Initialize the Store
console.log('Initializing store plugin...');
store.initialize([store.defaultPlatform()]) // Add other platforms if needed
    .then(() => {
        console.log("Store initialized successfully.");
        // Initial UI render after initialization attempt
        renderUI();
    })
    .catch(err => {
        console.error("Store initialization failed", err);
        setState({ error: 'Failed to initialize store.', status: 'Error' });
    });
```

**Step 9: Prepare Action Function Stubs**

*   **What:** Define the global functions (`window.subscribe`, `window.restoreSubs`) that the UI buttons will call.
*   **Why:** Provides the necessary functions for the `onclick` handlers. The actual logic will be implemented in the platform-specific purchase flow guides.

```javascript
// In js/index.js (add these function definitions)

// Make functions globally accessible for button onclick handlers
window.subscribe = function(productId, platform, offerId) {
    console.log(`Subscribe button clicked for ${productId} on ${platform}, offer ${offerId}`);
    const { store } = CdvPurchase;
    const offer = store.get(productId, platform)?.getOffer(offerId);

    if (offer) {
        console.log(`Attempting to order offer: ${offer.id}`);
        alert('Subscription purchase logic (store.order) goes here!');
        // --- Placeholder for the next step ---
        // store.order(offer, { applicationUsername: 'user123' }) // Example
        // .then(result => { ... });
        // -------------------------------------
    } else {
        console.error(`Cannot subscribe: Product (${productId}) or Offer (${offerId}) not found or not loaded yet.`);
        alert('Unable to subscribe. Product details might still be loading.');
    }
}

window.restoreSubs = function() {
    console.log('Restore button clicked');
    const { store } = CdvPurchase;
    console.log('Initiating restore purchases...');
    setState({ status: 'Restoring purchases...' }); // Update UI
    store.restorePurchases().then((result) => {
        console.log('Restore attempt finished.');
        if (result && result.isError) {
             console.error("Restore failed: " + result.message);
             alert("Failed to restore purchases: " + result.message);
             setState({ error: result.message });
        } else {
             console.log("Restore successful (check receiptUpdated/verified events for updates)");
             alert("Restore attempt complete. Your subscriptions should update shortly.");
        }
        renderUI(); // Refresh UI after attempt
    });
}
```

---

This sets up the generic part for handling subscriptions. The UI will now display product information and subscription status based on *verified* data (once available). The next steps involve implementing the purchase flow (`store.order` call within `window.subscribe`, and the `.approved()`, `.verified()`, `.finished()` handlers) specific to either the App Store or Google Play.
*Note: The reliability of fields like `expiryDate` and `owned` status heavily depends on using a receipt validator connected to the Google Play Developer API.*

### Purchase Flow

Finally, we handle the purchase events for subscriptions. This requires verification and acknowledging the purchase.
*   Initiate the order when the "Subscribe" button is clicked. Consider handling upgrades/downgrades using `additionalData` if products are in the same `group` or by specifying `oldPurchaseToken`.
*   Verify the transaction with the receipt validator upon approval using `transaction.verify()`.
*   Acknowledge the purchase by calling `receipt.finish()` (or `transaction.finish()`) once verified. This is crucial to prevent automatic refunds and ensures proper subscription state management by Google Play.


### Testing

To test on Android with In-App Purchases enabled, I always chose to run my app through Android Studio. This way, I can see the logs from both the javascript and native sides, which is useful.

To create a build, first update the Android project on the console, run

```text
cordova prepare android
```

Run.

![](.gitbook/assets/subscribe-init.png)

### Purchase Flow

We already added a "Buy" button. This button calls the `store.order()` method which initiates the purchase flow for a product.

At this point, the code starts the process but the purchase will remain "processing" forever, in the `approved` state.

For a product in the `approved` state, the transaction has been approved by the user's banking institurion but it won't be finalized until you inform them to do so. You have to deliver whatever the user purchased before finalizing.

I already introduced the purchase flow in the introduction of this guide, you can check the [purchase process](../discover/about-the-plugin.md#purchase-process) section if you need a refresher. The official documentation provides even more details. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#-purchasing) 

When the user is done with the native interface (i.e. has entered his/her password and confirmed\), your app receives the `approved` event. So let's add more handlers to the `onDeviceReady()` function, before the call to `store.refresh()`.

```javascript
store.when()
     .approved(p => p.verify())
     .verified(p => p.finish())
     .owned(p => console.log(`you now own ${p.alias}`));
```

That's enough for a local implementation (where we don't need to inform a server of changes to the subscription status). Let's try the whole thing now. Repeat the steps from the [testing](#testing) section above:

```text
cordova prepare android
```

Run from Android Studio and here you go! You should be able to purchase your subscriptions.

Full source for this tutorial below:

{% code-tabs %}
{% code-tabs-item title="js/index.js" %}
```javascript
document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

    const state = {};
    function setState(attr) {
        Object.assign(state, attr);
        render(state);
    }

    setState({
        error: '',
        status: 'Loading...',
        product1: {},
        product2: {},
    });

    // We should first register all our products or we cannot use them in the app.
    store.register([{
        id:    'my_subscription1',
        type:   CdvPurchase.ProductType.PAID_SUBSCRIPTION,
    }, {
        id:    'my_subscription2',
        type:   CdvPurchase.ProductType.PAID_SUBSCRIPTION,
    }]);

    // Setup the receipt validator service.
    store.validator = '<<< YOUR_RECEIPT_VALIDATION_URL >>>';

    // Show errors for 10 seconds.
    store.error(function(error) {
        setState({ error: `ERROR ${error.code}: ${error.message}` });
        setTimeout(function() {
            setState({ error: `` });
        }, 10000);
    });

    store.when()
        .approved(p => p.verify())
        .verified(p => p.finish())
        .owned(p => console.log(`you now own ${p.alias}`));

    // Called when any subscription product is updated
    store.when('subscription').updated(function() {
        const product1 = store.get('my_subscription1') || {};
        const product2 = store.get('my_subscription2') || {};

        let status = 'Please subscribe below';
        if (product1.owned || product2.owned)
            status = 'Subscribed';
        else if (product1.state === 'approved' || product2.state === 'approved')
            status = 'Processing...';

        setState({ product1, product2, status });
    });

    // Load informations about products and purchases
    store.refresh();

    function render() {

        const purchaseProduct1 = state.product1.canPurchase
            ? `<button onclick="store.order('my_subscription1')">Subscribe</button>` : '';
        const purchaseProduct2 = state.product2.canPurchase
            ? `<button onclick="store.order('my_subscription2')">Subscribe</button>` : '';

        const body = document.getElementsByTagName('body')[0];
        body.innerHTML = `
<pre> 
${state.error}

subscription: ${state.status}

id:     ${state.product1.id          || ''}
title:  ${state.product1.title       || ''}
state:  ${state.product1.state       || ''}
descr:  ${state.product1.description || ''}
price:  ${state.product1.price       || ''}
expiry: ${state.product1.expiryDate  || ''}
</pre>
${purchaseProduct1}
<pre>

id:     ${state.product2.id          || ''}
title:  ${state.product2.title       || ''}
descr:  ${state.product2.description || ''}
price:  ${state.product2.price       || ''}
state:  ${state.product2.state       || ''}
expiry: ${state.product2.expiryDate  || ''}
</pre>
${purchaseProduct2}
        `;
    }
}
```
{% endcode-tabs-item %}

{% code-tabs-item title="index.html" %}
```markup
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://reeceipt-validator.fovea.cc 'unsafe-eval' 'unsafe-inline' gap:; style-src 'self' 'unsafe-inline'; media-src *">
</head>
<body style="margin-top: 50px">
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
</html>
```
{% endcode-tabs-item %}
{% endcode-tabs %}

