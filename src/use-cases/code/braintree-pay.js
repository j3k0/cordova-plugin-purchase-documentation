// Make this function globally accessible if called from HTML onclick
window.requestBraintreePayment = function() {
  // Ensure CdvPurchase and its members are available
  if (!window.CdvPurchase || !window.CdvPurchase.store) {
    console.error('CdvPurchase is not defined.');
    setAppState('BASKET', 'Error: Payment plugin not loaded.');
    return;
  }
  const { store, Platform, ErrorCode } = CdvPurchase;

  // --- Payment Details (Example) ---
  const GADGET_ID = 'awesome_gadget_01';
  const GADGET_TITLE = 'Awesome Gadget';
  const GADGET_PRICE_MICROS = 19990000; // $19.99
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
  };
  const userEmail = 'john.doe@example.com'; // Optional

  // --- Update UI ---
  setAppState('IN_PROGRESS', 'Initiating payment...'); // Update UI state

  // --- Create and Execute Payment Request ---
  store.requestPayment({
    // Required fields
    platform: Platform.BRAINTREE,
    items: [{
      id: GADGET_ID,
      title: GADGET_TITLE,
      pricing: {
        priceMicros: GADGET_PRICE_MICROS,
        // Currency can be inferred from top level if items don't specify
      }
    }],
    amountMicros: GADGET_PRICE_MICROS, // Total amount for the request
    currency: CURRENCY,

    // Optional fields
    description: `Payment for ${GADGET_TITLE}`, // Shown in some payment flows
    billingAddress: billingInfo,
    email: userEmail,

  } /*, additionalData can go here if needed */)
  .cancelled(() => {
    console.log('User cancelled Braintree payment flow.');
    setAppState('BASKET', 'Payment cancelled.');
  })
  .failed(error => {
    console.error('Braintree payment request failed:', error);
    setAppState('BASKET', `Payment failed: ${error.message}`);
  })
  .initiated(transaction => {
    // Braintree Drop-In UI is likely presented now, or payment flow started.
    console.log(`Transaction initiated (UI shown?): ${transaction.transactionId}`);
    setAppState('PAYMENT_INITIATED', 'Please complete payment...');
  })
  .approved(transaction => {
    // Nonce received from Braintree SDK, needs server processing.
    // The 'initializeStoreAndSetupListeners' function should have registered
    // a store.when().approved() listener that calls transaction.verify().
    // This promise chain primarily handles UI flow and initiation errors.
    console.log(`Payment approved by Braintree SDK (Nonce: ${transaction.transactionId}). Verification should be in progress...`);
    setAppState('PAYMENT_APPROVED', 'Payment approved. Verifying with server...');
  })
  .finished(transaction => {
    // This is called AFTER successful verification AND finish() in the event listener.
    // The UI state should already be 'PAYMENT_FINISHED' set by the .verified listener.
    console.log(`Payment finished and acknowledged (from promise): ${transaction.transactionId}`);
  });
}

// Ensure setAppState is defined globally or accessible
if (typeof setAppState !== 'function') { setAppState = (state, message) => { console.log(`[State] ${state}: ${message}`); refreshUI(); }; }