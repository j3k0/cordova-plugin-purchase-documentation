# Non-Renewing Subscription for iOS & macOS



# Non-Renewing Subscription on iOS & macOS

This guide demonstrates how to implement a **non-renewing subscription** product using the AppStore platform for iOS and macOS applications.

Non-renewing subscriptions grant access to content or services for a **fixed, limited duration** (e.g., 1 month, 6 months, 1 year). Unlike auto-renewing subscriptions, they **do not automatically renew** at the end of the period. The user must explicitly purchase the subscription again to extend access.

Key characteristics on Apple platforms:

*   Managed entirely by your application logic after the initial purchase.
*   Apple does not handle renewals, cancellations, or expiry notifications automatically.
*   Often used for time-limited access to content archives, seasonal passes, or services where auto-renewal isn't desired or appropriate.
*   Requires careful handling of expiry dates and potentially syncing purchase status across devices if you support user accounts.

In this guide, we will build a simple application that allows users to purchase a non-renewing subscription which grants access for a defined period.
## Setup for iOS AppStore

{% hint style="warning" icon="warning" %}
**Platform Interfaces Change Frequently!**

The App Store Connect interface and Apple's requirements change often. This guide provides a general overview but may become outdated.

**Always refer to the official Apple documentation as the primary source:**
*   [App Store Connect Help](https://help.apple.com/app-store-connect/)
*   [In-App Purchase Configuration](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases)
{% endhint %}

This section covers the essential steps for setting up your iOS/macOS app for In-App Purchases with the Cordova plugin.

### 1. Install Dependencies


Needless to say, make sure you have the tools installed on your machine. During the writing of this guide, I've been using the following environment:

* **NodeJS** v10.12.0
* **Cordova** v8.1.2
* **macOS** 10.14.1

I'm not saying it won't work with different version. If you start fresh, it might be a good idea to use an up-to-date environment.


### 2. Create Cordova Project

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


### 3. Setup AppStore Application & Agreements

*   **Apple Developer Account:** Ensure you have an active Apple Developer Program membership.
*   **App Record:** Create an App Record for your application in [App Store Connect](https://appstoreconnect.apple.com).
*   **Agreements, Tax, and Banking:** Ensure all agreements are accepted and banking/tax information is complete in the "Agreements, Tax, and Banking" section of App Store Connect. Your app won't be able to process purchases otherwise.
*   **Bundle ID:** Verify the Bundle ID in App Store Connect exactly matches the `id` in your `config.xml`.


First, I assume you have an Apple developer account. If not time to register, because it's mandatory.

Let's now head to the [AppStore Connect](https://appstoreconnect.apple.com) website. In order to start developing and testing In-App Purchases, you need all contracts in place as well as your financial information setup. Make sure there are no warning left there.

I'll not guide you through the whole procedure, just create setup your Apple application as usual.

#### Retrieve the Shared Secret

Since you are here, let's retrieve the Shared Secret. You can use an App-Specific one or a Master Shared Secret, at your convenience: both will work. Keep the value around, it'll be required, especially if you are implementing subscriptions.

![](../.gitbook/assets/appstore-shared-secret.png)




### 4. Install and Prepare with XCode


When you only require iOS support, no need for special command line arguments:

```text
$ cordova plugin add cordova-plugin-purchase
```

You then have to activate the In-App Purchase capability manually for your application using Xcode. Unfortunately it's not something the plugin can do automatically. So let's first prepare the iOS project:

```text
$ cordova prepare ios
```

Then open the project on Xcode:

```text
$ open platforms/ios/*.xcodeproj
```

Get to the project's settings by clicking on the project's icon, which is the top-most item in the left-side pane tree view.

Select the target, go to _Capabilities_, scroll down to _In-App Purchase_ and make sure it's **"ON".**

![Enabling In-App Purchase Capability in Xcode](../.gitbook/assets/xcode-iap-capability.png)

Now try to **build the app from Xcode**. It might point you to a few stuff it might automatically fix for you if you're starting from a fresh project, like selecting a development team and creating the signing certificate. So just let Xcode do that for you except if you have a good reason not to and know what you're doing.

Successful build? You're good to go!


### 5. Create In-App Products

### 5. Create In-App Products

If you followed the [Setup AppStore Application](#3-setup-appstore-application) section, you should have everything setup. Head again to the App's In-App Purchases page: select your application, then _Features_, then _In-App Purchases_.

From there you can create your In-App Products. Select the appropriate type, fill in all required metadata and select _cleared for sale_.

{% hint style="warning" %}
Even if that sounds stupid, you need to fill-in ALL metadata in order to use the In-App Product in development, even the screenshot for reviewers. Make sure you have at least one localization in place too.
{% endhint %}

The process is well explained by Apple, so I'll not enter into more details.


### 6. Create Test Users

### 6. Create Test Users

In order to test your In-App Purchases during development, you should create some test users.

You can do so from the AppStore Connect website, in the _Users & Access_ section. There in the sidebar, you should see "Sandbox > Testers". If you don't, it means you don't have enough permissions to create sandbox testers, so ask your administrator.

From there, it's just a matter of hitting "+" and filling the form. While you're at it, create 2-3 test users: it will be handy for testing.

![](../.gitbook/assets/appstore-test-users.png)


## Code Implementation

This section describes the minimal code required to implement a non-renewing subscription product (granting access for a fixed period) on iOS and macOS using the AppStore platform.

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
*   Displaying the current access expiry date if the subscription is active. *Your application needs to calculate and store this based on purchase history.*
*   Showing a "Subscribe" or "Extend" button. Non-renewing subscriptions can typically be purchased multiple times to extend access.


### Initialization

Assuming you're starting from a blank project, we'll add the minimal amount of HTML for the purpose of this tutorial. Let's replace the `<body>` from the `www/index.html` file with the below.

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

Make sure to comment out Cordova template project's CSS.

We enabled the `'unsafe-inline'` `Content-Security-Policy` by adding it to the `default-src` section.

Since we'll be using [Fovea.Billing](https://billing.fovea.cc), you also need to add your validation server to default-src, find your in the [cordova setup documentation](https://billing-dashboard.fovea.cc/setup/cordova). On my case it's `https://reeceipt-validation.fovea.cc`.

Let's now or edit the JavaScript file `js/index.js`. Replace the content with the code below, which will setup a minimal application framework and render some HTML into the page based on the app state.


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

    // We will initialize the in-app purchase plugin here.

    function render() {

        const body = document.getElementsByTagName('body')[0];
        body.innerHTML = `
<pre> 
${state.error}

subscription: ${state.status}
</pre>
        `;
    }
}
```

Now let's initialize the in-app purchase plugin, where indicated in the `onDeviceReady` function.

```javascript

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

    // Later, we will add our events handlers here

    // Load informations about products and purchases
    store.refresh();
}
```

Here's a little explanation:

We start by registering the product with ID `my_subscription1` and `my_subscription2`.

We declare the products as renewable subscriptions \(`CdvPurchase.ProductType.PAID_SUBSCRIPTION`\). [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

We setup the link to the receipt validation server. If you're using [Fovea.Billing](https://billing.fovea.cc), you'll [find it here](https://billing-dashboard.fovea.cc/setup/cordova).

We setup an error handler. It will display the last error message for 10 seconds on top of the screen.

Finally, we perform the initial `refresh()` of all product states. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

{% hint style="warning" %}
Whatever your setup is, you should make sure the initialization code is executed as soon as the javascript application starts. You have to be ready to handle IAP events as soon as possible.
{% endhint %}

### Presentation

Let's now display the subscription status, as it is provided by the native platform. Before the call to `store.refresh()` we will add an handler for the `update` event:

This hander is called whenever there's a change in our products' state.

```javascript
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
```

Now we can display some information about our products from the `render()` function:

```javascript
function render() {

    const purchaseProduct1 = '';
    const purchaseProduct2 = '';

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
```

Whenever anything happens to our product, the interface will now be updated to reflect the current state.

{% hint style="warning" %}
Displaying your product information this way, i.e. exactly as loaded from the Store, is required by Apple and Google. Do otherwise and they might simply reject your application.
{% endhint %}

{% hint style="hint" %}
You can also disconnect the event handler with `store.off()` so your subscription view is only updated when it's visible.
{% endhint %}

If you want a bit more background information about all of this, please check the introduction's [displaying products](../discover/about-the-plugin.md#displaying-products) section and the [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#storeproduct-object) for full details about the fields found for a product.

### Purchase

So far so good, but what if we could actually initiate a purchase? To do so, we'll add a purchase button for both products. We already added placeholders for the purchase buttons, let's create them. Before displaying a purchase button, we need to make sure the user can actually purchase the item. It could be impossible for a few reasons: there's already a purchase in progress, the product is already owned, the feature is disabled for the user (Child Mode).

In our `render()` function, we update the code that initialized `purchaseProduct1` and `purchaseProduct2`.

```javascript
// button for product 1
const purchaseProduct1 = state.product1.canPurchase
    ? `<button onclick="store.order('my_subscription1')">Subscribe</button>` : '';

// same for product 2
const purchaseProduct2 = state.product2.canPurchase
    ? `<button onclick="store.order('my_subscription2')">Subscribe</button>` : '';
```

{% hint style="warning" %}
    The buy button should only be displayed when `product.canPurchase` is true. Otherwise, calling `store.order()` will generate an error.
{% endhint %}

We could make this a little nicer by changing the button labels to "Upgrade" or "Downgrade" when the other product is `owned`, I will leave this as an exercise to the reader.

Now, let's build and test!

### Extra step for Android

If using the [Fovea validation service](https://billing.fovea.cc/), `expiryDate` and some other features of the API for an auto-renewing Android subscription will only be available if you complete the _"Connect With Google"_ step using the explainer [here](https://billing.fovea.cc/documentation/connect-with-google-publisher-api/).

*Note: Adapt the UI logic in `subscription-generic-initialization.md`. The concept of `product.owned` is less relevant here; you need to track ownership and expiry based on purchase history (likely stored locally or synced via your backend). Show "Access until [Your Calculated Expiry Date]".*

### Purchase Flow

Handling the purchase flow for non-renewing subscriptions on Apple platforms involves purchasing the product and then managing the entitlement period within your application.
*   Initiate the order when the "Subscribe/Extend" button is clicked.
*   Handle the `approved` state. Verification is optional but recommended for tracking purchase history reliably.
*   Call `transaction.finish()` once the purchase is approved (or verified).
*   Your application must record the purchase time and calculate the expiry date based on the product's defined duration (e.g., 1 month, 1 year).
*   Store this expiry date persistently (e.g., `localStorage`, secure storage, or synced with your backend).
*   Implement logic to check the expiry date to grant or deny access to the content/service.
*   If you support user accounts, you need to sync this entitlement across the user's devices.

### Purchase Flow (iOS/macOS Non-Renewing)

Handling the purchase flow for non-renewing subscriptions on Apple platforms involves purchasing the product like any other, acknowledging it, and then managing the entitlement period within your application logic. Apple does not automatically track the expiry or renewal for this type of subscription.

1.  **Initiate Order:**
    When the user clicks the "Subscribe" or "Extend" button, call `store.order()` on the relevant offer.

    ```javascript
    function purchaseNonRenewingSubscription() {
        const offer = store.get('my_non_renewing_sub_id', Platform.APPLE_APPSTORE)?.getOffer();
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
    Set up listeners for the `approved` and `verified` states. Verification is useful for obtaining the `purchaseDate` accurately from Apple's servers, which you'll need to calculate the expiry.

    ```javascript
    // In your store initialization (e.g., inside onDeviceReady or initStore)
    store.when()
        .approved(transaction => {
            // Optional: Verify the transaction to get accurate purchaseDate
            // and confirm legitimacy.
            if (store.validator) {
                transaction.verify();
            } else {
                // No validator, proceed directly to finish/acknowledge
                // Note: transaction.purchaseDate might be less reliable without validation.
                acknowledgePurchase(transaction);
            }
        })
        .verified(receipt => {
            // Acknowledgment is done after verification succeeds
            const transaction = receipt.transactions.find(t => t.products[0]?.id === 'my_non_renewing_sub_id'); // Find the relevant transaction
            if (transaction) {
                acknowledgePurchase(transaction);
            }
        });
    ```

3.  **Acknowledge (Finish) the Purchase & Calculate Expiry:**
    Call `transaction.finish()` to acknowledge the purchase with Apple. Crucially, you must then calculate and store the expiry date based on the product's defined duration and the transaction's `purchaseDate`.

    ```javascript
    function acknowledgePurchase(transaction) {
        // Grant entitlement based on the product purchased
        // 1. Get the accurate purchase date (ideally from verified receipt if possible)
        const purchaseDate = transaction.purchaseDate || new Date(); // Fallback to now if date missing

        // 2. Determine the duration from your product definition
        const productDurationMonths = 6; // Example: Get this (e.g., 6 months) based on transaction.products[0].id

        // 3. Calculate expiry date
        const expiryDate = new Date(purchaseDate);
        expiryDate.setMonth(expiryDate.getMonth() + productDurationMonths);

        // 4. Store the expiry date persistently and associate with the user/device
        //    This might involve localStorage, secure storage, or your backend.
        //    If syncing across devices, ensure this is tied to the user's account.
        window.localStorage.setItem('nonRenewingExpiry_' + transaction.products[0].id, expiryDate.toISOString());
        console.log(`Access granted for ${transaction.products[0].id} until: ${expiryDate.toISOString()}`);

        // 5. Acknowledge the purchase with Apple AppStore
        transaction.finish();

        // 6. Refresh UI to show the new expiry date
        refreshUI(); // Ensure your refreshUI reads the stored expiry date
    }
    ```

4.  **Manage Entitlement:**
    Your application must check the stored expiry date whenever the user tries to access the protected content or service. Sync this state if users can log into accounts on multiple devices.

    ```javascript
    function hasActiveNonRenewingAccess(productId) {
        const expiryString = window.localStorage.getItem('nonRenewingExpiry_' + productId);
        if (!expiryString) return false;
        const expiryDate = new Date(expiryString);
        return expiryDate > new Date();
    }

    // Example usage:
    if (hasActiveNonRenewingAccess('my_non_renewing_sub_id')) {
        // Show premium content
    } else {
        // Show purchase options
    }
    ```

**Key Points:**

*   **Acknowledge:** Always call `transaction.finish()`.
*   **Track Expiry:** Your app *must* calculate, store, and check the expiry date. Apple does not manage this for non-renewing types.
*   **Purchase Date:** Use the `transaction.purchaseDate`. Verification (`transaction.verify()`) provides the most reliable date from Apple's servers.
*   **Persistence & Syncing:** Store the expiry date securely and sync across devices if necessary for your use case.
