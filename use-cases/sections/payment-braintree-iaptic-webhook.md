When using a validation service like Iaptic to process the Braintree payment nonce, the service typically handles the communication with the Braintree gateway (e.g., calling `transaction.sale`). After a successful transaction on Braintree's side, Iaptic (or your custom validator) will notify *your* application backend via a server-to-server webhook.

This webhook informs your server that a specific payment (often linked to your internal user ID if provided during validation) has been successfully completed. Your server should then:

1.  Verify the webhook's authenticity (e.g., check a secret signature provided by Iaptic).
2.  Update the user's account status in your database (e.g., mark order as paid, grant access, credit virtual currency).
3.  Respond to the webhook request with a success status (e.g., HTTP 200 OK) so the service knows it was received.

Here's an **example** structure of what a webhook payload *might* look like (actual format depends on your validator service):

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

Handling this webhook correctly on your server is crucial for reliable order fulfillment after a Braintree payment processed via a validator. Consult your chosen validation service's documentation for specific details on their webhook format and security recommendations.