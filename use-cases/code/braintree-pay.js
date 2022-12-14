function pay() {
  const {store, Platform, ErrorCode} = CdvPurchase;

  // Showing some feedback in the UI (cf refreshUI)
  function setAppState(state, message) {
    appState = state;
    appMessage = message || '';
    refreshUI();
  }

  setAppState('IN_PROGRESS', 'Please wait...');
  store.requestPayment({

    // required fields
    platform: Platform.BRAINTREE,
    amountMicros: 9.99 * 1000000,
    currency: 'USD',
    items: [{
      id: 'REAL_GOOD',
      title: '1x Real Good',
      pricing: {
        priceMicros: 5.99 * 1000000,
      }
    }, {
      id: 'DELIVERY_STD',
      title: 'Standard Delivery',
      pricing: {
        priceMicros: 4.00 * 1000000,
      }
    }],

    // optional fields
    billingAddress: {
      givenName: 'John',
      surname: 'Doe',
      streetAddress1: '1200 3rd Ave',
      locality: 'Seattle',
      region: 'WA',
      postalCode: '98101',
      countryCode: 'US',
    },
    description: '1x Real Good',
    email: 'johndoe@gmail.com',
  })
  .cancelled(() => setAppState('BASKET'))
  .failed(error => setAppState('BASKET', 'Payment failed: ' + error.message))
  .initiated(() => setAppState('PAYMENT_INITIATED'))
  .approved(() => setAppState('PAYMENT_APPROVED'))
  .finished(() => setAppState('PAYMENT_FINISHED'));
}