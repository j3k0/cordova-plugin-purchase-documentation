## 6. Create In-App Products

There is still a bit more preparatory work: we need to setup our in-app product.

Before creating your In-App Product, you have to [Create an Android Application](google-play.md) first. Done already? Let's now setup our in-app product.

Back in the "Google Play Console", open the "Store presence" ⇒ "In-app products" section.

![](../assets/google-play-in-app-products.png)

If you haven't yet uploaded an APK, it'll warn you that you need to upload a Release APK. Here's how you [Build a Release APK](android-release-apk.md) and [Upload it to Google Play](google-play.md#upload-a-release-build).

Once this is done, you can create a product. Google offers 2 kinds of products:

* Managed Products
* Subscriptions

The latest is for auto-renewing subscriptions, in all other cases, you have to create a "Managed Product".

* Click the **CREATE** button.
* Fill in all the required information \(title, description, prices\).
* Make sure the Status is **ACTIVE**.
* **SAVE**

At the time of this writing, the purchase plugin doesn't yet support Introductory Prices for Subscription \(you can check the [status of the feature here](https://github.com/j3k0/cordova-plugin-purchase/issues/743)\), so you have to leave this out for now.

And we're done!

{% hint style="info" %}
There's might be some delay between creating a product on the Google Play Console and seeing it in your app. If your product doesn't show up after 24h, then you should start to worry.
{% endhint %}

