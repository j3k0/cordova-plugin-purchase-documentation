
### Testing

In-App Purchase on Android will only work on release builds, i.e. builds that are signed with the same certificate that the one you're using for APKs you upload on Google Play.

We went over this already, in the [Android Release APK](#5-android-release-apk) section. This is how we're building the release build:

```text
./android-release.sh
```

Feel free to use your own method to create a release APK.

Install the generated APK **on a real device** (important!):

```text
adb install -r path/to/android-release.apk
```

{% hint style="warning" %}
IAP do not work in the emulator!
{% endhint %}

{% hint style="info" %}
If needed, you can them access the logs with `adb`, like this:

`adb logcat "chromium:I *:E"`
{% endhint %}

The `android-release.sh` script has a shortcut that will build, install and start `adb logcat`:

```text
./android-release.sh run
```

You can now make purchase with on of your test accounts.

{% hint style="warning" %}
A test account can purchase an item in your product list only if the item is published.
{% endhint %}

### Purchase

Now that we have our purchase button, let's implement the `purchaseNonConsumable1` button.

```javascript
function purchaseNonConsumable1() {
    store.order('my_non_consumable1');
}
```

Can it be easier than that? Well, not so fast! The code as it is won't do much with this order request. To process the purchase we have to implement the various steps of the purchase flow.

I already introduced the purchase flow in the introduction, check the [Purchase process](../discover/about-the-plugin.md#purchase-process) section if you need a refresher. The official documentation provides more details. [⇒ API Documentation](https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#-purchasing) 

So the first thing that will happen is that the `canPurchase` state of the product will change to `false`. But remember, we added this in the previous step:

```javascript
store.when('my_non_consumable1 updated', refreshProductUI);
```

So we're covered. The UI will be refreshed when `canPurchase` changes.

When the user is done with the native interface \(enter his/her password and confirm\), you'll receive the `approved` event, let's handle it by adding the below to the `initStore()` function, before the call to `store.refresh()`.

```javascript
store.when('my_non_consumable1 approved', function(p) {
    p.verify();
});
```

```javascript
store.when('my_non_consumable1 verified', finishPurchase);
```

Then we will add the `finishPurchase` function at the end of our JavaScript file.

```javascript
function finishPurchase(p) {
    window.localStorage.unlocked = "YES";
    refreshLockedUI();
    p.finish();
}
```

This is a good enough implementation, but let's go one more step and setup a receipt validator.

For this tutorial, we will use Fovea's own service which is free while in development:

1. Head to [https://billing.fovea.cc/](https://billing.fovea.cc/) and create an Account.
2. Setup your project's package name and billing key, Save.
3. Go to the [Cordova Setup](https://billing-dashboard.fovea.cc/setup/cordova) page to copy the line `store.validator = "<something>"`.

Copy this line inside the `initStore()` function, anywhere before the initial `store.refresh()`. Also add the recommended `Content-Security-Policy` to your `index.html` as mentioned in the documentation.

Alright, we're done with coding! Let's try the whole thing now. We will repeat the steps from the [Testing](#testing) section above:

```text
./android-release.sh run
```

Here we go. Let's try to purchase from the app, make sure you are using one of the test account.

The full source for this tutorial is available here: [https://gist.github.com/j3k0/3324bb8e759fef4b3054b834a5a88500](https://gist.github.com/j3k0/3324bb8e759fef4b3054b834a5a88500)


