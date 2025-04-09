This section details the code implementation steps for processing a custom payment using the Braintree platform via `cordova-plugin-purchase` and its Braintree extension.

### 1. Base Framework

First, ensure you have the basic HTML structure and initial JavaScript setup as outlined in the [Code Framework section](/setup/code-framework). This includes waiting for `deviceready` and basic plugin checks.

### 2. Initialization (`initializeStoreAndSetupListeners`)

Next, implement the `initializeStoreAndSetupListeners` function. This involves:
*   Configuring Braintree options, crucially providing a `clientTokenProvider` (recommended) or a `tokenizationKey` (for testing).
*   Setting up the **mandatory** `store.validator`. Your validator endpoint *must* be capable of receiving a Braintree payment method nonce and using the Braintree Server SDK to create a `transaction.sale`.
*   Setting up `store.when()` listeners to handle the `approved` (nonce received), `verified` (server processed nonce successfully), and `finished` (acknowledged) states.
*   Calling `store.initialize()` with the Braintree platform and options.

{% code title="www/js/index.js (initializeStoreAndSetupListeners)" lineNumbers="true" %}
!INCLUDECODE "./code/braintree-initializeStore.js" (javascript)
{% endcode %}

**Explanation:**
*   **Lines 11-15:** Define configuration constants (replace placeholders!).
*   **Lines 21-25:** (Optional) Instantiate Iaptic helper if using it for token/validation.
*   **Lines 28-60:** Define `braintreeOptions`. The `clientTokenProvider` (Lines 30-57) is the recommended way to authorize the client SDK. It fetches a short-lived token from your server. Alternatively, uncomment and use `tokenizationKey` (Line 59) for sandbox testing. Optional Apple Pay/Google Pay/3DS settings can be added here.
*   **Lines 63-66:** **Crucially**, set `store.validator` to your backend endpoint that processes Braintree nonces. Without this, payments cannot be completed.
*   **Lines 69-91:** Set up `store.when()` listeners.
    *   `.approved()`: Triggered when the Braintree SDK successfully generates a nonce. **You must call `transaction.verify()` here** to send the nonce to your validator.
    *   `.verified()`: Triggered after your validator successfully processes the nonce (calls Braintree's `transaction.sale`) and returns a success response. Call `receipt.finish()` here and fulfill the order.
    *   `.unverified()`: Handles validation failures reported by your server.
    *   `.finished()`: Confirms the transaction is fully acknowledged by the plugin.
    *   `.cancelled()`: Handles cancellations from the Drop-in UI (though the `requestPayment` promise `.cancelled()` is often more direct).
*   **Lines 94-110:** Call `store.initialize()` to activate the Braintree adapter. Update UI state based on success or failure.

### 3. User Interface (`refreshUI`)

Implement the `refreshUI` function to display the payment details and update the UI based on the payment state (`LOADING`, `BASKET`, `IN_PROGRESS`, `PAYMENT_INITIATED`, `PAYMENT_APPROVED`, `PAYMENT_FINISHED`).

{% code title="www/js/index.js (refreshUI and state helpers)" lineNumbers="true" %}
!INCLUDECODE "./code/braintree-refreshUI.js" (javascript)
{% endcode %}

**Explanation:**
*   This function manages showing/hiding elements and enabling/disabling the "Pay Now" button based on the `appState` variable.
*   The `setAppState` helper updates the state and calls `refreshUI`.

### 4. Payment Request (`requestBraintreePayment`)

Implement the function triggered by your "Pay Now" button. This function uses `store.requestPayment()` to initiate the Braintree flow.

{% code title="www/js/index.js (requestBraintreePayment)" lineNumbers="true" %}
!INCLUDECODE "./code/braintree-pay.js" (javascript)
{% endcode %}

**Explanation:**
*   **Lines 10-29:** Define payment details (items, total amount, currency) and optional billing/user info.
*   **Line 32:** Update UI state to show processing.
*   **Lines 35-54:** Call `store.requestPayment()` with `platform: Platform.BRAINTREE` and the payment details.
*   **Lines 55-end:** Chain promise handlers to manage the UI state during the payment flow:
    *   `.cancelled()`: User closed the Drop-in UI.
    *   `.failed()`: An error occurred *initiating* the payment request.
    *   `.initiated()`: The Braintree Drop-in UI has likely been presented.
    *   `.approved()`: The Braintree SDK returned a nonce; verification is now happening via the `store.when().approved()` listener setup earlier.
    *   `.finished()`: Called after the entire flow (including verification and `finish()`) is complete.

With these pieces in place, your app can initialize Braintree, display payment options, request a payment, and handle the nonce processing via your backend validator.
