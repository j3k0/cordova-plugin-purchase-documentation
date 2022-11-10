function initializeStore() {
  const {store, Platform, Iaptic} = CdvPurchase;

  // create the link with Iaptic
  const iaptic = new Iaptic({
    apiKey: 'ffff0000ffff0000ffff0000',
    appName: 'my.app',
  });
  store.validator = iaptic.validator;

  // purchase events handlers
  store.when()
    .approved(transaction => transaction.verify())
    .verified(receipt => receipt.finish());

  // initialize the plugin with Braintree support
  store.initialize([{
      platform: Platform.BRAINTREE,
      options: {
        clientTokenProvider: iaptic.braintreeClientTokenProvider,
      }
  }]);
}