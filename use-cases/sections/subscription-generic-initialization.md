
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

    // Later, we will add our events handlers here

    // Load informations about products and purchases
    store.refresh();
}
```

Here's a little explanation:

We start by registering the product with ID `my_subscription1` and `my_subscription2`.

We declare the products as renewable subscriptions \(`CdvPurchase.ProductType.PAID_SUBSCRIPTION`\). [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

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

We could make this a little nicer by changing the button labels to "Upgrade" or "Downgrade" when the other product is `owned`, I will leave this as an exercise to the reader.

Now, let's build and test!

### Extra step for Android

If using the [Fovea validation service](https://billing.fovea.cc/), `expiryDate` and some other features of the API for an auto-renewing Android subscription will only be available if you complete the _"Connect With Google"_ step using the explainer [here](https://billing.fovea.cc/documentation/connect-with-google-publisher-api/).
