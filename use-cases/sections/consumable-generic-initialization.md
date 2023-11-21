
### Initialization

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
        type:   CdvPurchase.ProductType.CONSUMABLE
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

**Lines 10-14**, we register the product with ID `consumable1`. We declare it as a consumable \(`CdvPurchase.ProductType.CONSUMABLE`\). [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

**Lines 16-18**, we setup an error handler. It just logs errors to the console.

**Line 22**, we perform the initial `refresh()` of all products states. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

{% hint style="warning" %}
Whatever your setup is, you should make sure this runs as soon as the javascript application starts. You have to be ready to handle IAP events as soon as possible.
{% endhint %}

### Presentation

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

Then define the `refreshProduct()` function at the bottom of the file.

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

If you want a bit more background information about this, please check the [Displaying Products ](../discover/about-the-plugin.md#displaying-products)section and the [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#storeproduct-object) for full details about the fields found for a product.

Let's build and test that!
