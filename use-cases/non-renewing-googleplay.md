# Non-Renewing Subscription with Google Play



# Non-Renewing Subscription on Android

This guide demonstrates how to implement a **non-renewing subscription** product using the Google Play platform for Android applications.

On Google Play, non-renewing subscriptions are technically treated as **one-time products** (similar to consumables or non-consumables) that grant entitlement for a fixed duration. Unlike auto-renewing subscriptions, Google Play **does not automatically manage renewals or cancellations** for these products.

Key characteristics on Google Play:

*   Purchased as a one-time product.
*   Your application is responsible for determining the access duration based on the product purchased (e.g., a "1 Month Access" product grants 1 month of entitlement).
*   Your application must track the expiry date based on the purchase time.
*   Purchases must be **acknowledged** within 3 days using `transaction.finish()` to prevent automatic refunds by Google.
*   They **should not be consumed**, as consuming them would remove the entitlement.
*   Users can typically purchase the product again (e.g., buy another month) once access expires, or potentially before expiry to extend access, depending on your app's logic.

In this guide, we will build a simple application that allows users to purchase a non-renewing subscription granting access for a specific period.
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


## Code Implementation

This section describes the minimal code required to implement a non-renewing subscription product (granting access for a fixed period, like 1 month or 1 year) on Android using the Google Play platform.

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

Now, we'll initialize the plugin, register our non-renewing subscription product, and set up the UI to display its status and purchase options. This involves:
*   Registering the product with type `NON_RENEWING_SUBSCRIPTION`.
*   Displaying product details (title, description, price, duration).
*   Displaying the current access expiry date if the subscription is active.
*   Showing a "Subscribe" or "Extend" button. Google Play treats these similarly to consumables, so they can typically be purchased again once expired (or potentially even before to extend).

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
*Note: Adapt the UI logic in `subscription-generic-initialization.md`. Instead of just "Subscribed", show "Access until [Expiry Date]". The `product.owned` status for non-renewing subscriptions might depend on local data or validator logic correctly interpreting the expiry.*

### Purchase Flow

Handling the purchase flow for non-renewing subscriptions on Google Play is similar to consumables or non-consumables in that they need to be **acknowledged**. They grant access for a fixed duration defined by the product.
*   Initiate the order when the "Subscribe/Extend" button is clicked.
*   Handle the `approved` state. Verification is optional but recommended.
*   **Acknowledge** the purchase by calling `transaction.finish()`. This prevents Google Play from automatically refunding after 3 days. **Do not consume** non-renewing subscriptions.
*   Your application logic should track the expiry date based on the purchase time and product duration to manage access.

### Purchase Flow (Android Non-Renewing)

Handling the purchase flow for non-renewing subscriptions on Google Play requires acknowledging the purchase to Google, similar to non-consumables. Your application logic is responsible for managing the entitlement period.

1.  **Initiate Order:**
    When the user clicks the "Subscribe" or "Extend" button, call `store.order()` on the relevant offer.

    ```javascript
    function purchaseNonRenewingSubscription() {
        const offer = store.get('my_non_renewing_sub_id', Platform.GOOGLE_PLAY)?.getOffer();
        if (offer) {
            store.order(offer)
                .then(result => {
                    if (result && result.isError) {
                        // Handle error (e.g., payment cancelled)
                        console.error("Order failed: " + result.message);
                    } else {
                        // Optional: Update UI to show processing state if needed
                        console.log("Order successful, waiting for approval/verification.");
                    }
                });
        } else {
            console.error("Offer not found for non-renewing subscription.");
        }
    }
    ```

2.  **Handle Approval & Verification (Optional but Recommended):**
    Set up listeners for the `approved` and `verified` states. Verification adds a layer of security.

    ```javascript
    // In your store initialization (e.g., inside onDeviceReady or initStore)
    store.when()
        .approved(transaction => {
            // Optional: Verify the transaction
            // If you have a validator, verification provides extra security
            // and potentially fetches accurate purchase/expiry times if needed.
            if (store.validator) {
                transaction.verify();
            } else {
                // No validator, proceed directly to finish/acknowledge
                acknowledgePurchase(transaction);
            }
        })
        .verified(receipt => {
            // Acknowledgment is done after verification succeeds
            const transaction = receipt.transactions[0]; // Assuming one transaction per receipt here
            if (transaction) {
                acknowledgePurchase(transaction);
            }
        });
    ```

3.  **Acknowledge (Finish) the Purchase:**
    This is the crucial step for non-renewing subscriptions (and non-consumables) on Google Play. Call `transaction.finish()` to acknowledge the purchase. **Do not consume it.**

    ```javascript
    function acknowledgePurchase(transaction) {
        // Grant entitlement based on the product purchased
        // e.g., Calculate expiry date: now + product duration
        const productDurationMonths = 1; // Example: get this from product definition
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + productDurationMonths);

        // Store the expiry date persistently
        window.localStorage.setItem('nonRenewingExpiry', expiryDate.toISOString());
        console.log(`Access granted until: ${expiryDate.toISOString()}`);

        // Acknowledge the purchase with Google Play
        transaction.finish();

        // Refresh UI to show the new expiry date
        refreshUI(); // Make sure your refreshUI function reads the expiry date
    }
    ```

4.  **Manage Entitlement:**
    Your application must check the stored expiry date whenever the user tries to access the protected content or service.

    ```javascript
    function hasActiveNonRenewingAccess() {
        const expiryString = window.localStorage.getItem('nonRenewingExpiry');
        if (!expiryString) return false;
        const expiryDate = new Date(expiryString);
        return expiryDate > new Date();
    }

    // Example usage:
    if (hasActiveNonRenewingAccess()) {
        // Show premium content
    } else {
        // Show purchase options
    }
    ```

**Key Points:**

*   **Acknowledge, Don't Consume:** Use `transaction.finish()` to acknowledge. Consuming would remove the entitlement.
*   **Track Expiry:** Your app must calculate and track the expiry date based on the purchase time and the duration defined for the product ID.
*   **Persistence:** Store the expiry date reliably (e.g., `localStorage`, secure storage, synced backend).
