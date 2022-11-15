When an identifier user makes a purchase, iaptic sends a notification to your server with the details of the transaction.

Here's an example body content.

```js
{
  "type": "purchases.updated",
  "applicationUsername": "my_username",
  "purchases": {
    "REAL_GOOD": {
      "platform": "braintree",
      "purchaseId": "braintree:xxxxxxxx",
      "transactionId": "braintree:xxxxxxxx",
      "productId": "REAL_GOOD",
      "purchaseDate": "2022-11-14T10:57:48.000Z",
      "currency": "EUR",
      "amountMicros": 9990000,
      "sandbox": true,
      "isPending": false,
      "amountUSD": 9.77,
      "raw": { /* ... */ }
    }
  },
  "password": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

You can process with enabling the feature for your user depending on this purchase status (in particular, check for a potential `cancelationReason` which would mean the purchase has been cancelled).

Iaptic documentation related to server-to-server webhook contains all the appropriate details, which fall outside the scope of this guide.
