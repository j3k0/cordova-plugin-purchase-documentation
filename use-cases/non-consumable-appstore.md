# Non-Consumable on AppStore (iOS & macOS)

This use case explains how to implement a **non-consumable** product (like unlocking a premium feature or removing ads permanently) on iOS and macOS using the App Store platform and `cordova-plugin-purchase` v13+.

## 1. Platform Setup

First, ensure your Apple Developer account, App Store Connect, and Xcode project are correctly configured for In-App Purchases.

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


Needless to say, make sure you have the tools installed on your machine. During the writing of this guide, I've been using the following environment:

* **NodeJS** v10.12.0
* **Cordova** v8.1.2
* **macOS** 10.14.1

I'm not saying it won't work with different version. If you start fresh, it might be a good idea to use an up-to-date environment.


### 2. Create or Prepare Cordova Project

Set up your Cordova project and add the iOS platform.

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
#### Add iOS platform

```text
$ cordova platform add ios
```

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


First, I assume you have an Apple developer account. If not time to register, because it's mandatory.

Let's now head to the [AppStore Connect](https://appstoreconnect.apple.com) website. In order to start developing and testing In-App Purchases, you need all contracts in place as well as your financial information setup. Make sure there are no warning left there.

I'll not guide you through the whole procedure, just create setup your Apple application as usual.

#### Retrieve the Shared Secret

Since you are here, let's retrieve the Shared Secret. You can use an App-Specific one or a Master Shared Secret, at your convenience: both will work. Keep the value around, it'll be required, especially if you are implementing subscriptions.

![](../.gitbook/assets/appstore-shared-secret.png)



*(Review included content for consistency, especially regarding Shared Secret retrieval)*

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


### 5. Create In-App Products in App Store Connect

Define the specific items (consumables, non-consumables, subscriptions) you want to sell.

### 5. Create In-App Products

If you followed the [Setup AppStore Application](#3-setup-appstore-application) section, you should have everything setup. Head again to the App's In-App Purchases page: select your application, then _Features_, then _In-App Purchases_.

From there you can create your In-App Products. Select the appropriate type, fill in all required metadata and select _cleared for sale_.

{% hint style="warning" %}
Even if that sounds stupid, you need to fill-in ALL metadata in order to use the In-App Product in development, even the screenshot for reviewers. Make sure you have at least one localization in place too.
{% endhint %}

The process is well explained by Apple, so I'll not enter into more details.

*   **Product IDs:** Note down the exact Product IDs you create; you'll need them for `store.register()`.
*   **Cleared for Sale:** Ensure products are marked "Cleared for Sale".
*   **Metadata:** Fill in all required metadata, including pricing, localization, and review information (even a placeholder screenshot is often needed for testing).

### 6. Create Sandbox Test Users

Create special Apple IDs for testing purchases without real money.

### 6. Create Test Users

In order to test your In-App Purchases during development, you should create some test users.

You can do so from the AppStore Connect website, in the _Users & Access_ section. There in the sidebar, you should see "Sandbox > Testers". If you don't, it means you don't have enough permissions to create sandbox testers, so ask your administrator.

From there, it's just a matter of hitting "+" and filling the form. While you're at it, create 2-3 test users: it will be handy for testing.

![](../.gitbook/assets/appstore-test-users.png)

*   **Important:** Use these accounts *only* when prompted by your app during a purchase flow on a test device/build. Do not sign into the main App Store settings with them.

### 7. (Recommended) Setup Receipt Validation Service

For secure and reliable purchase handling, especially for subscriptions and non-consumables, set up server-side validation.

### 7. (Recommended) Setup Receipt Validation Service

For subscriptions (and non-consumables), **server-side receipt validation is essential** for security and reliable status tracking. Do not rely solely on the device's local data.

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
    *   [Iaptic](https://www.iaptic.com/) is a service designed specifically for validating receipts from Cordova/Capacitor apps, handling complexities across platforms.
    *   Sign up and get your API Key and App Name.
    *   Configure the plugin using the `Iaptic` helper class:

        ```javascript
        const { store } = CdvPurchase;
        const iaptic = new CdvPurchase.Iaptic({
          appName: 'YOUR_IAPTIC_APP_NAME',
          apiKey: 'YOUR_IAPTIC_API_KEY'
        });
        store.validator = iaptic.validator;

        // For introductory/promotional offer eligibility:
        store.initialize([{
          platform: CdvPurchase.Platform.APPLE_APPSTORE,
          options: {
            discountEligibilityDeterminer: iaptic.appStoreDiscountEligibilityDeterminer,
            // needAppReceipt: true // Required if using eligibility determiner
          }
        }]);
        ```
    *   You will also need the **App-Specific Shared Secret** from App Store Connect for Iaptic to validate iOS receipts. Enter this secret in your Iaptic application settings.

First, I assume you have an Apple developer account. If not time to register, because it's mandatory.

Let's now head to the [AppStore Connect](https://appstoreconnect.apple.com) website. In order to start developing and testing In-App Purchases, you need all contracts in place as well as your financial information setup. Make sure there are no warning left there.

I'll not guide you through the whole procedure, just create setup your Apple application as usual.

#### Retrieve the Shared Secret

Since you are here, let's retrieve the Shared Secret. You can use an App-Specific one or a Master Shared Secret, at your convenience: both will work. Keep the value around, it'll be required, especially if you are implementing subscriptions.

![](../.gitbook/assets/appstore-shared-secret.png)




2.  **Build Your Own Server:**
    *   Requires significant backend development.
    *   You'll need to call Apple's `verifyReceipt` endpoint: [Apple Verify Receipt Docs](https://developer.apple.com/documentation/appstorereceipts/verifyreceipt).
    *   Handle sandbox vs. production endpoints.
    *   Store and manage subscription status, expiry dates, and renewal events.
    *   Implement secure communication between your app and your server.
    *   Set `store.validator` to your server's endpoint URL.
    *   You will need the **App-Specific Shared Secret** for your server logic.

**Choosing not to validate receipts server-side will lead to unreliable subscription status, inability to handle renewals/cancellations correctly, and significant security vulnerabilities.***   **Remember:** You'll need the **App-Specific Shared Secret** obtained in Step 3 for your validation server.

---

After completing these steps, your Apple Developer account, App Store Connect record, and Xcode project should be configured to support In-App Purchases using `cordova-plugin-purchase`. You can now proceed to implement the purchase logic in your application code as shown in the specific [Use Cases](..).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your non-consumable product, and display its information based on ownership status.

This section covers the initial setup and UI display for a **non-consumable** product (like unlocking a premium feature or removing ads) using the `cordova-plugin-purchase` plugin (v13+). It focuses on registering the product and displaying its information based on ownership status, deferring the actual purchase logic to platform-specific guides.

**Assumptions:**

*   You have completed the [basic JavaScript setup](code-initial-javascript.md).
*   You have created a non-consumable product in your target platform's developer console.

**Step 1: Implement `initializeStoreAndSetupListeners`**

Replace the placeholder `initializeStoreAndSetupListeners` function with the following code. This registers your non-consumable product, sets up essential event listeners for UI updates, configures the (highly recommended) validator, and initializes the store.

{% code title="www/js/index.js (initializeStoreAndSetupListeners)" lineNumbers="true" %}
```javascript
// This function should be called by onDeviceReady after basic setup
function initializeStoreAndSetupListeners() {
  console.log('Setting up store for Non-Consumables...');
  setStatus('Initializing Store for Non-Consumables...');

  const { store, ProductType, Platform, LogLevel } = CdvPurchase;

  // --- Product Definition ---
  // Define the non-consumable product ID you configured in the App/Play Store.
  const MY_NON_CONSUMABLE_ID = 'unlock_premium_feature'; // Replace with your actual ID
  // Key used to store ownership status (use SecureStorage in production!)
  const FEATURE_KEY = 'isPremiumFeatureUnlocked';

  // --- Register Product ---
  store.register({
    id: MY_NON_CONSUMABLE_ID,
    type: ProductType.NON_CONSUMABLE,
    platform: store.defaultPlatform() // Or specify Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE
  });

  // --- Setup Receipt Validator (Highly Recommended) ---
  // Essential for security and restoring purchases reliably.
  // store.validator = "https://your-validator.com/validate";
  // store.validator = new CdvPurchase.Iaptic({...}).validator;

  // --- Setup Event Listeners ---
  store.when()
    .productUpdated(product => {
      console.log('Product updated: ' + product.id);
      if (product.id === MY_NON_CONSUMABLE_ID) {
        // myProductReference = product; // Store if needed globally
      }
      refreshUI(); // Update the UI with product details & ownership status
    })
    .receiptUpdated(receipt => {
      // Local receipt changes might affect 'owned' status if no validator is used.
      // Refresh UI to reflect potential changes.
      console.log('Local receipt updated.');
      refreshUI();
    })
    .verified(receipt => {
      // Verified receipt is the source of truth for ownership.
      console.log('Receipt verified.');
      refreshUI(); // Refresh UI based on verified data
    })
    // Purchase flow listeners (.approved, .finished, .cancelled)
    // will be added in the platform-specific purchase flow sections.
    ; // End of store.when() chain

  // --- Initialize the Store ---
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

// Function to check if the feature is unlocked (reads from storage)
function isFeatureUnlocked() {
  // WARNING: localStorage is INSECURE. Use SecureStorage plugin or server check.
  try {
    return window.localStorage.getItem(FEATURE_KEY) === 'YES';
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return false;
  }
}

// This function updates the UI based on product data and ownership status
function refreshUI() {
  console.log('Refreshing UI...');
  const { store, Platform } = CdvPurchase;

  const product = store.get(MY_NON_CONSUMABLE_ID);
  const productEl = document.getElementById('product-details');
  const statusEl = document.getElementById('user-status'); // Target the status display area

  // Determine ownership status
  // Use store.owned() which checks verified receipts first, then local if no validator.
  // Fallback to insecure localStorage check if store isn't ready or owned is false.
  const owned = store.owned(MY_NON_CONSUMABLE_ID) || isFeatureUnlocked();

  if (statusEl) {
    statusEl.innerHTML = `<b>Premium Feature: ${owned ? 'Unlocked! 🎉' : 'Locked'}</b>`;
    // In a real app, you would show/hide UI elements based on 'owned' status.
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
    const offer = product.getOffer();
    if (offer) {
      productHtml += `<p>Price: ${offer.pricing?.price ?? 'N/A'}</p>`;
      // Show buy button only if the product is not already owned and can be purchased
      if (!owned && offer.canPurchase) {
        // The purchaseFeature function will be implemented in platform-specific guides
        productHtml += `<button id="buy-button" onclick="purchaseFeature()">Unlock Now!</button>`;
      } else if (owned) {
        productHtml += `<p><em>(Already Purchased)</em></p>`;
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
// This will be implemented in the platform-specific guides (non-consumable-*.md)
window.purchaseFeature = function() {
  console.log('Placeholder: purchaseFeature() called.');
  alert('Purchase logic needs to be implemented for the specific platform.');
};

// --- Placeholder for Granting Entitlement ---
// This will be implemented in the platform-specific guides
function grantEntitlement(productId) {
  if (productId === MY_NON_CONSUMABLE_ID) {
    console.log(`Placeholder: Granting entitlement for ${productId}.`);
    // Persist ownership securely!
    try {
      window.localStorage.setItem(FEATURE_KEY, 'YES'); // INSECURE EXAMPLE
      console.log('Ownership flag set in localStorage.');
    } catch (e) {
      console.error('Error saving ownership to localStorage:', e);
    }
    refreshUI(); // Update UI immediately
  }
}

// Initial UI update on device ready
document.addEventListener('deviceready', () => {
  // Ensure the initial call to initializeStoreAndSetupListeners happens
  if (typeof initializeStoreAndSetupListeners === 'function') {
     // Already called by onDeviceReady in the initial script
  } else {
     initializeStoreAndSetupListeners = initializeStore;
     initializeStoreAndSetupListeners();
  }
  // Initial render based on potentially stored state
  refreshUI();
}, false);

// Ensure setStatus is defined
if (typeof setStatus !== 'function') {
  setStatus = (message) => console.log('[Status] ' + message);
}

```
{% endcode %}

**Explanation:**

1.  **Product Definition (Lines 9-11):** Define the `id` of your non-consumable product and a key (`FEATURE_KEY`) to track its ownership status locally.
2.  **Register Product (Lines 14-18):** Call `store.register()` with the `id`, `type` set to `ProductType.NON_CONSUMABLE`, and the correct `platform`.
3.  **Validator Setup (Lines 21-24):** Configure `store.validator`. This is **highly recommended** for non-consumables to securely verify purchases and enable reliable restoration across devices.
4.  **Event Listeners (Lines 27-44):**
    *   `productUpdated`: Refreshes the UI when product details load.
    *   `receiptUpdated`: Refreshes the UI when local receipt data changes (might affect `owned` status if no validator is used).
    *   `verified`: Refreshes the UI when a receipt is validated (this provides the most reliable ownership status).
    *   Purchase flow listeners (`approved`, `finished`, etc.) are deferred.
5.  **Initialize Store (Lines 47-56):** Call `store.initialize()` to activate the platform.
6.  **UI Rendering (Lines 60-106):**
    *   The `refreshUI` function now focuses on displaying the product and the *ownership status* of the feature.
    *   It uses `store.owned(MY_NON_CONSUMABLE_ID)` as the primary way to check ownership. This method intelligently uses verified receipt data if available (and a validator is configured), falling back to less reliable local data otherwise.
    *   It includes a fallback check to `isFeatureUnlocked()` (which reads from `localStorage` in this example) to handle cases where the store might not be fully ready or if validation isn't used. **Warning:** `localStorage` is insecure; use the [SecureStorage-adapter](https://github.com/mibrito707/cordova-plugin-securestorage-adapter) plugin or a server backend for production.
    *   The "Buy" button is only shown if the feature is *not* owned (`!owned`) and the offer `canPurchase`. If owned, it displays "(Already Purchased)".
7.  **Placeholders (Lines 109-125):** Empty functions `purchaseFeature` and `grantEntitlement` are defined for later implementation in platform-specific guides. `grantEntitlement` includes an *insecure* example of setting the `localStorage` flag.
8.  **Initial Load (Lines 128-138):** Ensures initialization runs and the UI reflects any previously stored ownership status on startup.

This setup prepares your app to display the non-consumable product and its current ownership state. The next steps involve implementing the platform-specific purchase flow (Android or iOS) to handle buying the product and securely granting/persisting the entitlement.
*   **Note:** Replace the placeholder product ID (`'unlock_premium_feature'`) and the storage key (`FEATURE_KEY`) in the code with your actual values. Crucially, replace the insecure `localStorage` example in `grantEntitlement` and `isFeatureUnlocked` with a secure storage mechanism (like `cordova-plugin-securestorage-adapter`) or server-side state management.

## 3. Purchase Flow

Implement the logic to handle the purchase process. This involves initiating the order and handling the `approved`, `verified` (highly recommended), and `finished` events to grant the entitlement permanently and acknowledge the purchase with the App Store using `transaction.finish()`.

### Purchase Flow (iOS/App Store Non-Consumable)

This section details the purchase logic specific to **iOS/App Store** for **non-consumable** items (like unlocking a feature permanently), assuming you have completed the [generic non-consumable initialization](non-consumable-generic-initialization.md). Similar to Android, the purchase must be finalized using `transaction.finish()` to remove it from the payment queue.

**Step 1: Implement the Purchase Action (`purchaseFeature`)**

*   **What:** Replace the placeholder `window.purchaseFeature` function (from the generic initialization) to call `offer.order()` specifically for the App Store platform.
*   **Why:** This triggers the App Store purchase dialog when the user clicks the "Unlock Now!" button.

Replace the placeholder `window.purchaseFeature` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.purchaseFeature = function() {
    const productId = 'unlock_premium_feature'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for non-consumable: ${productId}`);
    const { store, Platform } = CdvPurchase;

    // Get the product specifically for AppStore
    const product = store.get(productId, Platform.APPLE_APPSTORE);
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for non-consumable offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating purchase...');

        offer.order()
            .then(result => {
                // Promise resolves when the App Store sheet is dismissed.
                // Outcome is handled by listeners.
                if (result && result.isError) {
                    setStatus(`Order failed: ${result.message}`);
                } else {
                    // Purchase flow started... status updated by listeners.
                }
                refreshUI(); // Refresh UI in case button state needs update
            })
            .catch(err => {
                 console.error("Unexpected error during non-consumable order:", err);
                 setStatus('Unexpected error during purchase.');
                 refreshUI();
            });

    } else {
        console.error(`Cannot purchase feature: Product (${productId}) or offer not found.`);
        setStatus('Error: Unable to purchase. Product details missing.');
    }
}
```

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function (created during generic initialization).
*   **Why:** These listeners handle the progression of the purchase: approval by App Store, optional but recommended verification, and mandatory finalization.

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is highly recommended for non-consumables.
        if (store.validator) {
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting entitlement and finishing purchase without server verification (INSECURE).");
             // Grant entitlement and finish directly if no validator.
             unlockFeatureAndFinish(transaction);
        }
    })
    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        setStatus('Purchase verified. Finishing...');

        // Find the relevant transaction within the verified receipt
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === MY_NON_CONSUMABLE_ID); // Use your product ID

        if (verifiedTransaction) {
            // Grant entitlement (if not already done based on verified data)
            // and FINISH the transaction
            unlockFeatureAndFinish(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected non-consumable transaction?");
            // Finish anyway to clear the queue if possible
            receipt.finish();
        }
    })
    .finished(transaction => {
        // This confirms the finish() call was successful.
        console.log(`Transaction ${transaction.transactionId} finished for ${transaction.products[0]?.id}.`);
        setStatus('Purchase complete! Feature unlocked.');
        // Feature should already be unlocked. Refresh UI to be sure.
        refreshUI();
    })
    .cancelled(transaction => {
        console.log('Purchase Cancelled:', transaction.transactionId);
        setStatus('Purchase cancelled.');
        refreshUI();
    });
    // Ensure the .productUpdated, .receiptUpdated listeners from the generic setup are still present
```

**Step 3: Implement Feature Unlock and Finish Logic (`unlockFeatureAndFinish`)**

*   **What:** Replace the placeholder `grantEntitlement` function with `unlockFeatureAndFinish`. This function updates your app's state (e.g., `localStorage` - **use secure storage in production!**) to unlock the feature and then calls `transaction.finish()`.
*   **Why:** You **must** call `transaction.finish()` for non-consumable purchases on iOS to remove them from the payment queue. This acknowledges to the App Store that you have processed the transaction.

Replace the placeholder `grantEntitlement` function in `www/js/index.js` with this:

```javascript
// In js/index.js

// Replace the placeholder grantEntitlement function
function unlockFeatureAndFinish(transaction) {
    const productId = transaction.products[0]?.id;
    if (productId !== MY_NON_CONSUMABLE_ID) return; // Ensure it's the correct product

    // Grant the entitlement if not already granted
    // Check your persistent storage method here
    const isUnlocked = isFeatureUnlocked(); // Assumes function from generic init exists

    if (isUnlocked) {
        console.log(`Feature already unlocked, finishing transaction ${transaction.transactionId} again just in case.`);
    } else {
        console.log(`Unlocking feature for transaction ${transaction.transactionId}...`);
        // Persist the unlock status SECURELY
        try {
            window.localStorage.setItem(FEATURE_KEY, 'YES'); // INSECURE EXAMPLE - Use SecureStorage
            console.log('Ownership flag set in localStorage.');
        } catch (e) {
            console.error('Error saving ownership to localStorage:', e);
        }
        // Refresh the UI immediately to show the unlocked state
        refreshUI();
        // Optionally show a confirmation message
        // alert('Feature Unlocked! Thank you.');
    }

    // Finish the transaction!
    // This acknowledges the purchase with the App Store and removes it from the queue.
    // Required for non-consumables and subscriptions on iOS.
    if (transaction.state !== TransactionState.FINISHED) {
        console.log(`Finishing transaction ${transaction.transactionId}...`);
        transaction.finish();
    } else {
        console.log(`Transaction ${transaction.transactionId} already finished.`);
    }
}
```

---

**Build and Test (iOS/App Store Non-Consumable)**

Follow the standard iOS testing procedure:

1.  **Prepare:** `cordova prepare ios`.
2.  **Open:** `open platforms/ios/*.xcodeproj` (or `.xcworkspace`).
3.  **Configure Xcode:** Set signing team, select your physical test device. Ensure "In-App Purchase" capability is enabled.
4.  **Prepare Sandbox Tester:** On your test device, go to `Settings -> App Store`, scroll down, and **Sign Out** of any production Apple ID. Do **not** sign into the Sandbox account here.
5.  **Run:** Build and run the app from Xcode (▶) onto your device.
6.  **Test Purchase:**
    *   Verify initial UI shows the feature as "Locked" and the product details with the "Unlock Now!" button.
    *   Tap "Unlock Now!".
    *   The App Store purchase sheet appears. **Sign in** using your **Sandbox Tester** credentials when prompted.
    *   Confirm the purchase (it will indicate "[Environment: Sandbox]").
    *   Observe Xcode console logs: `approved`, `verified` (if validator set), `Unlocking feature...`, `Finishing transaction...`, `finished`.
    *   The UI should update to show "Premium Feature: Unlocked! 🎉".
    *   The "Unlock Now!" button should be replaced with "(Already Purchased)".
    *   **Restart the app:** Verify the unlocked status persists and the purchase button remains disabled.
    *   **Restore Purchases:** Add a "Restore Purchases" button that calls `store.restorePurchases()`. Test that after restoring, the UI correctly reflects the owned status.

---

This completes the non-consumable purchase flow for iOS/App Store. The key is calling `transaction.finish()` after granting the entitlement to acknowledge the purchase with Apple.
## 4. Receipt Validation (Highly Recommended)

Server-side validation is crucial for non-consumables to securely verify ownership and enable reliable purchase restoration across devices.

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

Follow the specific testing procedures for iOS/macOS Sandbox environments outlined in the platform-specific purchase flow section above, including testing the "Restore Purchases" functionality.
