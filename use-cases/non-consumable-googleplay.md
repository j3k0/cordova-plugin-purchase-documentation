# Non-Consumable Product with Google Play



# Non Consumable on Android

In this guide, we will build a small application with a non-consumable product that works on Android.


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

Next, we initialize the plugin, register our non-consumable product, and set up the UI. This involves:
*   Registering the product with type `NON_CONSUMABLE`.
*   Displaying product details (title, description, price).
*   Showing a "Buy" or "Unlock" button only when the product `canPurchase`.
*   Checking the `product.owned` status to reflect whether the feature is unlocked in the UI.

### Initialization & UI Setup (Non-Consumable)

This section guides you through setting up the initial HTML and JavaScript required to initialize the purchase plugin, register your non-consumable product, and display its information to the user before they attempt a purchase.

**Step 1: Basic HTML Structure**

*   **What:** We need a place in our HTML to display the status of the feature (locked/unlocked) and the details of the in-app product used to unlock it.
*   **Why:** This provides visual feedback to the user about the product and their current access level.

Replace the `<body>` of your `www/index.html` with this minimal structure:

```markup
<!-- www/index.html -->
<body>
  <div class="app">
    <h1>My App Feature</h1>
    <p id="feature-status">Feature Status: Loading...</p>
    <hr/>
    <div id="nonconsumable1-purchase">
      <h2>Unlock Feature</h2>
      <p>Loading purchase details...</p>
    </div>
    <hr/>
    <!-- Placeholder for error messages -->
    <div id="error-display" style="color: red; margin-top: 10px;"></div>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
```

*   Remember to adjust your `Content-Security-Policy` meta tag in `index.html` if you plan to use a remote validator or load external resources. Add `'unsafe-inline'` if you use `onclick` attributes directly.

**Step 2: Initial JavaScript Framework**

*   **What:** Create `www/js/index.js` and set up the essential event listener for `deviceready`.
*   **Why:** Cordova plugins are only guaranteed to be available *after* the `deviceready` event fires. All plugin interactions must happen after this point.

```javascript
// www/js/index.js

// Wait for Cordova to be ready
document.addEventListener('deviceready', initializeStore);
document.addEventListener('deviceready', refreshFeatureUI); // Refresh UI once device is ready

// Key for storing unlock status (using localStorage for simplicity)
const FEATURE_KEY = 'myFeatureUnlocked';

function initializeStore() {
    console.log('Device is ready, initializing store...');

    // Check if the CdvPurchase plugin is available
    if (!window.CdvPurchase || !window.CdvPurchase.store) {
        console.error('Store plugin not available');
        document.getElementById('feature-status').textContent = 'Error: Store plugin failed to load.';
        return;
    }

    const { store, ProductType, Platform, LogLevel } = CdvPurchase;
    console.log('Store plugin version: ' + store.version);

    // Optional: Set log level for debugging
    store.verbosity = LogLevel.DEBUG; // Use DEBUG for development, ERROR or QUIET for production

    // --- Steps below will be added incrementally ---

    // 1. Register Products
    // 2. Setup Error Handling
    // 3. Setup Event Listeners
    // 4. Initialize the Store

}

// --- UI Refresh Functions ---
// We will implement these functions in the next steps

function refreshFeatureUI() {
    console.log('Refreshing feature UI based on stored status...');
    // (Implementation in Step 6)
}

function refreshProductUI(product) {
    console.log('Refreshing product UI for: ' + (product ? product.id : 'N/A'));
    // (Implementation in Step 7)
}

// --- Purchase Action ---
// We will define this function later, it will be called by the buy button.
// window.purchaseFeature = function() { ... };
```

**Step 3: Register Your Product**

*   **What:** Tell the plugin about your non-consumable product using `store.register()`.
*   **Why:** The plugin needs to know the `id`, `type`, and `platform` of the products you want to manage so it can fetch their details (like price and title) from the respective app store.

Add the following inside the `initializeStore` function (where indicated by the comment):

```javascript
// Inside initializeStore()

// 1. Register Products
console.log('Registering products...');
// Replace 'nonconsumable1' with your actual product ID for the platform.
// Use store.defaultPlatform() for convenience if supporting only one platform initially.
store.register({
    id: 'nonconsumable1', // <<< YOUR PRODUCT ID HERE
    type: ProductType.NON_CONSUMABLE,
    platform: store.defaultPlatform(), // Or Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE
});
```

**Step 4: Setup Error Handling**

*   **What:** Use `store.error()` to register a listener for any errors the plugin might encounter.
*   **Why:** This helps in debugging and allows you to inform the user if something goes wrong (e.g., network issues, configuration problems).

Add the error handler inside `initializeStore`:

```javascript
// Inside initializeStore()

// 2. Setup Error Handling
console.log('Setting up error handler...');
store.error(function(error) {
    console.error('STORE ERROR ' + error.code + ': ' + error.message);
    const errorEl = document.getElementById('error-display');
    if (errorEl) {
        errorEl.textContent = `Error: ${error.message}`;
        // Clear the error after some time
        setTimeout(() => { if (errorEl.textContent === `Error: ${error.message}`) errorEl.textContent = ''; }, 10000);
    }
});
```

**Step 5: Setup Event Listeners**

*   **What:** Use `store.when()` to listen for specific events, particularly `productUpdated` (when product details like price are loaded) and `receiptUpdated` (when purchase information changes).
*   **Why:** The plugin operates asynchronously. These listeners allow your UI to react when product data is available or when the user's purchase/ownership status changes.

Add the event listeners inside `initializeStore`:

```javascript
// Inside initializeStore()

// 3. Setup Event Listeners
console.log('Setting up event listeners...');
store.when()
    // Called when product data is loaded or updated.
    .productUpdated(product => {
        console.log('Product updated: ' + product.id);
        refreshProductUI(product); // Update the specific product's UI
    })
    // Called when purchase information changes
    .receiptUpdated(receipt => {
        console.log('Receipt updated');
        refreshFeatureUI(); // Re-check feature status based on purchases
    });
    // We will add .approved(), .verified(), .finished() handlers later in the purchase flow section.
```

**Step 6: Initialize the Store**

*   **What:** Call `store.initialize()` to activate the plugin and start communication with the app stores.
*   **Why:** This is the final step to make the plugin operational. It loads product details and existing purchases.

Add the initialization call at the end of `initializeStore`:

```javascript
// Inside initializeStore()

// 4. Initialize the Store
console.log('Initializing store...');
store.initialize([store.defaultPlatform()]) // Initialize only the default platform for this example
    .then(() => {
        console.log("Store initialized successfully");
        // Now that the store is initialized, try to refresh the UI
        // with any products that might have been loaded synchronously (unlikely but safe)
        const product = store.get('nonconsumable1'); // Use your product ID
        if (product) refreshProductUI(product);
        refreshFeatureUI(); // Ensure feature status is checked after init
    })
    .catch(err => {
        console.error("Store initialization failed", err);
        setState({ error: 'Failed to initialize store.', status: 'Error' });
    });
```

**Step 7: Implement UI Updates - Feature Status**

*   **What:** Fill in the `refreshFeatureUI` function to check your application's way of storing the "unlocked" status (here, `localStorage`) and update the corresponding HTML element.
*   **Why:** To show the user whether they have already purchased and unlocked the feature.

Replace the placeholder `refreshFeatureUI` function with this:

```javascript
// In js/index.js

function refreshFeatureUI() {
    console.log('Refreshing feature UI...');
    // Check localStorage (or your preferred storage) for unlock status
    const isUnlocked = window.localStorage.getItem(FEATURE_KEY) === 'YES';
    const statusEl = document.getElementById('feature-status');
    if (statusEl) {
        statusEl.textContent = 'Feature Status: ' + (isUnlocked ? 'UNLOCKED! 🎉' : 'Locked');
        console.log('Feature is ' + (isUnlocked ? 'Unlocked' : 'Locked'));
    } else {
        console.warn('feature-status element not found');
    }

    // It's also good practice to refresh the product UI in case ownership changed `canPurchase`
    const product = CdvPurchase.store.get('nonconsumable1'); // Use your product ID
    if (product) refreshProductUI(product);
}
```

**Step 8: Implement UI Updates - Product Details & Button**

*   **What:** Fill in the `refreshProductUI` function. It receives a `Product` object when the `productUpdated` event fires. Use its properties (`title`, `description`, `pricing`, `canPurchase`) to populate the product details section and decide whether to show the purchase button.
*   **Why:** To display accurate information fetched from the app store and provide a purchase option only when appropriate (product loaded, feature not already unlocked).

Replace the placeholder `refreshProductUI` function with this:

```javascript
// In js/index.js

function refreshProductUI(product) {
    console.log('Refreshing product UI for: ' + (product ? product.id : 'null product'));
    const isUnlocked = window.localStorage.getItem(FEATURE_KEY) === 'YES';
    const el = document.getElementById('nonconsumable1-purchase'); // Use the ID from your HTML
    if (!el) {
        console.warn('nonconsumable1-purchase element not found');
        return;
    }

    let infoHtml = '';
    let buttonHtml = '';

    if (product && product.title && product.pricing) { // Check if essential data is loaded
        console.log(`Product ${product.id} loaded: Title=${product.title}, Price=${product.pricing.price}`);
        infoHtml = `
            <p>
              ${product.description}<br/>
              <strong>Price: ${product.pricing.price}</strong>
            </p>`;

        if (isUnlocked) {
            buttonHtml = '<p><em>Feature already unlocked!</em></p>';
        } else if (product.canPurchase) {
            console.log(`Product ${product.id} can be purchased.`);
            // Ensure purchaseFeature function exists globally or is accessible
            // We'll define window.purchaseFeature in the next step.
            buttonHtml = '<button onclick="window.purchaseFeature()">Unlock Now!</button>';
        } else {
            console.log(`Product ${product.id} cannot be purchased (State: ${product.state}, Owned: ${product.owned}).`);
            // Might be owned based on local receipt, or in a non-purchasable state
            buttonHtml = '<p><em>(Cannot purchase at this time)</em></p>';
        }
    } else if (product) {
        // Product object exists but data isn't fully loaded yet
        infoHtml = `<p>Loading details for ${product.id}...</p>`;
        console.log(`Product ${product.id} exists but details not fully loaded yet.`);
    } else {
        // Product wasn't found after initialization
        infoHtml = '<p>Unlock feature not available.</p>';
        console.log('Product nonconsumable1 not found in store.');
    }

    // Update the content of the specific product's div
    el.innerHTML = `<h2>${product?.title ?? 'Unlock Feature'}</h2>${infoHtml}${buttonHtml}`;
}
```

**Step 9: Prepare the Purchase Function Stub**

*   **What:** Define the global function `window.purchaseFeature` that the "Unlock Now!" button calls. For now, it will just log a message.
*   **Why:** The button needs a function to call. Making it global (`window.purchaseFeature`) is a simple way to ensure it's accessible from the `onclick` attribute generated in the previous step. The actual purchase logic (`store.order()`) will be added later in the platform-specific guides.

```javascript
// In js/index.js (add this function definition)

// Make this function globally accessible for the button's onclick
window.purchaseFeature = function() {
    const productId = 'nonconsumable1'; // Use your product ID
    console.log(`Purchase button clicked for ${productId}`);
    const { store } = CdvPurchase;
    const product = store.get(productId);
    const offer = product?.getOffer(); // Get the default offer for the product

    if (offer) {
        console.log(`Attempting to order offer: ${offer.id} for product ${productId}`);
        alert('Purchase logic to be added in platform-specific guide (iOS/Android).');

        // --- Placeholder for the next step ---
        // The actual store.order() call will go here in the next section
        // store.order(offer).then(...);
        // -------------------------------------

    } else {
        console.error(`Cannot purchase feature: Product (${productId}) or its offer not found or not loaded yet.`);
        alert('Unable to purchase. Product details might still be loading.');
    }
}
```

---

Now you have the generic initialization and UI presentation logic set up. The application will:
1.  Wait for the device.
2.  Initialize the store plugin.
3.  Register your non-consumable product.
4.  Attempt to load product details from the store.
5.  Display the feature's locked/unlocked status based on `localStorage`.
6.  Display the product details and a purchase button (if applicable and not already unlocked).
7.  Prepare a function to be called when the button is pressed.

The next step is to add the platform-specific purchase handling (iOS or Android) which involves adding `.approved()`, `.verified()`, `.finished()` listeners and implementing the `store.order()` call within `window.purchaseFeature`.
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