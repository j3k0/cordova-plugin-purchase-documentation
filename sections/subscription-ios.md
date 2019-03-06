
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

