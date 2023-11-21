
### Testing

To test on Android with In-App Purchases enabled, I always chose to run my app through Android Studio. This way, I can see the logs from both the javascript and native sides, which is useful.

To create a build, first update the Android project on the console, run

```text
cordova prepare android
```

Run.

![](.gitbook/assets/subscribe-init.png)

### Purchase Flow

We already added a "Buy" button. This button calls the `store.order()` method which initiates the purchase flow for a product.

At this point, the code starts the process but the purchase will remain "processing" forever, in the `approved` state.

For a product in the `approved` state, the transaction has been approved by the user's banking institurion but it won't be finalized until you inform them to do so. You have to deliver whatever the user purchased before finalizing.

I already introduced the purchase flow in the introduction of this guide, you can check the [purchase process](../discover/about-the-plugin.md#purchase-process) section if you need a refresher. The official documentation provides even more details. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#-purchasing) 

When the user is done with the native interface (i.e. has entered his/her password and confirmed\), your app receives the `approved` event. So let's add more handlers to the `onDeviceReady()` function, before the call to `store.refresh()`.

```javascript
store.when()
     .approved(p => p.verify())
     .verified(p => p.finish())
     .owned(p => console.log(`you now own ${p.alias}`));
```

That's enough for a local implementation (where we don't need to inform a server of changes to the subscription status). Let's try the whole thing now. Repeat the steps from the [testing](#testing) section above:

```text
cordova prepare android
```

Run from Android Studio and here you go! You should be able to purchase your subscriptions.

Full source for this tutorial below:

{% code-tabs %}
{% code-tabs-item title="js/index.js" %}
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

    // We should first register all our products or we cannot use them in the app.
    store.register([{
        id:    'my_subscription1',
        type:   CdvPurchase.ProductType.PAID_SUBSCRIPTION,
    }, {
        id:    'my_subscription2',
        type:   CdvPurchase.ProductType.PAID_SUBSCRIPTION,
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

    store.when()
        .approved(p => p.verify())
        .verified(p => p.finish())
        .owned(p => console.log(`you now own ${p.alias}`));

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

    // Load informations about products and purchases
    store.refresh();

    function render() {

        const purchaseProduct1 = state.product1.canPurchase
            ? `<button onclick="store.order('my_subscription1')">Subscribe</button>` : '';
        const purchaseProduct2 = state.product2.canPurchase
            ? `<button onclick="store.order('my_subscription2')">Subscribe</button>` : '';

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
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
</html>
```
{% endcode-tabs-item %}
{% endcode-tabs %}

