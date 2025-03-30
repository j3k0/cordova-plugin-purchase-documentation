# Consumable on AppStore (iOS & macOS)

This use case explains how to implement a **consumable** product (like virtual currency or extra lives) on iOS and macOS using the App Store platform and `cordova-plugin-purchase` v13+.

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
*   **Note:** Replace the placeholder product ID (`'consumable1'`) in the code with your actual App Store Product ID. Adapt the `grantCoins` function and UI rendering (`refreshUI`) to match your specific consumable item (e.g., lives, credits). Remember to use secure storage instead of `localStorage` for balances in production.

## 3. Purchase Flow

Implement the logic to handle the purchase process when the user taps the "Buy" button. This involves initiating the order and handling the `approved`, `verified` (optional but recommended), and `finished` events to grant the item and consume the purchase.
q
q!INCLUDE "./sections/consumable-ios.md"

## 4. Receipt Validation (Recommended)

While not strictly mandatory for basic consumable functionality on iOS (unlike subscriptions), validating receipts server-side prevents fraud and ensures purchases are legitimate before granting items.

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

Follow the specific testing procedures for iOS/macOS Sandbox environments outlined in the platform-specific purchase flow section above.
