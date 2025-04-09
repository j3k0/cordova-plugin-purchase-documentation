## Code Implementation

This section explains how to use the `Test` platform adapter for local development and testing without needing actual store accounts or network connectivity to external services.

### 1. Base Framework

Ensure you have the basic HTML structure and initial JavaScript setup (waiting for `deviceready`, basic plugin checks, `setStatus` helper, placeholder functions) as outlined in the Code Framework section.

!INCLUDE "./code-framework.src.md"

### 2. Initialization (`initializeStoreAndSetupListeners`)

Implement the `initializeStoreAndSetupListeners` function to configure and initialize the Test platform. This involves registering test products and setting up event listeners.

{% code title="www/js/index.js (initializeStoreAndSetupListeners)" lineNumbers="true" %}
!INCLUDECODE "./code/test-platform-initialization.js" (javascript)
{% endcode %}

**Explanation:**

*   **Register Test Products (Lines 11-65):**
    *   You **must** register any product ID you want to use with `Platform.TEST`.
    *   You can use built-in product definitions like `CdvPurchase.Test.testProducts.CONSUMABLE` (Lines 15-24) for convenience. See the code comments or API docs for available built-in products (`CONSUMABLE`, `NON_CONSUMABLE`, `PAID_SUBSCRIPTION`, `PAID_SUBSCRIPTION_ACTIVE`, `CONSUMABLE_FAILING`).
    *   You can also define **custom test products** directly within `store.register` (Lines 27-65). Provide `id`, `type`, `platform: Platform.TEST`, and optionally `title`, `description`, and `pricing`. The `pricing` can be a simple object for one-time purchases or an array of `PricingPhase` objects for subscriptions.
*   **Mock Validator (Lines 68-72):** If you set `store.validator` to any non-empty string (e.g., `"TEST_VALIDATOR"`), the Test platform will simulate a successful validation response after a 500ms delay when `transaction.verify()` is called. This allows you to test the `.verified()` event flow.
*   **Event Listeners (Lines 75-100):** Basic listeners are set up:
    *   `productUpdated`: Refreshes the UI when product details are ready.
    *   `approved`: Calls `transaction.verify()` (which triggers the mock validation if enabled).
    *   `verified`: Calls `receipt.finish()` to complete the transaction.
    *   `finished`: Calls functions to grant the item (`grantCoins` or `grantEntitlement`) and refreshes the UI.
    *   `cancelled`: Updates the status message.
*   **Initialize Store (Lines 103-112):** Calls `store.initialize([Platform.TEST])` to activate *only* the Test adapter.

### 3. Purchase Flow (`buyTestProduct`)

Implement the function called by your "Buy" buttons to initiate a test purchase using `offer.order()`.

{% code title="www/js/index.js (buyTestProduct)" lineNumbers="true" %}
!INCLUDECODE "./code/test-platform-purchase.js" (javascript)
{% endcode %}

**Explanation:**

*   **Get Offer (Lines 6-8):** Retrieves the product and its default offer.
*   **Call `offer.order()` (Line 14):** This is the key call to start the purchase simulation.
*   **Prompt Interaction (Lines 30-42):** When `offer.order()` runs for `Platform.TEST`:
    *   A standard JavaScript `prompt()` dialog appears.
    *   It asks the user to confirm (`Y`), fail (`E`), or cancel.
    *   **"Y"**: Simulates approval -> triggers `.approved()` listener.
    *   **"E"**: Simulates failure -> triggers global `store.error()` handler.
    *   **Cancel/Other**: Simulates cancellation -> triggers `.cancelled()` listener.
*   **Promise Handling (Lines 15-28):** The promise returned by `order()` resolves/rejects quickly after the prompt is dismissed, mainly indicating if the *request* was initiated or immediately failed/cancelled. The final purchase *outcome* is handled by the event listeners.

This setup allows you to test the full client-side purchase lifecycle locally using simple prompts for interaction. Remember to replace the Test platform logic with real platform adapters and server-side validation for production.
