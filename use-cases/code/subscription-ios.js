// --- Purchase Action ---
// This function is called by the "Subscribe" or "Switch Plan" buttons in the UI
// Ensure it's globally accessible if called via onclick.
window.subscribe = function(productId, platform, offerId) {
  console.log(`Subscribe button clicked for ${productId}, offer ${offerId} on ${platform}`);
  const { store, Platform, ProductType } = CdvPurchase;

  // Ensure we're acting on the correct platform
  if (platform !== Platform.APPLE_APPSTORE) {
      console.error("This function is currently specific to AppStore!");
      return;
  }

  const product = store.get(productId, Platform.APPLE_APPSTORE);
  const offer = product?.getOffer(offerId); // Get the specific offer

  if (offer) {
      console.log(`Initiating order for offer: ${offer.id} on platform ${offer.platform}`);
      setStatus('Initiating subscription...'); // Assumes setStatus helper exists

      // --- Prepare Additional Data for AppStore ---
      const additionalData = {
          appStore: {
              // Optional: Provide obfuscated applicationUsername (UUID recommended)
              // applicationUsername: 'YOUR_USER_UUID_OR_HASH',

              // Optional: Provide discount details if purchasing a promotional offer
              // discount: {
              //   id: 'PROMO_OFFER_ID_FROM_APPSTORECONNECT',
              //   key: 'YOUR_KEY_ID_FROM_APPSTORECONNECT',
              //   nonce: 'UUID_GENERATED_BY_YOU', // Must be a UUID
              //   signature: 'SIGNATURE_GENERATED_BY_YOUR_SERVER',
              //   timestamp: Date.now().toString() // Milliseconds since epoch
              // }
          }
      };

      offer.order(additionalData)
          .then(result => {
              // Promise resolves when the App Store sheet is dismissed.
              if (result && result.isError) {
                  setStatus(`Subscription failed: ${result.message}`);
              } else {
                  // Purchase flow started... status updated by listeners.
              }
              refreshUI(); // Assumes refreshUI helper exists
          })
          .catch(err => {
               console.error("Unexpected error during subscription order:", err);
               setStatus('Unexpected error during subscription.');
               refreshUI();
          });

  } else {
      console.error(`Cannot subscribe: Product (${productId}) or Offer (${offerId}) not found.`);
      setStatus('Error: Unable to subscribe. Product details missing.');
  }
}

// --- Event Listeners (Ensure these are added in initializeStoreAndSetupListeners) ---
/*
// Inside store.when() chain:
.approved(transaction => {
  // Filter for subscription products if necessary
  const subProduct = transaction.products.find(p => store.get(p.id)?.type === ProductType.PAID_SUBSCRIPTION);
  if (subProduct) {
    console.log(`Approved: ${transaction.transactionId} for ${subProduct.id}`);
    setStatus('Purchase approved. Verifying...');
    if (store.validator) {
      transaction.verify();
    } else {
      console.error("VALIDATOR REQUIRED for subscriptions!");
      setStatus("ERROR: Validator not configured.");
    }
  }
})
.verified(receipt => {
  const subPurchase = receipt.collection.find(p => store.get(p.id)?.type === ProductType.PAID_SUBSCRIPTION);
  if (subPurchase) {
    console.log(`Verified: ${receipt.id} containing ${subPurchase.id}`);
    setStatus('Purchase verified. Finishing...');
    receipt.finish(); // Acknowledge with AppStore
  } else {
     receipt.finish(); // Finish other transactions if any
  }
})
.finished(transaction => {
  const subProduct = transaction.products.find(p => store.get(p.id)?.type === ProductType.PAID_SUBSCRIPTION);
  if (subProduct) {
    console.log(`Finished: ${transaction.transactionId} for ${subProduct.id}`);
    setStatus('Subscription active!');
    refreshUI(); // Refresh subscription status display
  }
})
.cancelled(transaction => {
  const subProduct = transaction.products.find(p => store.get(p.id)?.type === ProductType.PAID_SUBSCRIPTION);
  if (subProduct) {
    console.log('Cancelled:', transaction.transactionId);
    setStatus('Purchase cancelled.');
    refreshUI();
  }
});
*/

// Ensure helpers like setStatus, refreshUI are defined elsewhere.