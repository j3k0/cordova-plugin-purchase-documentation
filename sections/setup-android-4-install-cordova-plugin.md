## 4. Install Cordova Purchase Plugin

To install the plugin, we will use the usual `cordova plugin add` command. There is little subtleties on Android.

When you need Android support, you need to setup your `BILLING_KEY`.

```text
cordova plugin add cc.fovea.cordova.purchase  --variable BILLING_KEY="<BILLING_KEY>"
```

You can find that piece of information on the Google Play Publisher Console, as [explained here](#retrieve-the-billing-key).

Now let's try to build.

```text
cordova build android
```

Successful build?

```text
[...]
BUILD SUCCESSFUL in 2s
```

All good! Seems like we can build an app with support for the Billing API.

Let's now prepare a release APK.

