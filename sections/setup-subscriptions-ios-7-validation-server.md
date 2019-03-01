### 7. Get a Receipt Validation Server

A proper implementation of subscriptions on iOS requires a receipt validation
server that'll get used to get the most up-to-date status of a users subscription.

Implementing your own is not in the scope of this guide, so we'll use
Fovea's dedicated service called Billing.

 1. Create an account on: [https://billing.fovea.cc](https://billing.fovea.cc/).
 2. Fill in the information for iOS: your **Bundle ID** and the **Shared Secret**.

Once this is done, you can visit the documentation page, keep it around for when
we'll start the implementation: we'll have to copy-paste the
`store.validator = ...` line into the code.

{% hint style="info" %}
The service is free for sandbox receipts validation. When you get to production
you need to upgrade to a paid plan (see [pricing](https://billing.fovea.cc/pricing/)).
{% endhint %}

