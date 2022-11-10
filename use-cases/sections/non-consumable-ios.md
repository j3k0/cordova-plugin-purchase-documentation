
### Testing

To test with In-App Purchases enabled, I chose to run my app through Xcode. This way, I can see the logs from both the javascript and native sides, which is useful.

To make a build, first update the Xcode project on the console.

```text
cordova prepare ios
```

Then switch to Xcode and run.

### Purchase

Now that we have our purchase button, let's implement the `purchaseNonConsumable1` button.

```javascript
function purchaseNonConsumable1() {
    store.order('nonconsumable1');
}
```

Can it be easier than that? Well, not so fast! The code as it is won't do much with this order request. To process the purchase we have to implement the various steps of the purchase flow.

I already introduced the purchase flow in the introduction of this guide, check the [Purchase process](../discover/about-the-plugin.md#purchase-process) section if you need a refresher. The official documentation provides more details. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#-purchasing) 

So the first thing that will happen is that the `canPurchase` state of the product will change to `false`. But remember, we added this in the previous step:

```javascript
store.when('nonconsumable1').updated(refreshProductUI);
```

So we're covered. The UI will be refreshed when `canPurchase` changes, it will not be possible to hit _Purchase_, until `canPurchase` becomes true again.

When the user is done with the native interface \(enter his/her password and confirm\), you'll receive the `approved` event, let's handle it by adding the below to the `initStore()` function, before the call to `store.refresh()`.

```javascript
store.when('nonconsumable1').approved(function(p) {
    p.verify();
});
```

```javascript
store.when('nonconsumable1').verified(finishPurchase);
```

Then we will add the `finishPurchase` function at the end of our JavaScript file.

```javascript
function finishPurchase(p) {
    window.localStorage.goldCoins += 10;
    refreshGoldCoinsUI();
    p.finish();
}
```

This is a good enough implementation, but let's go one step further and setup a receipt validator. This is optional, but it prevents the easiest for of hacking, so generally a good idea.

For this tutorial, we will use Fovea's own service which is free during development. You can implement your own receipt validation service later if you like.

1. Head to [https://billing.fovea.cc/](https://billing.fovea.cc/) and create an Account.
2. Setup your project's iOS bundle ID and shared secret, Save.
3. Go to the [Cordova Setup](https://billing-dashboard.fovea.cc/setup/cordova) page to copy the line `store.validator = "<something>"`.

Copy this line inside the `initStore()` function, anywhere before the initial `store.refresh()`. Also add the recommended `Content-Security-Policy` to your `index.html` as mentioned in the documentation.

Alright, we're done with coding! Let's try the whole thing now. Repeat the steps from the [Testing](#testing) section above:

```text
cordova prepare ios
```

Run from Xcode and here you go!

Full source for this tutorial is available here: [https://gist.github.com/j3k0/3324bb8e759fef4b3054b834a5a88500](https://gist.github.com/j3k0/3324bb8e759fef4b3054b834a5a88500)

