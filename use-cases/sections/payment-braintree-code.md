
### Base framework


#### index.html

Assuming you're starting from a blank project, we'll add the minimal amount of HTML for the purpose of this tutorial. Let's replace the `<body>` from the `www/index.html` file with the below.

```markup
<body>
  <div id="app"></div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
```

Let's also make sure to comment out Cordova template project's CSS.

You also need to enable the `'unsafe-inline'` `Content-Security-Policy` by adding it to the `default-src` section:

```markup
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self' 'unsafe-inline' [...]" />
```

You can download the [full index.html file here](https://gist.github.com/j3k0/80c69837e5bacf83c4fc2320ba2e5dc2).
#### javascript


We will now create a new JavaScript file and load it from the HTML. The code below will initialize the plugin.

{% code lineNumbers="true" %}
```javascript
// Wait for Cordova to be ready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
  console.log('Device is ready.');

  // Check if the CdvPurchase plugin is available
  if (!window.CdvPurchase || !window.CdvPurchase.store) {
      console.error('CdvPurchase plugin is not available. Ensure it is installed and loaded correctly.');
      document.getElementById('app').innerHTML = 'Error: Purchase plugin not found.';
      return;
  }

  // Alias the store object for easier access
  const { store, LogLevel, ErrorCode } = CdvPurchase;
  console.log('CdvPurchase.store object found, version ' + store.version);

  // Optional: Set the verbosity level for debugging
  // LogLevel.DEBUG provides the most detailed logs
  store.verbosity = LogLevel.DEBUG;

  // Setup a global error handler for the store
  store.error(function(error) {
      console.error('STORE ERROR: Code=' + error.code + ' Message=' + error.message);
      // Display the error to the user in a dedicated element
      const errorEl = document.getElementById('error-display'); // Ensure this element exists in your HTML
      if (errorEl) {
          errorEl.textContent = 'Error: ' + error.message;
          // Optionally clear the error after a few seconds
          setTimeout(() => { if (errorEl.textContent === 'Error: ' + error.message) errorEl.textContent = ''; }, 8000);
      }
  });

  // Setup a listener for when the store is ready
  // This guarantees that initialize() has completed successfully
  store.ready(function() {
    console.log("CdvPurchase store is ready.");
    // Initial UI refresh after the store is ready
    refreshUI();
  });

  // Initialize the store and related components
  initializeStore();

  // Perform an initial UI refresh (might show loading states)
  refreshUI();
}

function initializeStore() {
  console.log('Calling initializeStore()...');
  const { store } = CdvPurchase; // Get store instance again

  // TODO: Register products using store.register([...])
  console.log('Registering products...');
  // store.register([...]); // Add your product registrations here

  // TODO: Set the validator URL or function
  console.log('Setting validator...');
  // store.validator = "YOUR_VALIDATOR_URL";

  // TODO: Setup event listeners using store.when()...
  console.log('Setting up event listeners...');
  // store.when()...

  // TODO: Call store.initialize([...platforms])
  console.log('Calling store.initialize()...');
  // store.initialize([...]);
}

function refreshUI() {
  console.log('Calling refreshUI()...');
  // TODO: Implement UI updates based on product/purchase status
  // This function will be called by event listeners and after initialization.
  const appEl = document.getElementById('app');
  if (appEl) {
      // Example: Display loading state or initial content
      // appEl.innerHTML = '<p>Store is initializing...</p>';
  } else {
      console.error('App element not found for UI refresh.');
  }
}
```
{% endcode %}

Here's a little explanation:

**Line 1**, it's important to wait for the "deviceready" event before using cordova plugins.

**Lines 5-8**, we check if the plugin was correctly loaded.

**Lines 11-13**, we setup an error handler. It just logs errors to the console.

> Whatever your setup is, you should make sure this runs as soon as the javascript application starts. You have to be ready to handle IAP events as soon as possible.

### Initialization

As mentioned earlier, we'll use iaptic for the server side integration with Braintree.

We'll instantiate the [iaptic component](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Iaptic.md), and use the provided `braintreeClientTokenProvider` and `validator` to handle the server-side part of the purchase process.

{% code lineNumbers="true" %}
```javascript
function initializeStore() {
  // Ensure CdvPurchase and its members are available
  if (!window.CdvPurchase) {
    console.error('CdvPurchase is not defined. Ensure plugin is loaded.');
    return;
  }
  const { store, Platform, ErrorCode, Iaptic } = CdvPurchase;

  // --- Configuration ---
  // Replace with your actual Iaptic App Name and Public API Key
  const IAPTIC_APP_NAME = 'YOUR_IAPTIC_APP_NAME';
  const IAPTIC_API_KEY = 'YOUR_IAPTIC_PUBLIC_KEY';
  // Replace with your actual Braintree Sandbox Tokenization Key (for testing only)
  // const BRAINTREE_TOKENIZATION_KEY = 'YOUR_SANDBOX_TOKENIZATION_KEY';
  // URL to your backend endpoint that generates Braintree Client Tokens (Recommended for Production)
  const BRAINTREE_CLIENT_TOKEN_URL = 'https://your-server.com/api/braintree/client-token';

  // --- Iaptic Setup (Optional but recommended for validation/token generation) ---
  const iaptic = new Iaptic({
    apiKey: IAPTIC_API_KEY,
    appName: IAPTIC_APP_NAME,
  });

  // Set the validator URL (points to Iaptic or your own server)
  // This validator endpoint needs to be able to process Braintree nonces.
  store.validator = iaptic.validator;

  // --- Braintree Options ---
  const braintreeOptions = {
    // Option 1: Client Token Provider (Recommended)
    // Fetches a short-lived token from your server each time it's needed.
    clientTokenProvider: (callback) => {
      console.log('Requesting Braintree Client Token from server...');
      fetch(BRAINTREE_CLIENT_TOKEN_URL, { method: 'POST' /* Add auth headers if needed */ })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then(data => {
          if (data.clientToken) {
            console.log('Client Token received.');
            callback(data.clientToken); // Success
          } else {
            console.error('Server did not provide clientToken:', data);
            callback({ // Error object
              code: ErrorCode.COMMUNICATION,
              message: 'Failed to fetch Braintree client token from server.',
              isError: true, platform: Platform.BRAINTREE, productId: null
            });
          }
        })
        .catch(error => {
          console.error('Error fetching Braintree client token:', error);
          callback({ // Error object
            code: ErrorCode.COMMUNICATION,
            message: 'Network error fetching Braintree client token: ' + error.message,
            isError: true, platform: Platform.BRAINTREE, productId: null
          });
        });
    },

    // Option 2: Tokenization Key (Simpler for testing, less secure for production)
    // tokenizationKey: BRAINTREE_TOKENIZATION_KEY,

    // Optional: Configure Apple Pay (iOS only)
    // applePay: { companyName: 'My Awesome Company' },

    // Optional: Configure Google Pay (Android only)
    // googlePay: { countryCode: 'US', googleMerchantName: 'My Awesome Company' },

    // Optional: Configure 3D Secure
    // threeDSecure: { exemptionRequested: true }
  };

  // --- Purchase Event Handlers ---
  store.when()
    .approved(transaction => {
      console.log(`Braintree payment approved (Nonce received): ${transaction.transactionId}`);
      // Crucially, the nonce (transaction.transactionId for Braintree)
      // MUST be sent to your server here to create the actual charge.
      // Using verify() assumes your validator endpoint handles this.
      if (store.validator) {
        console.log('Verifying Braintree nonce with validator...');
        transaction.verify();
      } else {
        console.error('VALIDATOR REQUIRED for Braintree payments to process the nonce!');
        // Cannot proceed securely without server-side processing.
      }
    })
    .verified(receipt => {
      // This means your validator successfully processed the nonce
      // with the Braintree gateway (e.g., created a transaction sale).
      console.log('Braintree payment verified and processed server-side.');
      // Now acknowledge the transaction with the plugin
      receipt.finish();
      // Fulfill the order (grant access, ship item, etc.)
      setAppState('PAYMENT_FINISHED'); // Update UI state
    })
    .finished(transaction => {
      console.log(`Braintree transaction finished: ${transaction.transactionId}`);
      // Final cleanup if needed
    });

  // --- Initialize the Plugin ---
  console.log('Initializing store with Braintree platform...');
  store.initialize([{
      platform: Platform.BRAINTREE,
      options: braintreeOptions
  }])
  .then(() => {
      console.log('Braintree platform initialized.');
      // Enable payment buttons in the UI
      const payButton = document.getElementById('pay-button'); // Ensure this exists
      if (payButton) payButton.disabled = false;
      setAppState('BASKET', 'Ready to pay.'); // Update UI state
  })
  .catch(err => {
      console.error('Braintree initialization failed:', err);
      setAppState('BASKET', 'Error initializing payment.'); // Update UI state
  });
}

// Make sure setAppState is defined globally or accessible
// let appState = 'LOADING';
// let appMessage = 'Initializing...';
// function setAppState(state, message) { ... refreshUI(); } // From braintree-refreshUI.js
```
{% endcode %}

We add the standard purchase events handlers for when the transaction is `approved` and the receipt `verified`, with the [`store.when()`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Store.md#when) block.

In our call to [`store.initialize()`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Store.md#initialize), we add in the Braintree platform with its configuration.

In particular, it requires a [Client Token](https://developer.paypal.com/braintree/docs/guides/authorization/client-token) provider. For this example, we'll use the implementation provided by iaptic.

### User interface

You are responsible for creating a user interface that presents the detail concerning the upcoming payment. Let's create a very simple interface.

{% code lineNumbers="true" %}
```javascript
// Global state variables (consider a more robust state management approach for larger apps)
let appState = 'LOADING'; // Initial state
let appMessage = 'Initializing Payment...';

// Function to update the application's UI based on the current state
function refreshUI() {
  const appEl = document.getElementById('app'); // Main container element
  const messagesEl = document.getElementById('messages'); // Element for status messages
  const paymentSectionEl = document.getElementById('payment-section'); // Payment specific section
  const payButtonEl = document.getElementById('pay-button'); // The pay button

  if (!appEl || !messagesEl || !paymentSectionEl || !payButtonEl) {
    console.error('Required UI elements not found in index.html!');
    return;
  }

  console.log(`Refreshing UI - State: ![{appState}, Message: ](<html>
<head><title>405 Not Allowed</title></head>
<body bgcolor="white">
<center><h1>405 Not Allowed</h1></center>
</body>
</html> "{appState}, Message: ")
{appMessage}`);

  // Update status message
  messagesEl.textContent = appMessage;

  // Show/hide/update elements based on state
  switch (appState) {
    case 'LOADING':
      paymentSectionEl.style.display = 'none'; // Hide payment section while loading
      payButtonEl.disabled = true;
      break;

    case 'BASKET':
      paymentSectionEl.style.display = 'block'; // Show payment section
      payButtonEl.disabled = false; // Enable pay button
      payButtonEl.textContent = 'Pay Now';
      break;

    case 'IN_PROGRESS':
    case 'PAYMENT_INITIATED':
    case 'PAYMENT_APPROVED':
      paymentSectionEl.style.display = 'block';
      payButtonEl.disabled = true; // Disable button during processing
      payButtonEl.textContent = 'Processing...';
      break;

    case 'PAYMENT_FINISHED':
      paymentSectionEl.style.display = 'block';
      payButtonEl.disabled = true; // Payment complete, disable button
      payButtonEl.textContent = 'Payment Complete!';
      // Optionally hide the payment section or show a success message elsewhere
      // paymentSectionEl.innerHTML = '<p>Thank you for your purchase!</p>';
      break;

    default:
      // Handle unknown states or errors shown in messagesEl
      paymentSectionEl.style.display = 'block';
      payButtonEl.disabled = true;
      payButtonEl.textContent = 'Pay Now';
      break;
  }
}

// Helper function to update state and trigger UI refresh
function setAppState(newState, message) {
  console.log(`Setting state from ${appState} to ${newState}`);
  appState = newState;
  appMessage = message || ''; // Use provided message or clear it
  refreshUI(); // Update the UI immediately after state change
}

// Initial UI state setup on load (called after initializeStore potentially)
// Ensure this is called appropriately, e.g., after deviceready and potentially after initializeStore resolves/fails
document.addEventListener('deviceready', () => {
    // Set initial state before store initialization might finish
    setAppState('LOADING', 'Initializing Payment...');
}, false);
```
{% endcode %}

This is a primitive state machine that displays the basket, then the progress of the payment flow. While in the basket, the "Proceed to Payment" button calls the `pay()` function.

Let's implement that function.

### Payment request

{% code lineNumbers="true" %}
```javascript
function pay() {
  // Ensure CdvPurchase and its members are available
  if (!window.CdvPurchase) {
    console.error('CdvPurchase is not defined.');
    setAppState('BASKET', 'Error: Payment plugin not loaded.');
    return;
  }
  const { store, Platform, ErrorCode } = CdvPurchase;

  // --- Payment Details ---
  const GADGET_ID = 'REAL_GOOD'; // Example item ID
  const GADGET_TITLE = '1x Real Good';
  const GADGET_PRICE_MICROS = 5990000; // $5.99
  const DELIVERY_ID = 'DELIVERY_STD';
  const DELIVERY_TITLE = 'Standard Delivery';
  const DELIVERY_PRICE_MICROS = 4000000; // $4.00
  const TOTAL_AMOUNT_MICROS = GADGET_PRICE_MICROS + DELIVERY_PRICE_MICROS; // $9.99
  const CURRENCY = 'USD';

  // --- Optional User/Billing Info ---
  const billingInfo = {
    givenName: 'John',
    surname: 'Doe',
    streetAddress1: '123 Braintree St',
    locality: 'Chicago',
    region: 'IL', // State/Province code
    postalCode: '60654',
    countryCode: 'US', // 2-letter ISO code
    // phoneNumber: '15551234567', // Optional
    // email: 'john.doe@example.com' // Optional, can also be passed at top level
  };
  const userEmail = 'john.doe@example.com'; // Optional

  // --- UI Update ---
  setAppState('IN_PROGRESS', 'Processing payment...'); // Update UI state

  // --- Create Payment Request ---
  store.requestPayment({
    // Required fields
    platform: Platform.BRAINTREE,
    items: [{
      id: GADGET_ID,
      title: GADGET_TITLE,
      pricing: { priceMicros: GADGET_PRICE_MICROS } // Currency inferred from top level
    }, {
      id: DELIVERY_ID,
      title: DELIVERY_TITLE,
      pricing: { priceMicros: DELIVERY_PRICE_MICROS }
    }],
    amountMicros: TOTAL_AMOUNT_MICROS, // Total amount
    currency: CURRENCY,

    // Optional fields
    description: GADGET_TITLE, // Description shown in some payment flows
    billingAddress: billingInfo,
    email: userEmail,

  } /*, additionalData can go here if needed */)
  .cancelled(() => {
    console.log('User cancelled Braintree payment flow.');
    setAppState('BASKET', 'Payment cancelled.');
  })
  .failed(error => {
    console.error('Braintree payment failed:', error);
    setAppState('BASKET', `Payment failed: ${error.message}`);
  })
  .initiated(transaction => {
    // Braintree Drop-In UI is likely presented now
    console.log(`Transaction initiated (Drop-In shown): ${transaction.transactionId}`);
    setAppState('PAYMENT_INITIATED', 'Please complete payment...');
  })
  .approved(transaction => {
    // Nonce received from Braintree SDK, needs server processing
    console.log(`Payment approved by Braintree SDK (Nonce: ${transaction.transactionId}). Verifying...`);
    setAppState('PAYMENT_APPROVED', 'Payment approved. Verifying with server...');
    // The initializeStore setup should handle calling transaction.verify() here
  })
  .finished(transaction => {
    // This is called AFTER successful verification AND finish()
    console.log(`Payment finished and acknowledged: ${transaction.transactionId}`);
    // Fulfillment should have happened based on the 'verified' state.
    // setAppState is likely already 'PAYMENT_FINISHED' from the verify handler.
  });
}

// Make sure setAppState is defined globally or accessible
// let appState = 'LOADING';
// let appMessage = 'Initializing...';
// function setAppState(state, message) { ... refreshUI(); } // From braintree-refreshUI.js

```
{% endcode %}

Let's build and test that!