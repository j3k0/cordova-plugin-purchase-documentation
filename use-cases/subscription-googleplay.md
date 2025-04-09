# Subscription on Google Play

This use case explains how to implement an **auto-renewing subscription** on Android using the Google Play platform and `cordova-plugin-purchase` v13+. Reliable subscription management **requires server-side receipt validation** connected to the Google Play Developer API.

## 1. Platform Setup

First, ensure your Google Play Console (including creating subscription products), application build, test environment, and **Google Play Developer API access** (for validation) are correctly configured.

&rArr; [Setup instructions here](./sections/setup-googleplay.md).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your subscription products (including `group` if applicable), configure the **mandatory validator**, and display subscription status based on **verified** receipt data obtained via the Google Play Developer API.

This section guides you through setting up the initial HTML and JavaScript required to initialize the purchase plugin for **subscriptions**, register your subscription products, configure a validator (essential for subscriptions), and display product information and subscription status. The actual purchase flow logic is deferred to platform-specific guides.

**Assumptions:**

*   You have completed the [basic Framework setup](code-framework.md).
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
*   **Note:** Replace placeholder product IDs and the group name with your actual values. Update the `store.register` call within the included code to specify `Platform.GOOGLE_PLAY`. Ensure your `store.validator` URL is correctly configured and linked to a backend capable of using the Google Play Developer API.

## 3. Purchase Flow

Implement the logic to handle the subscription purchase or plan change process. This involves initiating the order (potentially with upgrade/downgrade parameters), verifying the transaction via your validator, and **acknowledging** the purchase with `receipt.finish()`.

### Purchase Flow (Android/Google Play Subscription)

This section details the purchase logic for **auto-renewing subscriptions** on **Android using Google Play**. Handling subscriptions reliably requires verification and **acknowledgment** via `transaction.finish()`.

**Step 1: Implement the Subscription Purchase Action (`subscribe`)**

*   **What:** Replace the placeholder `window.subscribe` function (from the generic initialization) to call `offer.order()` specifically for the Google Play platform. Include logic for handling potential subscription upgrades or downgrades using `additionalData`.
*   **Why:** This initiates the subscription purchase or change flow via the Google Play Billing library when the user clicks the "Subscribe" or "Switch Plan" button.

Replace the placeholder `window.subscribe` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.subscribe = function(productId, platform, offerId) {
    console.log(`Subscribe button clicked for ${productId}, offer ${offerId} on ${platform}`);
    const { store, Platform, ProductType, GooglePlay } = CdvPurchase; // Get necessary enums

    // Ensure we're acting on the correct platform
    if (platform !== Platform.GOOGLE_PLAY) {
        console.error("This function is currently specific to Google Play!");
        return;
    }

    const product = store.get(productId, Platform.GOOGLE_PLAY);
    const offer = product?.getOffer(offerId);

    if (offer) {
        console.log(`Initiating order for offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating subscription...');

        // --- Prepare Additional Data for Google Play ---
        // This is crucial for upgrades/downgrades within the same group.
        const additionalData = {
            googlePlay: {
                // Optional: Provide obfuscated user identifiers for fraud prevention
                // accountId: store.getApplicationUsername() ? Utils.md5(store.getApplicationUsername()) : undefined,
                // profileId: '...' // If using multiple profiles per account

                // --- Subscription Update Parameters ---
                // The plugin attempts to find the 'oldPurchaseToken' automatically
                // if the new product is in the same 'group' as an owned one.
                // You can override or provide it manually if needed.
                // oldPurchaseToken: 'EXISTING_PURCHASE_TOKEN_TO_REPLACE',

                // Specify how the subscription change should occur.
                // Default is typically IMMEDIATE_WITH_TIME_PRORATION if oldPurchaseToken is set.
                // replacementMode: GooglePlay.ReplacementMode.DEFERRED, // Example: Change takes effect at next renewal
            }
        };

        // Automatically find old token if applicable (common use case)
        const oldToken = store.findOldPurchaseToken(productId, product?.group);
        if (oldToken && !additionalData.googlePlay.oldPurchaseToken) {
            console.log(`Found existing subscription in group '${product?.group}'. Setting oldPurchaseToken for upgrade/downgrade.`);
            additionalData.googlePlay.oldPurchaseToken = oldToken;
            // You might set a default replacementMode here if desired, e.g.:
            // additionalData.googlePlay.replacementMode = GooglePlay.ReplacementMode.WITH_TIME_PRORATION;
        }

        offer.order(additionalData)
            .then(result => {
                // Promise resolves when the Google Play UI is dismissed.
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

// Helper function (ensure this exists or add it)
CdvPurchase.Store.prototype.findOldPurchaseToken = function(newProductId, group) {
    if (!group) return undefined;
    const potentialOldPurchase = this.verifiedPurchases.find(p => {
        const pProduct = this.get(p.id, p.platform);
        // Find an active, verified subscription in the same group, but not the one being purchased.
        return p.platform === Platform.GOOGLE_PLAY
            && pProduct?.type === ProductType.PAID_SUBSCRIPTION
            && pProduct?.group === group
            && p.id !== newProductId
            && !p.isExpired;
    });
    return potentialOldPurchase?.purchaseId; // purchaseId holds the purchaseToken on Google Play
}
```
*   **Explanation:**
    *   We retrieve the specific `offer` to purchase.
    *   We prepare `additionalData.googlePlay`. The `oldPurchaseToken` is needed when changing subscriptions within the same group. The plugin includes a helper `findOldPurchaseToken` to find the relevant token automatically if products are correctly grouped during registration.
    *   `replacementMode` controls how the subscription change takes effect (immediately with proration, at next renewal, etc.). See [Google Play Replacement Modes](https://developer.android.com/google/play/billing/subscriptions#replacement-modes).
    *   `offer.order(additionalData)` initiates the flow.

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the subscription purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function.
*   **Why:** These listeners handle the progression: approval by Google Play, mandatory verification via your validator (which communicates with the Google Play Developer API), and mandatory acknowledgment via `finish()`.

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is REQUIRED for subscriptions on Android to get accurate status.
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

        // The verified receipt contains the authoritative status from Google Play Developer API.
        // The refreshUI() function (called below) should use store.verifiedPurchases or store.owned()
        // to update the UI based on this validated data.

        // Finish (acknowledge) the transaction(s) in the receipt with Google Play.
        // This is MANDATORY within 3 days for subscriptions.
        console.log(`Finishing verified receipt's source transaction(s): ${receipt.sourceReceipt.transactions.map(t=>t.transactionId).join(', ')}`);
        receipt.finish();
    })
    .finished(transaction => {
        // This confirms the acknowledgement call was successful.
        console.log(`Transaction ${transaction.transactionId} finished (acknowledged) for ${transaction.products[0]?.id}.`);
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
    *   `.verified()`: The receipt is validated. The UI should be updated based on this (`refreshUI()` is called). Crucially, `receipt.finish()` is called to acknowledge the purchase with Google Play.
    *   `.finished()`: Confirms acknowledgment. Update UI.

---

**Build and Test (Android/Google Play Subscription)**

Testing subscriptions on Google Play requires using testing tracks and specific procedures:

1.  **Create Release Build:** Sign your APK/AAB with your **release keystore**.
2.  **Upload to Play Console:** Upload the build to **Internal testing** or **Closed testing**.
3.  **Validator Setup:** Ensure your `store.validator` is configured and your validation server is connected to the **Google Play Developer API** using a Service Account key. This is mandatory for getting correct subscription status. See [Setup Guide - Step 9](sections/setup-subscription-android-9-validation-server.md).
4.  **Add Testers:** Add your tester Google accounts to the License Testing list and the specific testing track in the Play Console.
5.  **Prepare Test Device:** Use a physical device logged in **only** with a tester Google account. Install the app **from the Google Play Store** via the test link/invitation.
6.  **Run & Monitor:** Launch the app, monitor logs with `adb logcat CordovaPurchase:V CordovaLog:V chromium:D *:S`.
7.  **Test Subscription Purchase:**
    *   Verify UI shows "Subscription: Inactive" initially, product details load.
    *   Tap "Subscribe".
    *   The Google Play purchase sheet appears, mentioning test purchase behavior (e.g., short renewal cycles like 5 minutes). Confirm the purchase.
    *   Observe logs: `approved`, `Verification required...`, `Receipt verified...`, `Finishing...`, `finished`.
    *   The UI (`refreshUI`) should update based on the `verified` event data, showing "Subscription: ACTIVE" with the correct expiry date from the validator.
8.  **Test Renewals:** Keep the app running or reopen it around the renewal time (e.g., after 5 minutes for test subscriptions). Observe new `approved` -> `verified` -> `finished` cycles in the logs as the subscription auto-renews in the test environment. The expiry date in the UI should update.
9.  **Test Management:** Use `store.manageSubscriptions()` to open the Google Play subscription center. Test cancelling the subscription. After cancellation, `store.update()` or the next renewal attempt should reflect the change (e.g., `renewalIntent` becomes `LAPSE` in the `VerifiedPurchase` data from the validator).

---

This covers the Android subscription flow. Key points are the necessity of a **validator connected to the Google Play Developer API** and **acknowledging** purchases via `transaction.finish()`.

## 4. Receipt Validation (Mandatory)

Server-side validation using the **Google Play Developer API** is **essential** for subscriptions to determine the current status, expiry date, renewal intent, grace periods, and handle renewals and cancellations correctly. Local receipts are insufficient.

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

Follow the specific testing procedures for Google Play (signed release build, testing tracks, license tester accounts, validator connected to Developer API) outlined in the platform-specific purchase flow section above. Test initial purchases, accelerated renewals, cancellations, and plan changes (if applicable).
