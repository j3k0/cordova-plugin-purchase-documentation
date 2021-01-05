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
cordova plugin add cordova-plugin-purchase --variable BILLING_KEY="<BILLING_KEY>"
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
        type:   store.PAID_SUBSCRIPTION,
    }, {
        id:    'my_subscription2',
        type:   store.PAID_SUBSCRIPTION,
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

We declare the products as renewable subscriptions \(`store.PAID_SUBSCRIPTION`\). [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

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

We could make this a little nicer by changing the button labels to "Upgrade" or "Downgrade" when the other product is `owned`, I will let this as an exercise to the reader.

Now, let's build and test!

### Extra step for Android

If using the [Fovea validation service](https://billing.fovea.cc/), expiryDate and some other features of the API for an autorenewing Android subscription will only be available if you complete the 'Connect With Google' step using the explainer [here](https://billing.fovea.cc/documentation/connect-with-google-publisher-api/)

