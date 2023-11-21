
### Initialization

!INCLUDE "./initial-html.md"

We will now create a new JavaScript file and load it from the HTML. The code below will initialize the plugin.

```javascript
document.addEventListener('deviceready', initStore);

function initStore() {

    if (!window.store) {
        console.log('Store not available');
        return;
    }

    store.register({
        id:    'nonconsumable1',
        type:   CdvPurchase.ProductType.NON_CONSUMABLE
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

**Lines 10-13**, we register the product with ID `nonconsumable1`. We declare it as a non-consumable \(`CdvPurchase.ProductType.NON_CONSUMABLE`\). [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

**Lines 15-17**, we setup an error handler. It just logs errors to the console.

**Line 21**, we perform the initial `refresh()` of all products states. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#registering-products).

{% hint style="warning" %}
Whatever your setup is, you should make sure this runs as soon as the javascript application starts. You have to be ready to handle IAP events as soon as possible.
{% endhint %}

### Presentation

For the sake of this tutorial's simplicity, let's store the state of the feature (locked or unlocked) in localStorage: `window.localStorage.unlocked`

When the app starts, we'll refresh the `#locked` html element:

```javascript
function refreshLockedUI() {
    document.getElementById('locked').textContent =
        'Feature ' + window.localStorage.unlocked === 'YES' ? 'UNLOCKED! \o/' : 'locked :('
}

document.addEventListener('deviceready', refreshLockedUI);
```

This part was easy,. Now for a bit more challenge, let's display the title, description and price of the in-app product for purchasing the feature, `nonconsumable1` that we registered in the initialization code above.

We'll add a little more at `initStore()` function, line 20.

```javascript
store.when('nonconsumable1').updated(refreshProductUI);
```

Then define the `refreshProductUI()` function at the bottom of the file.

```javascript
function refreshProductUI(product) {
    const info = product.loaded
        ? `title: ${product.title}<br/>` +
          `desc: ${product.description}<br/>` +
          `price: ${product.price}<br/>`
        : 'Retrieving info...';
    const button = product.canPurchase
         ? '<button onclick="purchaseNonConsumable1()">Buy Now!</button>'
         : '';
    const el = document.getElementById('nonconsumable1-purchase');
    el.htmlContent = info + button;
}
```

**Lines 2**, check if the product has been loaded.

**Lines 3-5**, retrieve and display product informations.

**Lines 7-8**, add the "Buy Now!" button if product can be purchased.

If you want a bit more background information about this, please check the [Displaying Products ](../discover/about-the-plugin.md#displaying-products)section and the [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#storeproduct-object) for full details about the fields found for a product.

Let's build and test that!
