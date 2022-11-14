The code above will work on both iOS and Android. We need to pick a test platform, so let's use Android.

We can build and run our app with:

```
npx cordova run android
```

You can then make a test payment using one of Braintree's test credit card numbers, like **4242 4242 4242 4242**, with an expiry date in the future.

Here's the result:

![](../.gitbook/assets/payment-braintree-1.png) ![](../.gitbook/assets/payment-braintree-2.png) ![](../.gitbook/assets/payment-braintree-3.png) ![](../.gitbook/assets/payment-braintree-4.png) ![](../.gitbook/assets/payment-braintree-5.png)

Of course, your job doesn't end here. Iaptic will send a webhook notification to your server, indicating a payment for a given has been performed by the user. You should handle that webhook to deliver the purchase on your server.
