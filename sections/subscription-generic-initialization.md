
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

