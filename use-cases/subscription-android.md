# Subscription on Android

In this guide, we will build a small application with a subscription that works on Android with Google Play.


We will proceed in steps: setup, initialization, presentation and purchase.

First some setup.

1. Install NodeJS and Cordova
2. Setup your Cordova project
3. Prepare an Application on Google Play
4. Install the In-App Purchases plugin
5. Build a Release APK
6. Create a Product on Google Play
7. Upload a Release APK to Google Play
8. Prepare Test Accounts

Of couse you can skip the first few steps if you already have a working application you want to integrate the code into.

Once we have a Cordova application with IAP support enabled and everything is in place on Google Play, we will get into some coding.

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

Making sure we have a Cordova project that we can build for Android and/or iOS.

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
    Using cordova-fetch for cordova-android@~7.1.1
    Adding android project...
    [...]
    Saving android@~7.1.1 into config.xml file ...
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

Alright, seems like we have no problems with our Android build chain. If you do have problems, fixing it is out of scope from this guide but it's required!

### 3. Create Google Play Application

Make sure we have a Google Play application created and configured.

### Create the App

* Open the [Google Play Console](https://play.google.com/apps/publish).
* Click "Create Application", fill in the required fields.

{% hint style="info" %}
Need more help? I recommend you check [Google's own documentation](https://support.google.com/googleplay/android-developer/answer/113469?hl=en&ref_topic=7072031). It's well detailed, easy to follow and probably the most up-to-date resource you can find.
{% endhint %}

### Retrieve the Billing Key

We need to inform the plugin of our app's `BILLING_KEY`. That piece of information can be found on the Google Play Publisher Console.

So head again to your [Google Play Console](https://play.google.com/apps/publish).

In the "_All Applications_" menu, go to the application you want to setup. In my case "_Cordova Purchase Demo_".

From there, find the "_Developments tools_" ⇒ "_Services & APIs_" section \(on the left-side panel\).

That is where you'll find this long Base64 string they call "**Your license key for this application**". Keep it around for later reference. That's your **Billing Key**.

{% hint style="info" %}
The Billing Key will be required to install the plugin on Android and setup receipt validation.
{% endhint %}

### 4. Install Cordova Purchase Plugin

To install the plugin, we will use the usual `cordova plugin add` command. There is little subtleties on Android.

When you need Android support, you need to setup your `BILLING_KEY`.

```text
cordova plugin add cc.fovea.cordova.purchase --variable BILLING_KEY="<BILLING_KEY>"
```

You can find that piece of information on the Google Play Publisher Console, as [explained here](#retrieve-the-billing-key).

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

### 6. Create In-App Products

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


