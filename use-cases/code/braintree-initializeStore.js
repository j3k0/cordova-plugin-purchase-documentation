// This function should be called by onDeviceReady after basic setup
function initializeStoreAndSetupListeners() {
  console.log('Setting up store for Braintree...');
  setStatus('Initializing Braintree...');

  // Ensure CdvPurchase and its members are available
  if (!window.CdvPurchase) {
    console.error('CdvPurchase is not defined.');
    setStatus('Error: Payment plugin not loaded.');
    return;
  }
  const { store, Platform, ErrorCode, LogLevel, Iaptic } = CdvPurchase;

  // --- Configuration ---
  // Replace with your actual Iaptic App Name and Public API Key (if using Iaptic)
  const IAPTIC_APP_NAME = 'YOUR_IAPTIC_APP_NAME';
  const IAPTIC_API_KEY = 'YOUR_IAPTIC_PUBLIC_KEY';
  // URL to your backend endpoint that generates Braintree Client Tokens
  const BRAINTREE_CLIENT_TOKEN_URL = 'https://your-server.com/api/braintree/client-token'; // Replace
  // URL to your backend endpoint that processes Braintree nonces
  const BRAINTREE_VALIDATOR_URL = 'https://your-server.com/api/braintree/validate'; // Replace

  // --- Optional: Iaptic Setup (Helper for token generation and validation) ---
  // const iaptic = new Iaptic({ apiKey: IAPTIC_API_KEY, appName: IAPTIC_APP_NAME });

  // --- Braintree Options ---
  const braintreeOptions = {
    // Option 1: Client Token Provider (Recommended)
    clientTokenProvider: (callback) => {
      console.log('Requesting Braintree Client Token from server...');
      setStatus('Requesting client token...');
      // Replace with your actual fetch call to your server endpoint
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
            const err = { code: ErrorCode.COMMUNICATION, message: 'Failed to fetch Braintree client token from server.', isError: true, platform: Platform.BRAINTREE, productId: null };
            callback(err);
            setStatus('Error: Could not get client token.');
          }
        })
        .catch(error => {
          console.error('Error fetching Braintree client token:', error);
          const err = { code: ErrorCode.COMMUNICATION, message: 'Network error fetching Braintree client token: ' + error.message, isError: true, platform: Platform.BRAINTREE, productId: null };
          callback(err);
          setStatus('Error: Network error getting client token.');
        });
    },

    // Option 2: Tokenization Key (Simpler for testing, less secure for production)
    // tokenizationKey: 'YOUR_SANDBOX_TOKENIZATION_KEY', // Replace if using this method

    // Optional configurations (uncomment and configure as needed)
    // applePay: { companyName: 'My Awesome Company' },
    // googlePay: { countryCode: 'US', googleMerchantName: 'My Awesome Company', environment: 'TEST' },
    // threeDSecure: { exemptionRequested: true }
  };

  // --- Setup Receipt Validator (MANDATORY for Braintree) ---
  // Your validator MUST process the payment nonce received from Braintree.
  // It needs to call the Braintree server SDK's transaction.sale() method.
  store.validator = BRAINTREE_VALIDATOR_URL; // Replace with your endpoint
  // store.validator = iaptic.validator; // Or use Iaptic's validator

  // --- Setup Event Handlers ---
  store.when()
    .approved(transaction => {
      // Nonce received from Braintree SDK (stored in transaction.transactionId)
      console.log(`Payment approved by Braintree SDK (Nonce: ${transaction.transactionId}). Verifying...`);
      setStatus('Payment approved. Verifying with server...');
      // Send the nonce to your server for processing via the validator.
      transaction.verify();
    })
    .verified(receipt => {
      // This means your validator successfully processed the nonce
      // with the Braintree gateway (e.g., created a transaction sale).
      console.log('Braintree payment verified and processed server-side.');
      setStatus('Payment Successful!');
      // Now acknowledge the transaction with the plugin
      receipt.finish();
      // Fulfill the order (grant access, ship item, etc.)
      // Update UI state (e.g., show success message)
      setAppState('PAYMENT_FINISHED', 'Payment Successful!');
    })
    .unverified(unverified => {
        console.error('Payment verification failed:', unverified.payload);
        setStatus(`Verification Failed: ${unverified.payload.message}`);
        setAppState('BASKET', `Verification Failed: ${unverified.payload.message}`);
    })
    .finished(transaction => {
      console.log(`Braintree transaction finished: ${transaction.transactionId}`);
      // Final cleanup if needed
    })
    .cancelled(transaction => {
        // Note: Braintree flow cancellation is handled by the requestPayment promise .cancelled()
        console.log('Transaction cancelled (might be from DropIn UI):', transaction.transactionId);
        setStatus('Payment cancelled.');
        setAppState('BASKET', 'Payment cancelled.');
    });
    // No need for productUpdated/receiptUpdated unless mixing with store products

  // --- Initialize the Plugin ---
  console.log('Initializing store with Braintree platform...');
  store.initialize([{
      platform: Platform.BRAINTREE,
      options: braintreeOptions
  }])
  .then((errors) => {
      if (errors && errors.length > 0) {
          console.error('Braintree initialization failed:', errors[0]);
          setStatus(`Error initializing Braintree: ${errors[0].message}`);
          setAppState('BASKET', 'Error initializing payment.');
      } else {
          console.log('Braintree platform initialized.');
          setStatus('Ready to pay.');
          setAppState('BASKET', 'Ready to pay.'); // Update UI state
      }
  });
}

// Ensure setStatus and setAppState are defined (should be in initial script or refreshUI script)
if (typeof setStatus !== 'function') { setStatus = (message) => console.log('[Status] ' + message); }
if (typeof setAppState !== 'function') { setAppState = (state, message) => { console.log(`[State] ${state}: ${message}`); refreshUI(); }; } // Link to refreshUI
