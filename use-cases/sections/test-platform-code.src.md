## Code Implementation

This section explains how to use the `Test` platform adapter for local development and testing without needing actual store accounts or network connectivity to external services.

### Base framework

First, let's set up the basic HTML structure and the initial JavaScript, just like with other platforms.

!INCLUDE "./code-framework.md"

### Initialization

To use the test platform, simply include `Platform.TEST` in your `store.initialize()` call. You can use it alongside other platforms or exclusively for testing.

```javascript
function initializeStore() {
  const { store, Platform, ProductType } = CdvPurchase;

  // Register products available on the Test platform
  store.register([
    // Use a built-in test product
    {
      id: 'test-consumable', // Matches CdvPurchase.Test.testProducts.CONSUMABLE.id
      type: ProductType.CONSUMABLE,
      platform: Platform.TEST
    },
    // Use another built-in test product
    {
      id: 'test-subscription-active', // Matches CdvPurchase.Test.testProducts.PAID_SUBSCRIPTION_ACTIVE.id
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.TEST
    },
    // Define and register a custom test product inline
    {
      id: 'custom-test-nonconsumable',
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.TEST,
      title: 'Unlock My Feature (Test)',
      description: 'A custom non-consumable for testing.',
      pricing: { // Simple pricing, or use PricingPhase[] for subscriptions
        price: '$0.99',
        currency: 'USD',
        priceMicros: 990000
      }
    }
    // ... other products for other platforms can also be registered
  ]);

  // Optionally set a validator if you want to test validation logic
  // The Test adapter provides a mock validator.
  // store.validator = "TEST_VALIDATOR_URL"; // Or use a function

  // Initialize the store, including the Test platform
  store.initialize([Platform.TEST /*, other platforms... */])
    .then(() => {
      console.log('Store ready, including Test platform.');
      refreshUI(); // Update UI after initialization
    });

  // Setup standard event handlers
  store.when()
    .productUpdated(refreshUI)
    .receiptUpdated(refreshUI)
    .approved(transaction => {
      console.log('Test purchase approved: ' + transaction.transactionId);
      // Typically verify, but for Test platform, validation is mocked
      // transaction.verify(); // This would call the mock validator if set
      transaction.finish(); // Finish the transaction
    })
    .verified(receipt => { // Only called if a validator is set
      console.log('Test receipt verified.');
      receipt.finish();
    });
}

// Remember to implement refreshUI() to display products
function refreshUI() {
  // Your UI update logic here...
  // It should iterate through store.products and store.localReceipts/verifiedPurchases
  // and display relevant information and purchase buttons.
  // See examples in other tutorials (e.g., subscription-generic-initialization.md)
  // for UI rendering patterns.
}
```

### Built-in Test Products

The `Test` platform comes with predefined products you can register by ID:

*   **`CdvPurchase.Test.testProducts.CONSUMABLE` (id: `test-consumable`)**: A standard consumable product. Purchase simulation succeeds by default.
*   **`CdvPurchase.Test.testProducts.CONSUMABLE_FAILING` (id: `test-consumable-fail`)**: A consumable product whose purchase simulation will always fail (unless forced via prompt).
*   **`CdvPurchase.Test.testProducts.NON_CONSUMABLE` (id: `test-non-consumable`)**: A standard non-consumable product. Purchase simulation succeeds by default. Can only be "purchased" once per session unless app state is cleared.
*   **`CdvPurchase.Test.testProducts.PAID_SUBSCRIPTION` (id: `test-subscription`)**: A standard auto-renewing subscription. Includes a 3-week trial phase followed by monthly billing. Purchase simulation succeeds by default. Renews every few minutes during the test session.
*   **`CdvPurchase.Test.testProducts.PAID_SUBSCRIPTION_ACTIVE` (id: `test-subscription-active`)**: An auto-renewing subscription that starts in the `APPROVED` state (simulating an existing subscription). Renews every few minutes during the test session.

You register these using their predefined `id` and `type` with `platform: Platform.TEST`. Their title, description, and pricing are predefined within the adapter.

### Custom Test Products

You can define your own test products directly within the `store.register` call, as shown in the initialization example for `custom-test-nonconsumable`.

*   Provide `id`, `type`, and `platform: Platform.TEST`.
*   Optionally provide `title`, `description`, `group`.
*   Provide pricing information using `pricing`:
    *   For simple one-time payments (consumable/non-consumable): `{ price: string, currency: string, priceMicros: number }`
    *   For subscriptions (paid/non-renewing): Use an array of `PricingPhase` objects, similar to how you'd define real product pricing.

Alternatively, use the `CdvPurchase.Test.registerTestProduct()` function *before* `store.register` if you prefer to define them separately.

```javascript
// Defined before store.register
CdvPurchase.Test.registerTestProduct({
  id: 'another-custom-sub',
  type: ProductType.PAID_SUBSCRIPTION,
  platform: Platform.TEST, // platform is actually ignored by registerTestProduct but good practice
  title: 'My Custom Sub',
  pricing: [{ price: '$4.99', currency: 'USD', priceMicros: 4990000, billingPeriod: 'P1M', recurrenceMode: RecurrenceMode.INFINITE_RECURRING, paymentMode: PaymentMode.PAY_AS_YOU_GO }]
});

// Then register it with the store
store.register({
  id: 'another-custom-sub',
  type: ProductType.PAID_SUBSCRIPTION,
  platform: Platform.TEST,
});
```

### Purchase Flow with Test Platform

When you call `store.order(offer)` for a `Test` platform product:

1.  A standard JavaScript `prompt()` dialog appears.
2.  It asks: `Do you want to purchase ${offer.productId} for ${offer.pricingPhases[0].price}? Enter "Y" to confirm. Enter "E" to fail with an error. Anything else to cancel.`
3.  **Entering "Y" (case-insensitive):** Simulates a successful purchase. The transaction moves to the `APPROVED` state, triggering the `.approved()` handler.
4.  **Entering "E" (case-insensitive):** Simulates a purchase failure. The `store.order()` promise rejects with an `IError` (code `ErrorCode.PURCHASE`).
5.  **Entering anything else or cancelling the prompt:** Simulates user cancellation. The `store.order()` promise rejects with an `IError` (code `ErrorCode.PAYMENT_CANCELLED`).

This allows you to test the different outcomes of your purchase flow logic locally.

### Receipt Validation

If you set `store.validator`, the `Test` adapter provides a mock validation function. When `transaction.verify()` is called:
*   It waits for 500ms (simulating network delay).
*   It returns a mock `VerifiedReceipt` based on the local `Transaction` data.
*   It triggers the `.verified()` event handler.

This allows testing of your receipt validation and entitlement logic without needing a real validation server during development.
