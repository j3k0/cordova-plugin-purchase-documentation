
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
function refreshUI() {

    function haveState(value) {
        return store.get('subscription1').state === value || store.get('subscription2').state === value;
    }
    function setStateText(value) {
        document.getElementById('status').textContent = value;
    }

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
store.when('subscription').updated(refreshUI);
```

Then define the `refreshProduct()` function at the bottom of the file.

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

