After implementing the code from the previous sections, you can test the Braintree payment flow.

**Prerequisites:**

1.  **Braintree Sandbox Account:** Ensure you have set up a Braintree Sandbox account.
2.  **Client Token/Tokenization Key:** Your app must be initialized with a valid **Sandbox** Client Token or Tokenization Key. Using production keys will result in real charges or errors.
3.  **Validator Endpoint (Mock or Real):** You need a backend endpoint configured as `store.validator` that can receive the payment nonce from the `.approved()` step. For initial testing, this endpoint could simply log the received nonce and return a successful validation response to allow the `.verified()` and `.finished()` steps to proceed in the app. **Do not fulfill orders based on this mock validation.** Later, implement the actual Braintree `transaction.sale` call on your server.
4.  **Platform Setup:** Build and run the app on a device or emulator (Android or iOS).

**Testing Steps:**

1.  **Launch App:** Start your application. Check the console logs to ensure the Braintree platform initializes successfully and the UI reaches the 'Ready to pay' state.
2.  **Initiate Payment:** Tap the "Pay Now" button in your app.
3.  **Braintree Drop-in UI:** The Braintree Drop-in UI should appear, presenting payment options.
    *   ![](../.gitbook/assets/payment-braintree-1.png)
4.  **Enter Test Card Details:** Select the "Card" option (or another if configured). Use one of Braintree's official test card numbers. A common one for success is:
    *   **Card Number:** `4111 1111 1111 1111`
    *   **Expiry Date:** Any date in the future (e.g., 12/2025)
    *   **CVV:** Any 3 digits (e.g., 123)
    *   **Postal Code:** Any 5 digits (e.g., 12345)
    *   ![](../.gitbook/assets/payment-braintree-2.png)
5.  **Confirm Payment:** Tap the button to submit the payment (e.g., "Pay $XX.XX").
    *   ![](../.gitbook/assets/payment-braintree-3.png)
6.  **Observe App & Logs:**
    *   The Drop-in UI should close.
    *   Your app's status message should update (e.g., "Payment approved. Verifying with server...").
    *   Check console logs for the `approved` event, which includes the payment method nonce (`transaction.transactionId`).
    *   Your validator endpoint should receive a request containing this nonce.
    *   **(If Validator Mocked/Successful):** Your validator returns success. The app logs the `verified` event, calls `receipt.finish()`, logs the `finished` event, and updates the UI to "Payment Successful!".
    *   ![](../.gitbook/assets/payment-braintree-4.png) ![](../.gitbook/assets/payment-braintree-5.png)
7.  **Verify Server (Real Validator):** If using a real validator, check your Braintree Sandbox control panel to confirm that a transaction corresponding to the nonce was successfully created (e.g., status "Submitted for Settlement"). Check your server logs to ensure fulfillment logic was triggered.

**Testing Failures:**

*   Use Braintree's specific test card numbers designed to trigger processor declines (e.g., `4242...` often works, check Braintree docs for current decline cards).
*   Test cancelling the Drop-in UI (should trigger the `.cancelled()` callback in `requestPayment`).
*   Simulate failures in your validator endpoint to test the `.unverified()` handler.

This process allows you to verify the client-side flow and the crucial interaction with your backend for processing the payment nonce.
