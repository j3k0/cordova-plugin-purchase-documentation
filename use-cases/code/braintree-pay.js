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
