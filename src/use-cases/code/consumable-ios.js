// --- Purchase Action ---
// This function is called by the "Buy" button in the UI (from consumable-generic-initialization.js)
// Ensure it's globally accessible if called via onclick.
window.buyConsumable = function() {
  const productId = 'consumable1'; // Use the SAME product ID registered in generic init
  console.log(`Purchase button clicked for iOS consumable: ${productId}`);
  const { store, Platform } = CdvPurchase;

  const product = store.get(productId, Platform.APPLE_APPSTORE);
  const offer = product?.getOffer();

  if (offer) {
      console.log(`Initiating order for consumable offer: ${offer.id} on platform ${offer.platform}`);
      setStatus('Initiating purchase...'); // Assumes setStatus helper exists

      offer.order()
          .then(result => {
              // Promise resolves when the App Store sheet is dismissed.
              // Outcome handled by listeners.
              if (result && result.isError) {
                  setStatus(`Order failed: ${result.message}`);
              } else {
                  // Purchase flow started... status updated by listeners.
              }
              refreshUI(); // Assumes refreshUI helper exists
          })
          .catch(err => {
               console.error("Unexpected error during consumable order:", err);
               setStatus('Unexpected error during purchase.');
               refreshUI();
          });
  } else {
      console.error(`Cannot purchase: Product (${productId}) or offer not found.`);
      setStatus('Error: Unable to purchase. Product details missing.');
  }
}

// --- Granting and Finishing Logic ---
// This function should replace the placeholder in consumable-generic-initialization.js
// It's called by the .approved (if no validator) or .verified listener.
function grantConsumableAndFinish(transaction) {
  const productId = transaction.products[0]?.id;
  if (productId !== 'consumable1') return; // Ensure it's the correct product

  console.log(`Granting consumable for transaction ${transaction.transactionId}...`);

  // Determine the quantity (always 1 for App Store consumables)
  const quantity = 1;
  const coinsToAdd = COINS_GRANTED * quantity; // Assumes COINS_GRANTED is defined globally

  // Add the item(s) to the user's inventory/balance (using insecure localStorage for example)
  const currentCoins = parseInt(window.localStorage.getItem(COIN_BALANCE_KEY) || '0', 10); // Assumes COIN_BALANCE_KEY defined
  window.localStorage.setItem(COIN_BALANCE_KEY, (currentCoins + coinsToAdd).toString());
  console.log(`Added ${coinsToAdd} coins. New balance: ${currentCoins + coinsToAdd}`);
  // refreshUI(); // Update UI immediately (optional, .finished also calls it)

  // Finish (consume) the transaction with the App Store.
  // This removes it from the payment queue and allows repurchase.
  if (transaction.state !== CdvPurchase.TransactionState.FINISHED) {
      console.log(`Finishing transaction ${transaction.transactionId}...`);
      transaction.finish();
  } else {
       console.log(`Transaction ${transaction.transactionId} already finished.`);
  }
}

// --- Event Listeners (Ensure these are added in initializeStoreAndSetupListeners) ---
/*
// Inside store.when() chain:
.approved(transaction => {
  if (transaction.products[0]?.id === 'consumable1') { // Filter for the correct product
    console.log(`Approved: ${transaction.transactionId}`);
    setStatus('Purchase approved. Verifying...');
    if (store.validator) {
      transaction.verify();
    } else {
      grantConsumableAndFinish(transaction);
    }
  }
})
.verified(receipt => {
  const verifiedTransaction = receipt.transactions.find(t => t.products[0]?.id === 'consumable1');
  if (verifiedTransaction) {
    console.log(`Verified: ${verifiedTransaction.transactionId}`);
    setStatus('Purchase verified. Finishing...');
    grantConsumableAndFinish(verifiedTransaction);
  } else {
     receipt.finish(); // Finish other transactions if any
  }
})
.finished(transaction => {
  if (transaction.products[0]?.id === 'consumable1') {
    console.log(`Finished: ${transaction.transactionId}`);
    setStatus('Purchase complete! Coins granted.');
    refreshUI(); // Refresh balance display & button state
  }
})
.cancelled(transaction => {
  if (transaction.products[0]?.id === 'consumable1') {
    console.log('Cancelled:', transaction.transactionId);
    setStatus('Purchase cancelled.');
    refreshUI();
  }
});
*/

// Ensure helpers like setStatus, refreshUI, COIN_BALANCE_KEY, COINS_GRANTED are defined elsewhere.