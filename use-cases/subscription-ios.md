# Subscription on iOS

In this guide, we will build a small application with a subscription that works on iOS.

On iOS, the plugin supports simple subscriptions and subscriptions groups. Introductory prices and promotional offers are supported yet.

Here's what we will build: a simple application to manage a subscription with 2 different levels (basic subscription, and better subscription).

![](../.gitbook/assets/subscribe-demo.png)

Let's dig into this.
We will proceed in 4 steps: setup, initialization, presentation and purchase.

Here what we'll do.

1. Install Dependencies
2. Create Cordova Project
3. Setup AppStore Application
4. Install and Prepare with XCode
5. Create In-App Products
6. Prepare Test Accounts

Of couse you can skip the first few steps if you already have a working application you want to integrate the code into.

Once we have a Cordova iOS application with IAP support enabled and everything is in place on AppStore Connect, we will get into some coding.

1. Initialize the in-app purchase plugin
2. Handle the purchase events
3. Deliver our product
4. Secure the transactions


## Setup

### 1. Install Dependencies

Needless to say, make sure you have the tools installed on your machine. Developing from a mac is generally recommended for doing iOS development, it's way easier. If you only plan on doing Android, then everything will work.

During the writing of this guide, I've been using the following environment:

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

### 3. Setup AppStore Application

First, I assume you have an Apple developer account. If not time to register, because it's mandatory.

Let's now head to the [AppStore Connect](https://appstoreconnect.apple.com) website. In order to start developing and testing In-App Purchases, you need all contracts in place as well as your financial information setup. Make sure there are no warning left there.

I'll not guide you through the whole procedure, just create setup your Apple application as usual.

#### Retrieve the Shared Secret

Since you are here, let's retrieve the Shared Secret. You can use an App-Specific one or a Master Shared Secret, at your convenience: both will work. Keep the value around, it'll be required, especially if you are implementing subscriptions.

![](../.gitbook/assets/appstore-shared-secret.png)



### 4. Install and Prepare with XCode

When you only require iOS support, no need for special command line arguments:

```text
$ cordova plugin add cc.fovea.cordova.purchase
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

If you followed the [Setup AppStore Application](#3-setup-appstore-application) section, you should have everything setup. Head again to the App's In-App Purchases page: select your application, then _Features_, then _In-App Purchases_.

From there you can create your In-App Products. Select the appropriate type, fill in all required metadata and select _cleared for sale_.

{% hint style="warning" %}
Even if that sounds stupid, you need to fill-in ALL metadata in order to use the In-App Product in development, even the screenshot for reviewers. Make sure you have at least one localization in place too.
{% endhint %}

The process is well explained by Apple, so I'll not enter into more details.

### 6. Create Test Users

In order to test your In-App Purchases during development, you should create some test users.

You can do so from the AppStore Connect website, in the _Users & Access_ section. There in the sidebar, you should see "Sandbox > Testers". If you don't, it means you don't have enough permissions to create sandbox testers, so ask your administrator.

From there, it's just a matter of hitting "+" and filling the form. While you're at it, create 2-3 test users: it will be handy for testing.

![](../.gitbook/assets/appstore-test-users.png)

### 7. Get a Receipt Validation Server

A proper implementation of subscriptions on iOS requires a receipt validation
server that'll get used to get the most up-to-date status of a users subscription.

Implementing your own is not in the scope of this guide, so we'll use
Fovea's dedicated service called Billing.

 1. Create an account on: [https://billing.fovea.cc](https://billing.fovea.cc/).
 2. Fill in the information for iOS: your **Bundle ID** and the **Shared Secret**.

Once this is done, you can visit the documentation page, keep it around for when
we'll start the implementation: we'll have to copy-paste the
`store.validator = ...` line into the code.

{% hint style="info" %}
The service is free for sandbox receipts validation. When you get to production
you need to upgrade to a paid plan (see [pricing](https://billing.fovea.cc/pricing/)).
{% endhint %}


## Coding


### Initialization

Assuming you're starting from a blank project, we'll add the minimal amount of HTML for the purpose of this tutorial. Let's replace the `<body>` from the `www/index.html` file with the below.

```markup
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://reeceipt-validator.fovea.cc 'unsafe-eval' 'unsafe-inline' gap:; style-src 'self' 'unsafe-inline'; media-src *">
</head>
<body style="margin-top: 50px">
  <div class="app">

    <!-- We'll show errors here -->
    <div id="error"><br/></div>

    <!-- Status of the subscription -->
    <p id="status">Loading...</p>

    <!-- Details about the "s1" and "s2" products -->
    <div id="s1-purchase" style="margin-top: 30px">...</div>
    <div id="s2-purchase" style="margin-top: 30px">...</div>

    <!-- Open the platforms' subscription management screen -->
    <button onclick="store.manageSubscriptions()" style="margin-top: 30px">
      Manage Subscriptions
    </button>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
</html>
```

Make sure to comment out Cordova template project's CSS.

We enabled the `'unsafe-inline'` `Content-Security-Policy` by adding it to the `default-src` section:

```markup
<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' [...]" />
```

Since we're using [Fovea.Billing](https://billing.fovea.cc), you also need to add the validation server to your default-src, find it in the [cordova setup documentation](https://billing-dashboard.fovea.cc/setup/cordova)

Let's now create (or edit) JavaScript file `js/index.js` and load it from `index.html`. The code below initializes the plugin.

```javascript
document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

    // We should first register all our products or we cannot use them in the app.
    store.register([{
        alias: 's1',
        id:    'my_subscription1',
        type:   store.PAID_SUBSCRIPTION,
    }, {
        alias: 's2',
        id:    'my_subscription2',
        type:   store.PAID_SUBSCRIPTION,
    }]);

    // For subscriptions and secured transactions, we setup a receipt validator.
    store.validator = '<<< YOUR_RECEIPT_VALIDATION_URL >>>';

    // Show errors on the dedicated Div.
    store.error(function(error) {
      document.getElementById('error').textContent = `ERROR ${error.code}: ${error.message}`;
      setTimeout(() => {
        document.getElementById('error').innerHTML = '<br/>';
      }, 10000);
    });

    // Later, we will add events handlers here

    // Load informations about products and purchases
    store.refresh();

    // Later, we will render the page from here
}
```

Here's a little explanation:

We start by registering the product with ID `my_subscription1` and `my_subscription2`, giving them the aliases `s1` and `s2`.

{% hint style="info" %}
Using aliases is optional, but generally a good idea. This way, you can modify the product ID in the registration call without changing it anywhere else.
{% endhint %}

We declare the products as renewable subscriptions \(`store.PAID_SUBSCRIPTION`\). [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

We setup the link to the receipt validation server. If you're using [Fovea.Billing](https://billing.fovea.cc), you'll [find it here](https://billing-dashboard.fovea.cc/setup/cordova).

We setup an error handler. It will display the last error message for 10 seconds on top of the screen.

Finally, we perform the initial `refresh()` of all product states. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

{% hint style="warning" %}
Whatever your setup is, you should make sure the initialization code runs as soon as the javascript application starts. You have to be ready to handle IAP events as soon as possible.
{% endhint %}

### Presentation

As a first step, we will simply display the subscription status as provided by the native platform.

```javascript
function onDeviceReady() {

    // [...] (stuff already in place from above)

    // Updates the user interface to reflect the initial state
    renderUI();
}

// Perform a full render of the user interface
function renderUI() {

    // When either of our susbscription products is owned, display "Subscribed".
    // If one of them is being purchased or validated, display "Processing".
    // In all other cases, display "Not Subscribed".
    if (haveState('owned'))
        document.getElementById('status').textContent = 'Subscribed';
    else if (haveState('approved') || haveState('initiated'))
        document.getElementById('status').textContent = 'Processing...';
    else
        document.getElementById('status').textContent = 'Not Subscribed';

    // Render the products' DOM elements "s1-purchase" and "s2-purchase"
    renderProductUI('s1');
    renderProductUI('s2');

    // Does any our product has the given state?
    function haveState(value) {
        return getState('s2') === value || getState('s1') === value;

        function getState(id) {
            return store.get(id) ? store.get(id).state : '';
        }
    }
}
```

This will update the status of the subscription on screen, let's now define the function that displays the details about our subscription products: titles, descriptions, and prices.

```javascript
// Refresh the displayed details about a product in the DOM
function renderProductUI(alias) {

    // Retrieve the product in the store and make sure it exists
    const product = store.get(alias);
    if (!product) return;

    // Create and update the HTML content
    const info = product.loaded
        ? `title: ${product.title}<br/>` +
          `desc: ${product.description}<br/>` +
          `price: ${product.price}<br/>` +
          `state: ${product.state}<br/>`
        : '...';
    const button = product.canPurchase
        ? `<button style="margin:20px 0" onclick="store.order('${product.id}')">Buy Now!</button>`
        : '';
    document.getElementById(`${alias}-purchase`).innerHTML = info + button;
}
```

A bit of explanation:

 1. we retrieve the product from its alias.
 2. when the product have been loaded, we show the metadata (title, description, price, state).
 3. we show the button if the product can be purchased.

{% hint style="warning" %}
Displaying your product information this way, i.e. exactly as loaded from the AppStore, is required by Apple. Do otherwise and they might simply reject your application.
{% endhint %}

{% hint style="warning" %}
    The buy button `product.canPurchase` should only be displayed when `product.canPurchase` is true. Otherwise, calling `store.order()` will generate an error.
{% endhint %}

Finally, we need to make sure that the view is re-rendered each time there's a change in our products' state. Do do so we'll attach an handler to the `updated` event.

In our `onDeviceReady()` function, just before the call to `store.refresh()`.

```javascript
store.when('subscription')
     .updated(renderUI);
```

Whenever anything changes with our product, the interface will be updated.

If you want a bit more background information about this, please check the introduction's [displaying products](../discover/about-the-plugin.md#displaying-products) section and the [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#storeproduct-object) for full details about the fields found for a product.

Now, let's build and test that!



### Testing

To test with In-App Purchases enabled, I chose to run my app through Xcode. This way, I can see the logs from both the javascript and native sides, which is useful.

To make a build, first update the Xcode project on the console.

```text
cordova prepare ios
```

Then switch to Xcode and run.

![](.gitbook/assets/subscribe-init.png)

### Purchase

As you may have notice, we already added a "Buy" button. This button calls the `store.order()` method which initiates the purchase flow for a product.

At this point, the code starts the process but the purchase will remain "processing" forever, in the `approved` state. For a product in the approved state, the transaction has been approved by the users bank but it won't be finalized until you inform them to do so. From here, you have to deliver whatever the user purchased before finalizing.

I already introduced the purchase flow in the introduction of this guide, you can check the [Purchase process](../discover/about-the-plugin.md#purchase-process) section if you need a refresher. The official documentation provides even more details. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#-purchasing) 

When the user is done with the native interface \(i.e. enter his/her password and confirm\), you'll receive the `approved` event.
let's handle it by adding another event handler in the `onDeviceReady()` function, before the call to `store.refresh()`.

```javascript
store.when('subscription')
     .approved(p => p.verify())
     .verified(p => p.finish())
     .owned(p => console.log(`you now own ${p.alias}`));
```



Alright, we're done with coding! Let's try the whole thing now. Repeat the steps from the [Testing](#testing) section above:

```text
cordova prepare ios
```

Run from Xcode and here you go! You should be able to purchase your subscriptions. Note that the 

Full source for this tutorial below:

{% code-tabs %}
{% code-tabs-item title="js/index.js" %}
```javascript
document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

    // We should first register all our products or we cannot use them in the app.
    store.register([{
        alias: 's1',
        id:    'cc.fovea.purchase.subscription1',
        type:   store.PAID_SUBSCRIPTION,
    }, {
        alias: 's2',
        id:    'cc.fovea.purchase.subscription2',
        type:   store.PAID_SUBSCRIPTION,
    }]);

    // For subscriptions and secured transactions, we setup a receipt validator.
    store.validator = "https://reeceipt-validator.fovea.cc/v1/validate?appName=test&apiKey=13d71c00-e703-49d0-b354-3d989bbfe865";

    // Show errors on the dedicated Div.
    store.error(function(error) {
      document.getElementById('error').textContent = `ERROR ${error.code}: ${error.message}`;
      setTimeout(() => {
        document.getElementById('error').innerHTML = '<br/>';
      }, 10000);
    });

    // Define events handler for our subscription products
    store.when('subscription')
         .updated(renderUI)          // render the interface on updates
         .approved(p => p.verify())   // verify approved transactions
         .verified(p => p.finish());  // finish verified transactions

    // Load informations about products and purchases
    store.refresh();

    // Updates the user interface to reflect the initial state
    renderUI();
}

// Perform a full render of the user interface
function renderUI() {

    // When either of our susbscription products is owned, display "Subscribed".
    // If one of them is being purchased or validated, display "Processing".
    // In all other cases, display "Not Subscribed".
    if (haveState('owned'))
        document.getElementById('status').textContent = 'Subscribed';
    else if (haveState('approved') || haveState('initiated'))
        document.getElementById('status').textContent = 'Processing...';
    else
        document.getElementById('status').textContent = 'Not Subscribed';

    // Render the products' DOM elements "s1-purchase" and "s2-purchase"
    renderProductUI('s1');
    renderProductUI('s2');

    // Does any our product has the given state?
    function haveState(value) {
        return getState('s2') === value || getState('s1') === value;

        function getState(id) {
            return store.get(id) ? store.get(id).state : '';
        }
    }

    // Refresh the displayed details about a product in the DOM
    function renderProductUI(alias) {

        // Retrieve the product in the store and make sure it exists
        const product = store.get(alias);
        if (!product) return;

        // Create and update the HTML content
        const info = product.loaded
            ? `title: ${product.title}<br/>` +
              `desc: ${product.description}<br/>` +
              `price: ${product.price}<br/>` +
              `state: ${product.state}<br/>`
            : '...';
        const button = product.canPurchase
            ? `<button style="margin:20px 0" onclick="store.order('${product.id}')">Buy Now!</button>`
            : '';
        document.getElementById(`${alias}-purchase`).innerHTML = info + button;
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
  <div class="app">

    <!-- We'll show errors here -->
    <div id="error"><br/></div>

    <!-- Status of the subscription -->
    <p id="status">Loading...</p>

    <!-- Details about the "s1" and "s2" products -->
    <div id="s1-purchase" style="margin-top: 30px">...</div>
    <div id="s2-purchase" style="margin-top: 30px">...</div>

    <!-- Open the platforms' subscription management screen -->
    <button onclick="store.manageSubscriptions()" style="margin-top: 30px">
      Manage Subscriptions
    </button>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
</html>
```
{% endcode-tabs-item %}
{% endcode-tabs %}

