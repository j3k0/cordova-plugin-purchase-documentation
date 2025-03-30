// --- Purchase Action ---
// Replace the placeholder purchaseNonRenewing function
window.purchaseNonRenewing = function() {
  const productId = 'non_renewing_1_month'; // Use the SAME product ID you registered
  console.log(`Purchase button clicked for non-renewing: ${productId}`);
  const { store, Platform } = CdvPurchase;

  const product = store.get(productId, Platform.GOOGLE_PLAY);
  const offer = product?.getOffer();

  if (offer) {
      console.log(`Initiating order for non-renewing offer: ${offer.id}`);
      setStatus('Initiating purchase...');

      // const additionalData = { googlePlay: { accountId: 'hashed_user_id' } };
      // offer.order(additionalData)
      offer.order()
          .then(result => {
              if (result && result.isError) {
                  setStatus(`Order failed: ${result.message}`);
              } else {
                  // Purchase flow started... status updated by listeners.
              }
              refreshUI();
          })
          .catch(err => {
               console.error("Unexpected error during non-renewing order:", err);
               setStatus('Unexpected error during purchase.');
               refreshUI();
          });
  } else {
      console.error(`Cannot purchase: Product (${productId}) or offer not found.`);
      setStatus('Error: Unable to purchase. Product details missing.');
  }
}

// --- Event Listeners (Add these inside store.when() in initializeStoreAndSetupListeners) ---
/*
.approved(transaction => {
  console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
  setStatus('Purchase approved. Verifying...');
  // Verify if a validator is configured (optional but recommended for purchaseDate)
  if (store.validator) {
    transaction.verify();
  } else {
    console.warn("Receipt validator not configured. Using local date for expiry calculation.");
    grantAccessAndAcknowledge(transaction); // Proceed without validation
  }
})
.verified(receipt => {
  console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
  setStatus('Purchase verified. Finishing...');
  const verifiedTransaction = receipt.transactions.find(t => t.products[0]?.id === MY_NON_RENEWING_ID);
  if (verifiedTransaction) {
    grantAccessAndAcknowledge(verifiedTransaction); // Use verified transaction data
  } else {
    console.error("Verified receipt didn't contain the expected transaction?");
    receipt.finish(); // Finish anyway
  }
})
.finished(transaction => {
  console.log(`Transaction ${transaction.transactionId} finished (acknowledged) for ${transaction.products[0]?.id}.`);
  setStatus('Purchase complete! Access updated.');
  refreshUI(); // Refresh expiry display
})
.cancelled(transaction => {
  console.log('Purchase Cancelled:', transaction.transactionId);
  setStatus('Purchase cancelled.');
  refreshUI();
});
*/

// --- Granting and Acknowledgment Logic ---
// Replace the placeholder grantAccessAndFinish function
function grantAccessAndAcknowledge(transaction) {
  const productId = transaction.products[0]?.id;
  if (productId !== MY_NON_RENEWING_ID) return; // Ensure correct product

  console.log(`Granting access for non-renewing subscription ${productId}, transaction ${transaction.transactionId}...`);

  // 1. Determine duration based on productId (e.g., from product metadata or a config map)
  // For this example, assume MY_NON_RENEWING_ID ('non_renewing_1_month') grants 1 month.
  let durationMonths = 0;
  if (productId === 'non_renewing_1_month') {
      durationMonths = 1;
  } // Add else if for other durations (e.g., 'non_renewing_1_year')

  if (durationMonths === 0) {
      console.error(`Unknown duration for product ${productId}. Cannot grant access.`);
      if (!transaction.isAcknowledged) transaction.finish(); // Acknowledge anyway
      return;
  }

  // 2. Get purchase date (verified date is preferred, fallback to transaction date or now)
  const purchaseDate = transaction.purchaseDate || new Date();

  // 3. Calculate new expiry date (handle extending existing access)
  const currentExpiry = getAccessExpiryDate(); // Function from generic init
  const startDateMs = Math.max(Date.now(), currentExpiry ? currentExpiry.getTime() : 0);
  const newExpiryDate = new Date(startDateMs);
  newExpiryDate.setMonth(newExpiryDate.getMonth() + durationMonths);

  console.log(`Purchase Date: ${purchaseDate.toISOString()}`);
  console.log(`Current Expiry: ${currentExpiry?.toISOString() ?? 'None'}`);
  console.log(`Calculated New Expiry: ${newExpiryDate.toISOString()} (Duration: ${durationMonths} months)`);

  // 4. Store the new expiry date persistently (Use SecureStorage in production!)
  try {
      window.localStorage.setItem(ACCESS_EXPIRY_KEY, newExpiryDate.toISOString());
      console.log('Expiry date saved to localStorage.');
  } catch (e) {
      console.error('Error saving expiry to localStorage:', e);
  }

  // 5. Refresh UI immediately
  refreshUI(); // Function from generic init
  // alert(`Access granted/extended until ${newExpiryDate.toLocaleDateString()}!`);

  // 6. Acknowledge the purchase with Google Play by calling finish()
  // This is MANDATORY within 3 days to prevent automatic refunds.
  // Do NOT consume non-renewing subscriptions.
  if (!transaction.isAcknowledged) {
      console.log(`Acknowledging (finishing) transaction ${transaction.transactionId}...`);
      transaction.finish();
  } else {
      console.log(`Transaction ${transaction.transactionId} already acknowledged.`);
  }
}