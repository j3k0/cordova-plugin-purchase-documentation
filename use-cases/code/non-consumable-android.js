// --- Purchase Action ---
// This function is called by the "Unlock" button in the UI (from non-consumable-generic-initialization.js)
// Ensure it's globally accessible if called via onclick.
window.purchaseFeature = function() {
  const productId = 'unlock_premium_feature'; // Use the SAME product ID registered in generic init
  console.log(`Purchase button clicked for Android non-consumable: ${productId}`);
  const { store, Platform } = CdvPurchase;

  const product = store.get(productId, Platform.GOOGLE_PLAY);
  const offer = product?.getOffer();

  if (offer) {
      console.log(`Initiating order for non-consumable offer: ${offer.id} on platform ${offer.platform}`);
      setStatus('Initiating purchase...'); // Assumes setStatus helper exists

      // Optional: Add obfuscated account/profile IDs
      // const additionalData = { googlePlay: { accountId: 'hashed_user_id' } };
      // offer.order(additionalData)
      offer.order()
          .then(result => {
              // Promise resolves when the Google Play UI is dismissed.
              // Outcome handled by listeners.
              if (result && result.isError) {
                  setStatus(`Order failed: ${result.message}`);
              } else {
                  // Purchase flow started... status updated by listeners.
              }
              refreshUI(); // Assumes refreshUI helper exists
          })
          .catch(err => {
               console.error("Unexpected error during non-consumable order:", err);
               setStatus('Unexpected error during purchase.');
               refreshUI();
          });
  } else {
      console.error(`Cannot purchase feature: Product (${productId}) or offer not found.`);
      setStatus('Error: Unable to purchase. Product details missing.');
  }
}

// --- Granting and Acknowledgment Logic ---
// This function should replace the placeholder in non-consumable-generic-initialization.js
// It's called by the .approved (if no validator) or .verified listener.
function acknowledgeFeatureAndFinish(transaction) {
  const productId = transaction.products[0]?.id;
  if (productId !== 'unlock_premium_feature') return; // Ensure it's the correct product

  // Grant the entitlement if not already granted
  const isUnlocked = isFeatureUnlocked(); // Assumes function from generic init exists

  if (isUnlocked) {
      console.log(`Feature already unlocked, acknowledging transaction ${transaction.transactionId} again just in case.`);
  } else {
      console.log(`Unlocking feature for transaction ${transaction.transactionId}...`);
      // Persist the unlock status SECURELY (use SecureStorage, not localStorage)
      try {
          window.localStorage.setItem(FEATURE_KEY, 'YES'); // INSECURE EXAMPLE - Assumes FEATURE_KEY defined
          console.log('Ownership flag set in localStorage.');
      } catch (e) {
          console.error('Error saving ownership to localStorage:', e);
      }
      // Refresh the UI immediately to show the unlocked state
      refreshUI(); // Assumes refreshUI helper exists
      // alert('Feature Unlocked! Thank you.'); // Optional user feedback
  }

  // Acknowledge the purchase with Google Play.
  // This is CRUCIAL for non-consumables on Android to prevent refunds within 3 days.
  // It tells Google you have successfully processed the purchase.
  if (!transaction.isAcknowledged) {
      console.log(`Acknowledging (finishing) transaction ${transaction.transactionId}...`);
      transaction.finish();
  } else {
      console.log(`Transaction ${transaction.transactionId} already acknowledged.`);
  }
}

// --- Event Listeners (Ensure these are added in initializeStoreAndSetupListeners) ---
/*
// Inside store.when() chain:
.approved(transaction => {
  if (transaction.products[0]?.id === 'unlock_premium_feature') { // Filter
    console.log(`Approved: ${transaction.transactionId}`);
    setStatus('Purchase approved. Verifying...');
    if (store.validator) {
      transaction.verify();
    } else {
      acknowledgeFeatureAndFinish(transaction);
    }
  }
})
.verified(receipt => {
  const verifiedTransaction = receipt.transactions.find(t => t.products[0]?.id === 'unlock_premium_feature');
  if (verifiedTransaction) {
    console.log(`Verified: ${verifiedTransaction.transactionId}`);
    setStatus('Purchase verified. Finishing...');
    acknowledgeFeatureAndFinish(verifiedTransaction);
  } else {
     receipt.finish(); // Finish other transactions if any
  }
})
.finished(transaction => {
  if (transaction.products[0]?.id === 'unlock_premium_feature') {
    console.log(`Finished: ${transaction.transactionId}`);
    setStatus('Purchase complete! Feature unlocked.');
    refreshUI(); // Refresh UI to show unlocked state
  }
})
.cancelled(transaction => {
  if (transaction.products[0]?.id === 'unlock_premium_feature') {
    console.log('Cancelled:', transaction.transactionId);
    setStatus('Purchase cancelled.');
    refreshUI();
  }
});
*/

// Ensure helpers like setStatus, refreshUI, FEATURE_KEY, isFeatureUnlocked are defined elsewhere.