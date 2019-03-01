
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

