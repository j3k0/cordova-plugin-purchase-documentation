// This function is called by the "Buy" buttons in the UI
window.buyTestProduct = function(productId) {
  console.log(`Buy button clicked for test product: ${productId}`);
  const { store, Platform, ErrorCode } = CdvPurchase;

  const product = store.get(productId, Platform.TEST);
  const offer = product?.getOffer(); // Get the default offer

  if (offer) {
    setStatus(`Initiating purchase for ${productId}...`);
    console.log(`Ordering offer: ${offer.id}`);

    offer.order()
      .then(result => {
        // Promise resolves when the prompt() is dismissed or if there's an immediate error.
        // The final outcome (approved, cancelled, failed) is handled by the event listeners.
        if (result && result.isError) {
          // This typically catches errors *before* the prompt, like "cannot purchase".
          // The prompt interaction itself usually triggers listeners, not this promise rejection.
          setStatus(`Order failed: ${result.message}`);
        } else {
          // Order initiated, waiting for user interaction with the prompt...
          // Status will be updated by .approved, .cancelled, or .error listeners.
        }
        refreshUI(); // Refresh UI, e.g., disable button temporarily
      })
      .catch(err => {
        // Catch unexpected errors during order initiation
        console.error(`Unexpected error ordering ${productId}:`, err);
        setStatus('Unexpected error during purchase.');
        refreshUI();
      });

  } else {
    console.error(`Cannot purchase: Product (${productId}) or offer not found.`);
    setStatus('Error: Unable to purchase. Product/Offer missing.');
  }
}

// --- Explanation of the Prompt ---
/*
When offer.order() is called for Platform.TEST, the following happens:

1. A JavaScript `prompt()` dialog appears in the browser/WebView.
2. The prompt message asks:
   `Do you want to purchase ${productId} for ${price}? Enter "Y" to confirm. Enter "E" to fail with an error. Anything else to cancel.`
3. User Interaction:
   - Entering "Y" (case-insensitive) and clicking OK: Simulates a successful purchase approval. The `.approved()` event listener will be triggered shortly after.
   - Entering "E" (case-insensitive) and clicking OK: Simulates a purchase failure. The global `store.error()` handler will be triggered with an ErrorCode.PURCHASE error.
   - Clicking "Cancel" or entering anything else and clicking OK: Simulates the user cancelling the purchase. The `.cancelled()` event listener will be triggered.
*/

// Ensure setStatus and refreshUI are defined (should be in initialization script)
if (typeof setStatus !== 'function') { setStatus = (message) => console.log('[Status] ' + message); }
if (typeof refreshUI !== 'function') { refreshUI = () => console.log('Placeholder: refreshUI()'); }
