# Micro Example

In-App Purchase involves a fair amount of configuration. In order to get a glimpse at a complete integration, you'll find here a minimal example and the expected result when run on a device.

This example is a Cordova application. The `index.html` does nothing but load `js/index.js`.

{% code-tabs %}
{% code-tabs-item title="js/index.js" %}
```javascript
document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {
  refreshUI();
  store.register({type: store.CONSUMABLE, id: 'my_product'});
  store.when('my_product')
    .updated(refreshUI)
    .approved(finishPurchase);
  store.refresh();
}

function finishPurchase(p) {
  localStorage.goldCoins = (localStorage.goldCoins | 0) + 10;
  p.finish();
  refreshUI();
}

function refreshUI() {
  const product = store.get('my_product');
  const button = `<button onclick="store.order('my_product')">Purchase</button>`;

  document.getElementsByTagName('body')[0].innerHTML = `
  <div>
    <pre>
      Gold: ${localStorage.goldCoins | 0}

      Product.state: ${product.state}
             .title: ${product.title}
             .descr: ${product.description}
             .price: ${product.price}

    </pre>
    ${product.canPurchase ? button : ''}
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
Note that it's a simple example that doesn't handle error cases, but it's fully functional. In-App Purchases don't have to be super hard!
{% endhint %}

