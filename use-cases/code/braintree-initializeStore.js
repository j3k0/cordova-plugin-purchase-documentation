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