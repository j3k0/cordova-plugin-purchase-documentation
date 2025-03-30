# Using the Test Platform

The `cordova-plugin-purchase` includes a built-in "Test" platform adapter. This adapter simulates basic in-app purchase flows without connecting to any real payment platform like App Store or Google Play.

**Purpose:**

*   **Development & Debugging:** Quickly test your purchase UI and basic logic integration without needing fully configured platform accounts or test devices.
*   **Demonstration:** Show purchase flows without actual payments.
*   **Automated Testing:** Potentially useful for setting up automated tests of your purchase logic (though limited).

**Limitations:**

*   **No Real Payments:** Does not involve any actual financial transactions.
*   **No Receipt Validation:** Cannot simulate server-side receipt validation. The `verify()` call on the Test platform provides a mock successful response.
*   **Simplified Behavior:** Simulates basic states (approved, finished) but doesn't replicate complex platform behaviors like pending purchases (Ask to Buy, cash payments), detailed renewal intents, or specific error conditions accurately.
*   **Predefined Products:** Uses a set of predefined products (or custom ones you register) rather than loading from a real store.

## Setup

1.  **Install Plugin:**
    ```bash
    cordova plugin add cordova-plugin-purchase
    ```

2.  **Initialize the Test Platform:**
    In your `deviceready` handler, initialize the store specifically with the `Platform.TEST`.

    ```javascript
    document.addEventListener('deviceready', initTestStore, false);

    function initTestStore() {
        const { store, Platform, ProductType, ErrorCode } = CdvPurchase;

        if (!store) { console.error("Store not available"); return; }

        // Optional: Set verbosity for detailed logs
        store.verbosity = LogLevel.DEBUG;

        // Log errors
        store.error(err => console.error("STORE ERROR: " + err.code + " " + err.message));

        // --- Register Test Products ---
        // You MUST register the test products you intend to use.
        store.register([
            // Use built-in test products
            CdvPurchase.Test.testProducts.CONSUMABLE,
            CdvPurchase.Test.testProducts.CONSUMABLE_FAILING,
            CdvPurchase.Test.testProducts.NON_CONSUMABLE,
            CdvPurchase.Test.testProducts.PAID_SUBSCRIPTION,
            CdvPurchase.Test.testProducts.PAID_SUBSCRIPTION_ACTIVE, // Starts as 'owned'

            // Or register your own custom test product definitions
             {
               id: 'my_custom_test_consumable',
               type: ProductType.CONSUMABLE,
               platform: Platform.TEST,
               // Optional metadata for the test product:
               title: 'My Test Coins',
               description: '100 test coins for development.',
               pricing: { price: '$0.99', currency: 'USD', priceMicros: 990000 }
             }
        ]);

        // --- Setup Event Handlers ---
        store.when()
            .productUpdated(p => console.log('Product updated: ' + p.id + ' title: ' + p.title))
            .approved(transaction => {
                console.log('Approved: ' + transaction.products[0].id);
                // Simulate verification (always succeeds)
                transaction.verify();
            })
            .verified(receipt => {
                console.log('Verified: ' + receipt.id);
                receipt.finish(); // Finish the transaction
            })
            .finished(transaction => {
                console.log('Finished: ' + transaction.transactionId);
                // Update UI based on ownership
            });

        // Initialize ONLY the Test platform
        store.initialize([Platform.TEST])
            .then(() => {
                console.log('Test Store initialized!');
                // Products are now loaded, you can display them
                console.log('Products: ' + JSON.stringify(store.products));
            });
    }
    ```
    See `CdvPurchase.Test.testProducts` for available built-in products and `CdvPurchase.Test.registerTestProduct` for creating custom ones.

## Simulating Purchases

When you call `offer.order()` for a product on the Test platform:

1.  A `prompt()` dialog will appear asking for confirmation (`Y` to approve, `E` to fail, anything else to cancel).
2.  If approved (`Y`), the `approved` event fires.
3.  Calling `transaction.verify()` immediately triggers the `verified` event (no actual validation occurs).
4.  Calling `receipt.finish()` triggers the `finished` event.

**Specific Behaviors:**

*   `CdvPurchase.Test.testProducts.CONSUMABLE_FAILING`: Ordering this product will simulate a purchase failure (like entering `E` in the prompt).
*   `CdvPurchase.Test.testProducts.PAID_SUBSCRIPTION_ACTIVE`: This product starts in the `owned` state. It simulates renewals roughly every 2 minutes (check logs).
*   `CdvPurchase.Test.testProducts.PAID_SUBSCRIPTION`: Behaves like a normal subscription; purchasing it makes it `owned`, and it simulates renewals.

## Use Cases

*   Quickly prototype your store UI and purchase flow logic.
*   Debug event handling (`approved`, `verified`, `finished`, `productUpdated`).
*   Test scenarios like purchasing consumables, unlocking non-consumables, or subscribing/unsubscribing (simulated).

**Remember:** Always test thoroughly on real devices with actual platform sandbox/test accounts before release. The Test platform is a development tool, not a substitute for real-world testing.