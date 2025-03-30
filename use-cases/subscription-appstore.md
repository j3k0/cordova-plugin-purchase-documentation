# Subscription on AppStore (iOS & macOS)

This use case explains how to implement an **auto-renewing subscription** on iOS and macOS using the App Store platform and `cordova-plugin-purchase` v13+. Reliable subscription management **requires server-side receipt validation**.

## 1. Platform Setup

First, ensure your Apple Developer account, App Store Connect (including creating subscription products and groups), and Xcode project are correctly configured.

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

Next, set up the basic JavaScript to initialize the plugin, register your subscription products (including `group` if applicable), configure the **mandatory validator**, and display subscription status based on **verified** receipt data.

This section guides you through setting up the initial HTML and JavaScript required to initialize the purchase plugin for **subscriptions**, register your subscription products, configure a validator (essential for subscriptions), and display product information and subscription status. The actual purchase flow logic is deferred to platform-specific guides.

**Assumptions:**

*   You have completed the [basic JavaScript setup](code-initial-javascript.md).
*   You have created subscription products (and potentially subscription groups) in your target platform's developer console.

**Step 1: Update HTML Structure**

Ensure your `www/index.html` includes placeholders for subscription status, product details, and management buttons.

```html
<!-- www/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://your-validator.com 'unsafe-eval' 'unsafe-inline' gap:; style-src 'self' 'unsafe-inline'; media-src *">
  <!-- IMPORTANT: Replace https://your-validator.com with YOUR actual validator host -->
  <title>Subscription Demo</title>
  <style> /* Basic styles */ </style>
</head>
<body style="margin-top: 20px; padding: 10px;">
  <div class="app">
    <h1>Subscription Service</h1>
    <!-- Status messages -->
    <div id="messages" style="font-style: italic; color: #555; margin-bottom: 10px;">Loading...</div>
    <hr/>
    <!-- Subscription Status -->
    <div id="user-status"><b>Subscription Status:</b> Loading...</div>
    <hr/>
    <h2>Available Plans</h2>
    <!-- Product List -->
    <div id="product-details">
      <p>Loading subscription plans...</p>
    </div>
    <hr/>
    <!-- Management Buttons -->
    <div id="management-buttons"></div>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
</html>
```
*   **Explanation:** We use `#user-status` for the overall subscription status, `#product-details` for the list of plans, and `#management-buttons` for actions like "Restore" or "Manage". Update the `Content-Security-Policy` to allow connections to your validator.

**Step 2: Implement `initializeStoreAndSetupListeners` for Subscriptions**

Replace the placeholder `initializeStoreAndSetupListeners` function with the following code. This version registers subscription products, **mandates validator setup**, listens for relevant events, and initializes the store.

{% code title="www/js/index.js (initializeStoreAndSetupListeners)" lineNumbers="true" %}
```javascript
// This function should be called by onDeviceReady after basic setup
function initializeStoreAndSetupListeners() {
  console.log('Setting up store for Subscriptions...');
  setStatus('Initializing Store for Subscriptions...');

  const { store, ProductType, Platform, LogLevel, Utils } = CdvPurchase;

  // --- Product Definitions ---
  // Define your subscription product IDs and groups.
  // Replace these with your actual IDs configured in the App/Play Store.
  const MY_MONTHLY_SUB_ID = 'subscription_monthly';
  const MY_YEARLY_SUB_ID = 'subscription_yearly';
  const MY_SUBSCRIPTION_GROUP = 'premium_access'; // Group allows upgrades/downgrades

  // --- Register Products ---
  store.register([{
    id: MY_MONTHLY_SUB_ID,
    type: ProductType.PAID_SUBSCRIPTION,
    platform: store.defaultPlatform(),
    group: MY_SUBSCRIPTION_GROUP
  }, {
    id: MY_YEARLY_SUB_ID,
    type: ProductType.PAID_SUBSCRIPTION,
    platform: store.defaultPlatform(),
    group: MY_SUBSCRIPTION_GROUP
  }]);

  // --- Setup Receipt Validator (MANDATORY for Subscriptions) ---
  // Subscriptions REQUIRE server-side validation for reliable status tracking.
  // Replace with your actual validator URL or function.
  store.validator = "https://your-validator.com/validate"; // Example URL
  // store.validator = new CdvPurchase.Iaptic({...}).validator; // Example using Iaptic helper
  if (!store.validator || store.validator.includes("your-validator.com")) {
    const msg = "VALIDATOR NOT CONFIGURED. Subscriptions require server-side validation.";
    console.error(msg);
    setStatus('ERROR: ' + msg);
    // It's strongly recommended to halt or clearly warn the user if the validator isn't set up.
    // return;
  }

  // --- Setup Event Listeners ---
  store.when()
    .productUpdated(product => {
      // Update UI when product details like price change.
      console.log('Product updated: ' + product.id);
      refreshUI();
    })
    .receiptUpdated(receipt => {
      // Local receipt changes. Refresh UI, but rely on 'verified' for definitive status.
      console.log('Local receipt updated.');
      refreshUI();
    })
    .verified(receipt => {
      // Receipt validated with the server. This is the source of truth for subscription status.
      console.log('Receipt verified.');
      refreshUI(); // Refresh UI based on the latest verified data
    })
    // Purchase flow listeners (.approved, .finished, .cancelled)
    // will be added in the platform-specific purchase flow sections.
    ; // End of store.when() chain

  // --- Initialize the Store ---
  // Initialize the platform(s) for your subscriptions.
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

// This function updates the UI based on product data and verified subscription status
function refreshUI() {
  console.log('Refreshing Subscription UI...');
  const { store, ProductType, Platform, RecurrenceMode, PaymentMode, Utils, RenewalIntent } = CdvPurchase;

  const statusEl = document.getElementById('user-status'); // Target subscription status display
  const productsEl = document.getElementById('product-details'); // Target product list display
  const managementEl = document.getElementById('management-buttons'); // Target management buttons area

  if (!statusEl || !productsEl || !managementEl) {
    console.error("Required UI elements not found!");
    return;
  }

  // --- Determine Active Subscription Status ---
  // Find the latest, active, verified subscription purchase.
  const activeSub = store.verifiedPurchases
    .filter(p => store.get(p.id)?.type === ProductType.PAID_SUBSCRIPTION && !p.isExpired)
    .sort((a, b) => (b.purchaseDate ?? 0) - (a.purchaseDate ?? 0))[0]; // Get the most recent active one

  let statusMessage = 'Subscription: Inactive';
  if (activeSub) {
    const expiry = activeSub.expiryDate ? new Date(activeSub.expiryDate).toLocaleDateString() : 'N/A';
    const productName = store.get(activeSub.id, activeSub.platform)?.title ?? activeSub.id;
    statusMessage = `Subscription: ACTIVE (${productName})`;
    statusMessage += ` - Expires: ${expiry}`;
    if (activeSub.renewalIntent === RenewalIntent.LAPSE) statusMessage += ' <span style="color:orange;">[Will Not Renew]</span>';
    if (activeSub.isTrialPeriod) statusMessage += ' (Trial)';
    if (activeSub.isBillingRetryPeriod) statusMessage += ' <span style="color:red;">[Billing Issue!]</span>';
    // Unlock premium features based on activeSub
  } else {
    // Lock premium features
    // Optionally check for expired subs to show a message
    const latestExpired = store.verifiedPurchases
        .filter(p => store.get(p.id)?.type === ProductType.PAID_SUBSCRIPTION && p.isExpired)
        .sort((a, b) => (b.expiryDate ?? 0) - (a.expiryDate ?? 0))[0];
    if (latestExpired) {
        const expiry = latestExpired.expiryDate ? new Date(latestExpired.expiryDate).toLocaleDateString() : 'N/A';
        statusMessage = `Subscription: Expired on ${expiry}. Please resubscribe.`;
    }
  }
  statusEl.innerHTML = statusMessage; // Use innerHTML for potential styling

  // --- Render Subscription Products/Offers ---
  productsEl.innerHTML = store.products
    .filter(p => p.type === ProductType.PAID_SUBSCRIPTION) // Show only subscriptions
    .map(product => {
      let productHtml = `<div><h4>${product.title || product.id}</h4>`;
      if (product.description) productHtml += `<p>${product.description}</p>`;

      if (product.offers && product.offers.length > 0) {
        product.offers.forEach(offer => {
          productHtml += `<div style="margin-left: 10px; border-left: 2px solid #ccc; padding-left: 10px;">`;
          // Format pricing phases
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

          // --- Button Logic ---
          const isCurrentActiveSub = activeSub && activeSub.id === product.id && activeSub.platform === product.platform;
          const canUpgradeDowngrade = activeSub && !isCurrentActiveSub && product.group && store.get(activeSub.id, activeSub.platform)?.group === product.group;

          if (isCurrentActiveSub) {
            productHtml += '<p><em>(Currently Active)</em></p>';
          } else if ((!activeSub || canUpgradeDowngrade) && offer.canPurchase) {
            const buttonLabel = canUpgradeDowngrade ? 'Switch Plan' : 'Subscribe';
            // The 'subscribe' function will be implemented in platform-specific guides
            productHtml += `<button onclick="subscribe('${product.id}', '${product.platform}', '${offer.id}')">${buttonLabel}</button>`;
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

  // --- Render Management Buttons ---
  managementEl.innerHTML = ''; // Clear previous
  const currentPlatform = activeSub?.platform ?? store.defaultPlatform();
  if (store.checkSupport(currentPlatform, 'manageSubscriptions')) {
    managementEl.innerHTML += `<button onclick="CdvPurchase.store.manageSubscriptions('${currentPlatform}')">Manage Subscription</button> `;
  }
  if (store.checkSupport(currentPlatform, 'manageBilling')) {
    managementEl.innerHTML += `<button onclick="CdvPurchase.store.manageBilling('${currentPlatform}')">Manage Billing</button> `;
  }
  // Restore button might be useful even without an active sub
  if (store.checkSupport(currentPlatform, 'restorePurchases')) {
       managementEl.innerHTML += `<button onclick="restoreSubscriptions()">Restore Purchases</button>`;
  }
}

// --- Placeholder for Purchase Action ---
// This will be implemented in the platform-specific guides (subscription-*.md)
window.subscribe = function(productId, platform, offerId) {
  console.log(`Placeholder: subscribe(${productId}, ${platform}, ${offerId}) called.`);
  alert('Subscription purchase logic needs to be implemented for the specific platform.');
};

// --- Placeholder for Restore Action ---
// This will be implemented in the platform-specific guides
window.restoreSubscriptions = function() {
  console.log('Placeholder: restoreSubscriptions() called.');
  setStatus('Restoring purchases...');
  CdvPurchase.store.restorePurchases().then((result) => {
    setStatus(result ? `Restore failed: ${result.message}` : 'Restore attempt complete.');
    refreshUI();
  });
};

// Initial UI update on device ready
document.addEventListener('deviceready', () => {
  // Ensure the initial call to initializeStoreAndSetupListeners happens
  if (typeof initializeStoreAndSetupListeners === 'function') {
     // Already called by onDeviceReady in the initial script
  } else {
     initializeStoreAndSetupListeners = initializeStore;
     initializeStoreAndSetupListeners();
  }
  // Initial render based on potentially stored state or loading status
  refreshUI();
}, false);

// Ensure setStatus is defined
if (typeof setStatus !== 'function') {
  setStatus = (message) => console.log('[Status] ' + message);
}

// Helper to format ISO durations (ensure this is included, e.g., from initial setup)
if (!CdvPurchase.Utils) CdvPurchase.Utils = {};
if (!CdvPurchase.Utils.formatDurationEN) {
    CdvPurchase.Utils.formatDurationEN = function(iso, options) {
      if (!iso) return '';
      const l = iso.length;
      const n = iso.slice(1, l - 1);
      if (n === '1') {
        return options?.omitOne ?
          ({ 'D': 'day', 'W': 'week', 'M': 'month', 'Y': 'year' }[iso[l - 1]]) || iso[l - 1]
          : ({ 'D': '1 day', 'W': '1 week', 'M': '1 month', 'Y': '1 year' }[iso[l - 1]]) || iso[l - 1];
      } else {
        const u = ({ 'D': 'days', 'W': 'weeks', 'M': 'months', 'Y': 'years' }[iso[l - 1]]) || iso[l - 1];
        return `${n} ${u}`;
      }
    }
}

```
{% endcode %}

**Explanation:**

1.  **Product Definitions (Lines 9-13):** Define IDs for your subscription products and optionally assign them to a `group` for handling upgrades/downgrades.
2.  **Register Products (Lines 16-27):** Call `store.register()` with the `id`, `type` set to `ProductType.PAID_SUBSCRIPTION`, the `platform`, and the `group`.
3.  **Validator Setup (Lines 30-38):** **Crucially**, set `store.validator` to your validation service URL. Subscriptions *require* server-side validation for reliable status tracking (expiry, renewals, cancellations). A warning is logged if it seems unconfigured.
4.  **Event Listeners (Lines 41-58):**
    *   `productUpdated`: Refreshes the UI when product details load.
    *   `receiptUpdated`: Refreshes the UI when local receipt data changes.
    *   `verified`: **This is the most important listener for subscriptions.** It fires after successful validation. The `refreshUI` function should rely on the data within `store.verifiedReceipts` (updated internally after this event) to determine the true subscription status.
    *   Purchase flow listeners (`approved`, `finished`, etc.) are deferred.
5.  **Initialize Store (Lines 61-70):** Call `store.initialize()` to activate the platform.
6.  **UI Rendering (`refreshUI` - Lines 74-151):**
    *   This function is key for displaying subscription status accurately.
    *   It finds the **active subscription** by looking through `store.verifiedPurchases` (populated from validated receipts) for a non-expired, paid subscription.
    *   It displays the status ("ACTIVE", "Inactive", "Expired"), the product name, expiry date, and potential issues like `renewalIntent` (will it lapse?) or `isBillingRetryPeriod`.
    *   It renders the available subscription products/offers, showing pricing details (including formatted billing periods and trial info using `Utils.formatDurationEN`).
    *   The "Subscribe" or "Switch Plan" button logic checks if there's an active subscription, if the current offer is for a different product within the same `group` (allowing upgrade/downgrade), and if the offer `canPurchase`.
    *   It renders "Manage Subscription" and "Manage Billing" buttons using `store.checkSupport()`.
7.  **Placeholders (Lines 154-168):** Empty functions `subscribe` and `restoreSubscriptions` are defined for later implementation.
8.  **Initial Load & Helpers (Lines 171-end):** Ensures initialization runs and includes the `formatDurationEN` helper if not already present.

This setup prepares your app to display subscription products and their status based on **validated receipt data**. The next steps involve implementing the platform-specific purchase flow (`subscribe` function and the `.approved`, `.verified`, `.finished` listeners).
*   **Note:** Replace placeholder product IDs (`'subscription_monthly'`, `'subscription_yearly'`) and the group name (`'premium_access'`) with your actual values. Ensure your `store.validator` URL is correctly configured.

## 3. Purchase Flow

Implement the logic to handle the subscription purchase or plan change process. This involves initiating the order, verifying the transaction via your validator, and acknowledging the purchase with `receipt.finish()`.

### Purchase Flow (iOS/App Store Subscription)

This section details the purchase logic for **auto-renewing subscriptions** on **iOS/App Store**, assuming you have completed the [generic subscription initialization](subscription-generic-initialization.md). Handling subscriptions reliably requires verification and **acknowledgment** via `transaction.finish()`.

**Step 1: Implement the Subscription Purchase Action (`subscribe`)**

*   **What:** Replace the placeholder `window.subscribe` function (from the generic initialization) to call `offer.order()` specifically for the App Store platform.
*   **Why:** This initiates the subscription purchase flow via StoreKit when the user clicks the "Subscribe" or "Switch Plan" button.

Replace the placeholder `window.subscribe` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.subscribe = function(productId, platform, offerId) {
    console.log(`Subscribe button clicked for ${productId}, offer ${offerId} on ${platform}`);
    const { store, Platform, ProductType } = CdvPurchase;

    // Ensure we're acting on the correct platform
    if (platform !== Platform.APPLE_APPSTORE) {
        console.error("This function is currently specific to AppStore!");
        return;
    }

    const product = store.get(productId, Platform.APPLE_APPSTORE);
    const offer = product?.getOffer(offerId); // Get the specific offer

    if (offer) {
        console.log(`Initiating order for offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating subscription...');

        // Optional: Pass applicationUsername for tracking/linking on your server
        // const additionalData = { applicationUsername: 'hashed_user_id_or_uuid' };
        // offer.order(additionalData)

        // Optional: Pass discount details if ordering a promotional offer
        // const discountData = { appStore: { discount: { id: 'promoId', key: '...', nonce: '...', signature: '...', timestamp: '...' } } };
        // offer.order(discountData)

        offer.order()
            .then(result => {
                // Promise resolves when the App Store sheet is dismissed.
                if (result && result.isError) {
                    setStatus(`Subscription failed: ${result.message}`);
                } else {
                    // Purchase flow started... status updated by listeners.
                }
                refreshUI();
            })
            .catch(err => {
                 console.error("Unexpected error during subscription order:", err);
                 setStatus('Unexpected error during subscription.');
                 refreshUI();
            });

    } else {
        console.error(`Cannot subscribe: Product (${productId}) or Offer (${offerId}) not found.`);
        setStatus('Error: Unable to subscribe. Product details missing.');
    }
}
```
*   **Explanation:**
    *   We retrieve the specific `offer` to purchase.
    *   `offer.order()` initiates the flow.
    *   `additionalData` can be used to pass `applicationUsername` or promotional offer `discount` details if needed.

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the subscription purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function.
*   **Why:** These listeners handle the progression: approval by App Store, mandatory verification via your validator, and mandatory acknowledgment via `finish()`.

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is REQUIRED for subscriptions to get accurate status from Apple's servers.
        if (store.validator) {
            transaction.verify(); // Initiate verification
        } else {
             console.error("VALIDATOR REQUIRED: Cannot reliably manage subscriptions without receipt validation.");
             setStatus("ERROR: Validator not configured.");
             // Do NOT finish the transaction here without validation.
        }
    })
    .verified(receipt => {
        console.log(`Receipt verified, contains ${receipt.collection.length} verified purchases.`);
        setStatus('Purchase verified. Finishing...');

        // The verified receipt contains the authoritative status from App Store Server API.
        // The refreshUI() function (called below) should use store.verifiedPurchases or store.owned()
        // to update the UI based on this validated data.

        // Finish (acknowledge) the transaction associated with this receipt with the App Store.
        // This is MANDATORY for subscriptions.
        console.log(`Finishing verified receipt's source transaction: ${receipt.sourceReceipt.transactions[0]?.transactionId}`);
        receipt.finish();
    })
    .finished(transaction => {
        // This confirms the finish() call was successful.
        console.log(`Transaction ${transaction.transactionId} finished for ${transaction.products[0]?.id}.`);
        setStatus('Subscription active!');
        // Subscription state should reflect verified data. Refresh UI to be sure.
        refreshUI();
    })
    .cancelled(transaction => {
        console.log('Purchase Cancelled:', transaction.transactionId);
        setStatus('Purchase cancelled.');
        refreshUI();
    });
    // Ensure the .productUpdated, .receiptUpdated listeners from the generic setup are still present
```
*   **Explanation:**
    *   `.approved()`: Triggers `transaction.verify()`. Validation is essential.
    *   `.verified()`: The receipt is validated. The UI should be updated based on this (`refreshUI()` is called). Crucially, `receipt.finish()` is called to acknowledge the purchase with the App Store.
    *   `.finished()`: Confirms acknowledgment. Update UI.

---

**Build and Test (iOS/App Store Subscription)**

Testing subscriptions follows the standard iOS procedure, paying attention to renewals and management:

1.  **Prepare & Build:**
    *   Save changes.
    *   Run `cordova prepare ios`.
    *   Open the project in Xcode (`open platforms/ios/*.xcworkspace` or `.xcodeproj`).
2.  **Configure & Run in Xcode:**
    *   Set up signing (Team, Certificates).
    *   Select your **physical test device**. Simulators are unreliable for IAP.
    *   **Validator:** Ensure `store.validator` is configured and your server has the correct **App-Specific Shared Secret**. See [Setup Guide - Step 7](sections/setup-subscription-ios-7-validation-server.md).
    *   **Sandbox Tester:** On the device, go to `Settings -> App Store`. Sign out of any production Apple ID. **Do not** sign in to the Sandbox account yet.
    *   Run the app from Xcode (▶).
3.  **Test Subscription Purchase:**
    *   Observe UI and Xcode console logs. Initial status should be "Subscription: Inactive". Product details should load.
    *   Tap the **"Subscribe"** button.
    *   The App Store purchase sheet appears. **Sign in** with your **Sandbox Tester** account when prompted.
    *   Confirm the subscription purchase (it will show "[Environment: Sandbox]").
    *   Observe logs: `approved`, `Verification required...`, `Receipt verified...`, `Finishing...`, `finished`.
    *   The UI (`refreshUI`) should update based on the `verified` event data, showing "Subscription: ACTIVE" with the expiry date from the validator.
4.  **Test Renewals (Sandbox):**
    *   Sandbox subscriptions renew quickly (e.g., a 1-month sub renews every ~5 minutes).
    *   Keep the app running or reopen it after the renewal time.
    *   Observe new `approved` -> `verified` -> `finished` cycles in the logs. The expiry date in the UI should update after verification.
5.  **Test Management:**
    *   Tap the "Manage Subscription" button (rendered by `refreshUI`).
    *   This opens the system's Sandbox subscription management UI. Test changing plans (if you have groups) or cancelling.
    *   After making changes, call `store.update()` or wait for the next renewal cycle; the changes should reflect in the `VerifiedPurchase` data after validation.

---

This completes the subscription purchase flow for iOS/App Store. Accurate status relies heavily on the configured receipt validator. Remember to call `transaction.finish()` after successful verification.

## 4. Receipt Validation (Mandatory)

Server-side validation is **essential** for subscriptions to determine the current status, expiry date, renewal intent, and handle events like renewals, cancellations, and billing issues.

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

Follow the specific testing procedures for iOS/macOS Sandbox environments outlined in the platform-specific purchase flow section above. Pay close attention to testing initial purchases, accelerated renewals, cancellations, and plan changes (if applicable) via the Sandbox subscription management UI.
