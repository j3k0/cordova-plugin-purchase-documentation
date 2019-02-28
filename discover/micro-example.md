# Micro Example

In-App Purchase involves a fair amount of configuration. In order to get a glipse at a "finished" integration, I'll show you here a minimal example with some screenshots.

The example aims to run as a Cordova application. The index.html will load the below javascript. Note that it's a simple example that doesn't handle error cases, but it's fully functional. In-App Purchases don't have to be super hard!

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

Launching this on a device...

{% embed url="https://youtu.be/fLoVePrIhc4" %}

The project is on GitHub: [https://github.com/j3k0/cordova-purchase-micro-example](https://github.com/j3k0/cordova-purchase-micro-example)

| ![](../.gitbook/assets/micro-example-1.jpg) | ![](../.gitbook/assets/micro-example-2.jpg) | ![](../.gitbook/assets/micro-example-3.jpg) | ![](../.gitboot/assets/micro-example-4.jpg) |
| :--- | :--- | :--- | :--- |

