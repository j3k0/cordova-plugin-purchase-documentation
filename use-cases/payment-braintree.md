# Payment Request with Braintree

This use case explains how to request a custom payment using Braintree, suitable for selling physical goods, services, or virtual items priced dynamically. It requires the `cordova-plugin-purchase-braintree` extension.


## Initialization & UI

Let's set up a basic interface to request a payment.

**HTML (`index.html` body):**

```html
<body>
  <div class="app">
    <!-- Status messages -->
    <div id="messages">Loading...</div>

    <!-- Payment Request Area -->
    <div id="payment-section" style="border:1px solid #ccc; padding: 10px; margin-top:10px;">
        <h3>Pay with Braintree</h3>
        <p>Item: Awesome Gadget</p>
        <p>Price: $19.99 USD</p>
        <button id="pay-button" onclick="requestBraintreePayment()">Pay Now</button>
    </div>

  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
```

**JavaScript (`index.js` or equivalent):**

```javascript
document.addEventListener('deviceready', initStore, false);

// Example Product ID (could be dynamic)
const GADGET_ID = 'awesome_gadget_01';
const GADGET_PRICE_MICROS = 19990000; // $19.99
const GADGET_CURRENCY = 'USD';

function initStore() {

    const { store, Platform, ErrorCode } = CdvPurchase;

    if (!store) { log('Store not available'); return; }

    // Log all errors
    store.error(error => {
        log('ERROR ' + error.code + ': ' + error.message);
        updateMessages('Error: ' + error.message);
    });

    // *** Setup Braintree Validator/Client Token ***
    // store.validator = "YOUR_VALIDATOR_URL_FOR_BRAINTREE_NONCE_PROCESSING"; // Required server-side component
    const braintreeOptions: CdvPurchase.Braintree.AdapterOptions = {
        // Use Tokenization Key (Sandbox ONLY) or Client Token Provider (Recommended)
        // tokenizationKey: "YOUR_SANDBOX_TOKENIZATION_KEY",
        clientTokenProvider: (callback) => { /* Fetch token from your server */
             log('Fetching Braintree Client Token...');
             // Replace with your actual server call
             setTimeout(() => { callback("FAKE_CLIENT_TOKEN_FROM_SERVER"); }, 500);
        },
        // Optional configurations for Google Pay, Apple Pay, 3DS
        // googlePay: { countryCode: 'US', ... },
        // applePay: { companyName: 'My Gadget Shop', ... },
        // threeDSecure: { ... }
    };

    // Initialize the store with the Braintree adapter
    updateMessages('Initializing Store...');
    store.initialize([{ platform: Platform.BRAINTREE, options: braintreeOptions }])
      .then(() => {
          log('Store initialized');
          updateMessages('Store ready. Ready to pay.');
          // Enable pay button if needed
          const payButton = document.getElementById('pay-button') as HTMLButtonElement | null;
          if (payButton) payButton.disabled = false;
      }).catch(err => {
          updateMessages('Store initialization failed: ' + JSON.stringify(err));
      });
}

// --- Payment Request Logic ---

function requestBraintreePayment() {
    const { store, Platform, ErrorCode } = CdvPurchase;
    log('Requesting Braintree payment...');
    updateMessages('Processing payment...');

    const payButton = document.getElementById('pay-button') as HTMLButtonElement | null;
    if (payButton) payButton.disabled = true; // Disable button during payment

    store.requestPayment({
        platform: Platform.BRAINTREE,
        // Define the item(s) being purchased
        items: [{
            id: GADGET_ID,
            title: 'Awesome Gadget',
            pricing: {
                priceMicros: GADGET_PRICE_MICROS,
                currency: GADGET_CURRENCY,
            }
        }],
        // Total amount and currency (can be inferred if only 1 item)
        amountMicros: GADGET_PRICE_MICROS,
        currency: GADGET_CURRENCY,
        description: 'Payment for Awesome Gadget',
        // Optional: Add billingAddress, email, etc.
        // billingAddress: { givenName: 'John', surname: 'Doe', ... }

    }, /* AdditionalData can be passed here if needed */ )
    .cancelled(() => {
        log('Payment cancelled by user.');
        updateMessages('Payment cancelled.');
        if (payButton) payButton.disabled = false;
    })
    .failed(error => {
        log('Payment failed: ' + JSON.stringify(error));
        updateMessages(`Payment failed: ${error.message}`);
        if (payButton) payButton.disabled = false;
    })
    .initiated(transaction => {
        log('Transaction initiated: ' + transaction.transactionId);
        // Optional: UI update, e.g., show processing indicator
    })
    .approved(transaction => {
        log('Transaction approved: ' + transaction.transactionId + ' (Nonce received)');
        updateMessages('Payment approved by Braintree. Verifying with server...');
        // *** IMPORTANT: Send the nonce to your server for processing! ***
        // The transaction object here contains the Braintree nonce.
        // You MUST send this nonce (`transaction.transactionId` for Braintree payments)
        // to your backend server. Your server uses this nonce along with the amount
        // and your Braintree API keys to create the actual charge using the Braintree
        // Server SDK.

        // Example: call transaction.verify() IF your validator is setup to handle Braintree nonces
        if (store.validator) {
            transaction.verify();
        } else {
            log('WARNING: No validator configured. Cannot finalize payment server-side.');
            updateMessages('Nonce received, but cannot verify with server.');
            // In a real app, you'd still send the nonce to your backend here.
            // For demo, we might just finish locally (INSECURE).
            // transaction.finish(); // Simulate finishing after server call
        }
    })
    .verified(receipt => { // Validator handled the server-side charge
         log('Payment verified & processed server-side.');
         updateMessages('Payment Successful!');
         receipt.finish(); // Acknowledge
         if (payButton) payButton.disabled = false;
         // Fulfill the order (e.g., ship gadget, grant service access)
    })
    .finished(transaction => { // Transaction finished (acknowledged)
         log('Transaction finished: ' + transaction.transactionId);
         // Optional: Final UI updates if needed
    });
}

// --- Helper Functions ---

function updateMessages(text) {
    const el = document.getElementById('messages');
    if (el) el.textContent = text;
}

function log(msg) {
    console.log('[Braintree Payment] ' + msg);
}

// Initial setup
document.addEventListener('deviceready', () => {
    const payButton = document.getElementById('pay-button') as HTMLButtonElement | null;
    if (payButton) payButton.disabled = true; // Disabled until store is ready
}, false);

```

## Payment Flow with Braintree

1.  **Initialization:** Set up the Braintree adapter with your `tokenizationKey` or `clientTokenProvider`. Configure optional features like Apple Pay, Google Pay, or 3DSecure. **Crucially, set up `store.validator` to point to your backend endpoint that will process the Braintree payment nonce.**
2.  **Request Payment:** Call `store.requestPayment()` with `platform: Platform.BRAINTREE`, the items, amount, and currency.
3.  **Drop-In UI:** Braintree's Drop-In UI appears, allowing the user to select a payment method (Card, PayPal, Apple Pay, Google Pay, etc., depending on configuration and availability).
4.  **Approval & Nonce:** If the user authorizes payment, the `.approved()` callback fires. The `transaction` object contains the **payment method nonce** (in `transaction.transactionId` for Braintree payments).
5.  **Server-Side Processing (Mandatory):**
    *   Your app **must** send this `nonce`, along with the `amount` and `currency`, to your backend server.
    *   Your server uses the Braintree Server SDK (e.g., Node.js, PHP, Python) and your **Private Key** to call `gateway.transaction.sale()` with the nonce and amount. This creates the actual charge.
    *   **Using `transaction.verify()`:** If your `store.validator` endpoint is designed to handle a Braintree nonce (it receives the nonce, calls `gateway.transaction.sale()`, and returns a success/failure response in the standard validator format), you can simply call `transaction.verify()`.
6.  **Verification & Fulfillment:**
    *   If using `transaction.verify()`, the `.verified()` callback indicates your server successfully processed the payment.
    *   Your server should trigger order fulfillment (e.g., shipping, granting access).
    *   Call `receipt.finish()` in the `.verified()` callback.
7.  **Finish:** The `.finished()` callback fires after `receipt.finish()` completes.

**Never trust the client-side `.approved()` event alone to fulfill an order when using Braintree.** Always process the payment nonce server-side.
