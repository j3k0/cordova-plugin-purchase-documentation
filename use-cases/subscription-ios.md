# Subscription on iOS

In this guide, we will build a small application with a subscription that works on iOS.

On iOS, the plugin supports simple subscriptions and subscriptions groups. Introductory prices and promotional offers are supported yet.

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
<body>
  <div class="app">
    <p id="status">Loading...</p>
    <div id="monthly-purchase">...</div>
    <div id="yearly-purchase">...</div>
  </div>
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

If you're using [Fovea.Billing](https://billing.fovea.cc), you also need to add the validation server to your default-src, find it in the [cordova setup documentation](https://billing-dashboard.fovea.cc/setup/cordova)

Let's now create (or edit) JavaScript file `js/index.js` and load it from `index.html`. The code below initializes the plugin.

```javascript
document.addEventListener('deviceready', initStore);

function initStore() {

    if (!window.store) {
        console.log('Store not available');
        return;
    }

    store.register([{
        id:    'monthly',
        type:   store.PAID_SUBSCRIPTION,
    }, {
        id:    'yearly',
        type:   store.PAID_SUBSCRIPTION
    });

    store.validator = '<<< YOUR_RECEIPT_VALIDATION_URL >>>';

    store.error(function(error) {
        console.log('ERROR ' + error.code + ': ' + error.message);
    });
    
    // ... MORE HERE SOON

    store.refresh();
}
```

Here's a little explanation:

First, we check if the plugin is loaded.

Then, we register the product with ID `monthly` and `yearly`. We declare it them as renewable subscriptions \(`store.PAID_SUBSCRIPTION`\). [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

We setup the link to the receipt validation server. If you're using [Fovea.Billing](https://billing.fovea.cc), you'll [find it here](https://billing-dashboard.fovea.cc/setup/cordova).

We define an error handler. It just logs errors to the console.

Finally, we perform the initial `refresh()` of all product states. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

{% hint style="warning" %}
Whatever your setup is, you should make sure this runs as soon as the javascript application starts. You have to be ready to handle IAP events as soon as possible.
{% endhint %}

### Presentation

As a first step, we will simply display the subscription status as provided by the native platform.

```javascript
// does one of our product have the given state
function haveState(value) {
    return store.get('subscription1').state === value || store.get('subscription2').state === value;
}

// change the displayed state text in the DOM
function setStateText(value) {
    document.getElementById('status').textContent = value;
}

// full refresh of the UI
function refreshUI() {

    if (haveState('owned'))
        setStateText('Subscribed');
    else if (haveState('approved') || haveState('initiated'))
        setStateText('Processing...');
    else
        setStateText('Not Subscribed');

    refreshProduct('monthly');
    refreshProduct('yearly');
}

document.addEventListener('deviceready', refreshUI);
```

This part was easy,. Now for a bit more challenge, let's display the title, description and price of the subscription products.

We'll add a little more to the `initStore()` function, just before `store.refresh()`.

```javascript
store.when('product').updated(refreshUI);
```

This will call `refreshUI()` whenever any product is updated.

Then let's define the `refreshProduct()` function at the bottom of the file.

```javascript
function refreshProduct(id) {
    const product = store.get(id);
    const el = document.getElementById(`${id}-purchase`);
    const info = product.loaded
        ? `title: ${product.title}<br/>` +
          `desc: ${product.description}<br/>` +
          `price: ${product.price}<br/>`
        : '...';
    const button = product.canPurchase
         ? `<button onclick="store.order('${product.id}')">Buy Now!</button>`
         : '';
    el.htmlContent = info + button;
}
```

The function checks if the product has been loaded, then retrieve and display the product informations.

Then, it adds the "Buy Now!" button, only if the product can be purchased.

If you want a bit more background information about this, please check the introduction's [displaying products](../discover/about-the-plugin.md#displaying-products) section and the [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#storeproduct-object) for full details about the fields found for a product.

Now, let's build and test that!



### Testing

To test with In-App Purchases enabled, I chose to run my app through Xcode. This way, I can see the logs from both the javascript and native sides, which is useful.

To make a build, first update the Xcode project on the console.

```text
cordova prepare ios
```

Then switch to Xcode and run.

### Purchase

The purchase button works, but the code as it is won't do much with this order request. To process the purchase we have to implement the various steps of the purchase flow.

I already introduced the purchase flow in the introduction of this guide, check the [Purchase process](../discover/about-the-plugin.md#purchase-process) section if you need a refresher. The official documentation provides more details. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#-purchasing) 

The first thing that will happen is that the `canPurchase` state of the product will change to `false`. But remember, we added this in the previous step:

```javascript
store.when('product').updated(refreshUI);
```

So we're covered. The UI will be refreshed when `canPurchase` changes, it will not be possible to hit _Purchase_ again, until `canPurchase` becomes true.

When the user is done with the native interface \(i.e. enter his/her password and confirm\), you'll receive the `approved` event, let's handle it by adding the below to the `initStore()` function, before the call to `store.refresh()`.

```javascript
store.when('product').approved(function(p) {
    p.verify();
});
store.when('product').verified(function(p) {
    p.finish();
});
```

Then we will add the `finishPurchase` function at the end of our JavaScript file.

Alright, we're done with coding! Let's try the whole thing now. Repeat the steps from the [Testing](#testing) section above:

```text
cordova prepare ios
```

Run from Xcode and here you go! You should be able to purchase subscriptions.

Full source for this tutorial below:

{% code-tabs %}
{% code-tabs-item title="js/index.js" %}
```javascript
document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

    if (!window.store) {
        console.log('Store not available');
        return;
    }

    store.register([{
        id:    'monthly',
        type:   store.PAID_SUBSCRIPTION,
    }, {
        id:    'yearly',
        type:   store.PAID_SUBSCRIPTION,
    });

    store.validator = '<<< YOUR_RECEIPT_VALIDATION_URL >>>';

    store.error(function(error) {
        console.log('ERROR ' + error.code + ': ' + error.message);
    });

    store.when('product')
         .updated(refreshUI)
         .approved(p => p.verify())
         .verified(p => p.finish());

    store.refresh();
    refreshUI();
}

// full refresh of the UI
function refreshUI() {

    if (haveState('owned'))
        setStateText('Subscribed');
    else if (haveState('approved') || haveState('initiated'))
        setStateText('Processing...');
    else
        setStateText('Not Subscribed');

    refreshProduct('monthly');
    refreshProduct('yearly');

    // does one of our product have the given state
    function haveState(value) {
        return store.get('subscription1').state === value || store.get('subscription2').state === value;
    }

    // change the displayed state text in the DOM
    function setStateText(value) {
        document.getElementById('status').textContent = value;
    }
}

function refreshProduct(id) {
    const product = store.get(id);
    const el = document.getElementById(`${id}-purchase`);
    const info = product.loaded
        ? `title: ${product.title}<br/>` +
          `desc: ${product.description}<br/>` +
          `price: ${product.price}<br/>`
        : '...';
    const button = product.canPurchase
         ? `<button onclick="store.order('${product.id}')">Buy Now!</button>`
         : '';
    el.htmlContent = info + button;
}
```
{% endcode-tabs-item %}

{% code-tabs-item title="index.html" %}
```markup
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://reeceipt-validator.fovea.cc 'unsafe-eval'; style-src 'self' 'unsafe-inline'; media-src *">
</head>
<body>
  <div class="app">
    <p id="status">Loading...</p>
    <div id="monthly-purchase">...</div>
    <div id="yearly-purchase">...</div>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
</html>
```
{% endcode-tabs-item %}
{% endcode-tabs %}

