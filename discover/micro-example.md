# Micro Example

In-App Purchase involves a fair amount of configuration. In order to get a glimpse at a complete integration, you'll find here a minimal example and the expected result when run on a device.

This example is a Cordova application. The `index.html` does nothing but load `js/index.js`.

{% code-tabs %}
{% code-tabs-item title="js/index.js" %}
```javascript
document.addEventListener('deviceready', onDeviceReady);

var myProduct;

function onDeviceReady() {
  const {store, ProductType, Platform} = CdvPurchase;
  refreshUI();
  store.register([{
    type: CdvPurchase.CONSUMABLE,
    id: 'my_product',
    platform: Platform.TEST,
  ]});
  store.when()
    .productUpdated(refreshUI)
    .approved(finishPurchase);
  store.initialize([Platform.TEST]);
}

function finishPurchase(p) {
  localStorage.goldCoins = (localStorage.goldCoins | 0) + 10;
  p.finish();
  refreshUI();
}

function refreshUI() {
  const {store, ProductType, Platform} = CdvPurchase;
  myProduct = store.get('my_product', Platform.TEST);
  const myTransaction = store.findInLocalReceipts(myProduct);
  const button = `<button onclick="myProduct.getOffer().order()">Purchase</button>`;

  document.getElementsByTagName('body')[0].innerHTML = `
  <div>
    <pre>
      Gold: ${localStorage.goldCoins | 0}

      Product.state: ${myTransaction ? myTransaction.state : ''}
             .title: ${myProduct ? myProduct.title : ''}
             .descr: ${myProduct ? myProduct.description : ''}
             .price: ${myProduct ? myProduct.pricing.price : ''}

    </pre>
    ${myProduct.canPurchase ? button : ''}
  </div>`;
}
```
{% endcode-tabs-item %}

{% code-tabs-item title="index.html" %}
```markup
<!DOCTYPE html>
<html>
    <body>
      <script type="text/javascript" src="cordova.js"></script>
      <script type="text/javascript" src="js/index.js"></script>
    </body>
</html>
```
{% endcode-tabs-item %}
{% endcode-tabs %}

Launching this on a device...

{% embed url="https://youtu.be/fLoVePrIhc4" caption="" %}

The project is on GitHub: [https://github.com/j3k0/cordova-purchase-micro-example](https://github.com/j3k0/cordova-purchase-micro-example)

{% hint style="info" %}
Note that it's a simple example that doesn't handle error cases, but it's fully functional. In-App Purchases don't have to hard!
{% endhint %}

