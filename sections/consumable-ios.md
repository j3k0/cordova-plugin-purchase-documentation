## Initialization

Assuming you're starting from a blank project, we'll add the minimal amount of HTML for the purpose of this tutorial. Let's replace the `<body>` from the `www/index.html` file with the below.

```markup
<body>
  <div class="app">
    <p id="gold-coins">Gold:</p>
    <div id="consumable1-purchase">Please wait...</div>
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

You can download the [full index.html file here](https://gist.github.com/j3k0/3324bb8e759fef4b3054b834a5a88500#file-index-html).

We will now create a new JavaScript file and load it from the HTML. The code below will initialize the plugin.

```javascript
document.addEventListener('deviceready', initStore);

function initStore() {

    if (!window.store) {
        console.log('Store not available');
        return;
    }

    store.register({
        id:    'consumable1',
        alias: 'my_consumable1',
        type:   store.CONSUMABLE
    });

    store.error(function(error) {
        console.log('ERROR ' + error.code + ': ' + error.message);
    });
    
    // ... MORE HERE SOON

    store.refresh();
}
```

Here's a little explanation:

**Lines 5-8**, we check if the plugin is loaded.

**Lines 10-14**, we register the product with ID `consumable1`.  We declare it as a non-consumable \(`store.NON_CONSUMABLE`\). [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

**Lines 16-18**, we setup an error handler. It just logs errors to the console.

**Line 22**, we perform the initial `refresh()` of all products states. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

{% hint style="warning" %}
Whatever your setup is, you should make sure this runs as soon as the javascript application starts. You have to be ready to handle IAP events as soon as possible.
{% endhint %}

## Presentation

For the sake of this tutorial's simplicity, let's store the user's number of gold coins in localStorage:`window.localStorage.goldCoins`

When the app starts, we'll refresh the `#gold-coins` html element:

```javascript
function refreshGoldCoinsUI() {
    document.getElementById('gold-coins').textContent =
        'GOLD: ' + (window.localStorage.goldCoins | 0);
}

document.addEventListener('deviceready', refreshGoldCoinsUI);
```

This part was easy,. Now for a bit more challenge, let's display the title, description and price of the virtual product for purchasing more gold. `consumable1` that we registered in the initialization code above.

We'll add a little more at `initStore()` function, line 20.

```javascript
store.when('my_consumable1').updated(refreshProductUI);
```

Then define  the `refreshProduct()` function at the bottom of the file.

```javascript
function refreshProductUI(product) {
    const info = product.loaded
        ? `title: ${product.title}<br/>` +
          `desc: ${product.description}<br/>` +
          `price: ${product.price}<br/>`
        : 'Retrieving info...';
    const button = product.canPurchase
         ? '<button onclick="purchaseConsumable1()">Buy Now!</button>'
         : '';
    const el = document.getElementById('consumable1-purchase');
    el.htmlContent = info + button;
}
```

**Lines 2**, check if the product has been loaded.

**Lines 3-5**, retrieve and display product informations.

**Lines 7-8**, add the "Buy Now!" button if product can be purchased.

If you want a bit more background information about this, please check the [Displaying Products ](../introduction/about-the-plugin.md#displaying-products)section and the [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#storeproduct-object) for full details about the fields found for a product.

Let's build and test that!

## Testing

To test with In-App Purchases enabled, I chose to run my app through Xcode. This way, I can see the logs from both the javascript and native sides, which is useful.

To make a build, first update the Xcode project on the console.

```text
cordova prepare ios
```

Then switch to Xcode and run.

## Purchase

Now that we have our purchase button, let's implement the `purchaseConsumable1` button.

```javascript
function purchaseConsumable1() {
    store.order('my_consumable1');
}
```

Can it be easier than that? Well, not so fast! The code as it is won't do much with this order request. To process the purchase we have to implement the various steps of the purchase flow.

I already introduced the purchase flow in the introduction of this guide, check the [Purchase process](../introduction/about-the-plugin.md#purchase-process) section if you need a refresher. The official documentation provides more details. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#-purchasing) 

So the first thing that will happen is that the `canPurchase` state of the product will change to `false`. But remember, we added this in the previous step:

```javascript
store.when('my_consumable1').updated(refreshProductUI);
```

So we're covered. The UI will be refreshed when `canPurchase` changes, it will not be possible to hit _Purchase_, until `canPurchase` becomes true again.

When the user is done with the native interface \(enter his/her password and confirm\), you'll receive the `approved` event, let's handle it by adding the below to the `initStore()` function, before the call to `store.refresh()`.

```javascript
store.when('my_consumable1').approved(function(p) {
    p.verify();
});
```

```javascript
store.when('my_consumable1').verified(finishPurchase);
```

Then we will add the `finishPurchase` function at the end of our JavaScript file.

```javascript
function finishPurchase(p) {
    window.localStorage.goldCoins += 10;
    refreshGoldCoinsUI();
    p.finish();
}
```

This is a good enough implementation, but let's go one step further and setup a receipt validator. This is optional, but it prevents the easiest for of hacking, so generally a good idea.

For this tutorial, we will use Fovea's own service which is free during development. You can implement your own receipt validation service later if you like.

1. Head to [https://billing.fovea.cc/](https://billing.fovea.cc/) and create an Account.
2. Setup your project's iOS bundle ID and shared secret, Save.
3. Go to the [Cordova Setup](https://billing-dashboard.fovea.cc/setup/cordova) page to copy the line `store.validator = "<something>"`.

Copy this line inside the `initStore()` function, anywhere before the initial `store.refresh()`. Also add the recommended `Content-Security-Policy` to your `index.html` as mentioned in the documentation.

Alright, we're done with coding! Let's try the whole thing now. Repeat the steps from the [Testing](consumable-ios.md#testing) section above:

```text
cordova prepare ios
```

Run from Xcode and here you go!

Full source for this tutorial is available here: [https://gist.github.com/j3k0/3324bb8e759fef4b3054b834a5a88500](https://gist.github.com/j3k0/3324bb8e759fef4b3054b834a5a88500)

