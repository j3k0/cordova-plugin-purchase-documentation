// --- Purchase Action ---
// This function is called by the "Subscribe" or "Switch Plan" buttons in the UI
// Ensure it's globally accessible if called via onclick.
window.subscribe = function(productId, platform, offerId) {
  console.log(`Subscribe button clicked for ${productId}, offer ${offerId} on ${platform}`);
  const { store, Platform, ProductType, GooglePlay, Utils } = CdvPurchase; // Get necessary enums/utils

  // Ensure we're acting on the correct platform
  if (platform !== Platform.GOOGLE_PLAY) {
      console.error("This function is currently specific to Google Play!");
      return;
  }

  const product = store.get(productId, Platform.GOOGLE_PLAY);
  const offer = product?.getOffer(offerId);

  if (offer) {
      console.log(`Initiating order for offer: ${offer.id} on platform ${offer.platform}`);
      setStatus('Initiating subscription...'); // Assumes setStatus helper exists

      // --- Prepare Additional Data for Google Play ---
      const additionalData = {
          googlePlay: {
              // Optional: Provide obfuscated user identifiers
              // accountId: store.getApplicationUsername() ? Utils.md5(store.getApplicationUsername()) : undefined,
          }
      };

      // --- Handle Upgrades/Downgrades ---
      // Automatically find the token of an existing subscription in the same group
      const oldToken = store.findOldPurchaseToken(productId, product?.group);
      if (oldToken) {
          console.log(`Found existing subscription in group '${product?.group}'. Setting oldPurchaseToken for upgrade/downgrade.`);
          additionalData.googlePlay.oldPurchaseToken = oldToken;
          // Set the desired replacement mode (optional, defaults often work)
          // Example: Change immediately, prorating the price of the new offer
          additionalData.googlePlay.replacementMode = GooglePlay.ReplacementMode.CHARGE_PRORATED_PRICE;
          // Other modes: DEFERRED, WITH_TIME_PRORATION, WITHOUT_PRORATION, CHARGE_FULL_PRICE
          console.log(`Using replacementMode: ${additionalData.googlePlay.replacementMode}`);
      }

      offer.order(additionalData)
          .then(result => {
              // Promise resolves when the Google Play UI is dismissed.
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

// --- Helper to Find Old Purchase Token (Add this if not already present) ---
// Finds an active, verified subscription in the same group but different product ID.
CdvPurchase.Store.prototype.findOldPurchaseToken = function(newProductId, group) {
  if (!group) return undefined;
  const potentialOldPurchase = this.verifiedPurchases.find(p => {
      const pProduct = this.get(p.id, p.platform);
      return p.platform === Platform.GOOGLE_PLAY
          && pProduct?.type === ProductType.PAID_SUBSCRIPTION
          && pProduct?.group === group
          && p.id !== newProductId
          && !p.isExpired;
  });
  // On Google Play, the purchaseId from validation maps to the purchaseToken
  return potentialOldPurchase?.purchaseId;
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
    receipt.finish(); // Acknowledge with Google Play
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