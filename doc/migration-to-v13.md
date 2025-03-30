# Migrate to v13

Version 13 of the plugin introduces significant breaking changes compared to v11 and earlier. This guide outlines the key differences and how to update your existing code.

**Ionic / Capacitor Users:** Note that `@ionic-native/in-app-purchase-2` is **not compatible** with `cordova-plugin-purchase` v13+. You should remove the Ionic Native wrapper and use the plugin directly via the `CdvPurchase` global namespace (e.g., `CdvPurchase.store`). Ensure you wait for the platform to be ready (`this.platform.ready()` in Ionic) before accessing `CdvPurchase.store`.

## 1. Global Namespace Change

*   **Before:** The plugin exposed its API through the global `window.store` object.
*   **After (v13+):** The API is now under the `window.CdvPurchase` namespace. The main entry point is `CdvPurchase.store`.

**Migration:**

*   **Option A (Recommended):** Replace all instances of `store.` with `CdvPurchase.store.`.
    ```typescript
    // Before
    store.register(...);
    store.when(...);

    // After
    CdvPurchase.store.register(...);
    CdvPurchase.store.when(...);
    ```
*   **Option B (Quick Fix, Less Recommended):** Re-assign the global `store` variable after `deviceready`. This maintains compatibility with old code but pollutes the global scope and might cause type issues if not declared properly.
    ```typescript
    // After deviceready
    window.store = window.CdvPurchase.store;
    // If using TypeScript, add declaration:
    // declare interface Window { store: CdvPurchase.Store; }
    ```

## 2. Initialization and Refreshing

*   **Before:** `store.refresh()` was used ambiguously for initialization, refreshing prices/status, and restoring purchases.
*   **After (v13+):** These actions are split into separate, clearer methods:
    *   [`store.initialize([...platforms])`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Store.md#initialize): **Mandatory first call.** Initializes specified platforms (e.g., `[Platform.APPLE_APPSTORE, Platform.GOOGLE_PLAY]`), loads product details, and fetches initial receipt/purchase status. Call this once after `deviceready`.
    *   [`store.update()`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Store.md#update): Refreshes product pricing and potentially updates local purchase status by communicating with the stores. Use this if you need to refresh prices long after initialization (e.g., when the user enters the store screen). It's rate-limited by default (`store.minTimeBetweenUpdates`) to avoid excessive calls.
    *   [`store.restorePurchases()`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Store.md#restorePurchases): Specifically triggers the platform's restore mechanism (primarily for non-consumables/subscriptions on iOS/AppStore) to retrieve purchases made with the same store account on other devices.

**Migration:**

*   Replace your initial `store.refresh()` call with `store.initialize([...platforms])`. Ensure you pass the platforms you intend to use.
*   If you used `store.refresh()` later to update prices, replace it with `store.update()`.
*   If you used `store.refresh()` specifically for restoring purchases (often via a "Restore Purchases" button), replace it with `store.restorePurchases()`.

## 3. Product Registration

*   **Before:** `store.register({ id, type, alias })`
*   **After (v13+):** `store.register({ id, type, platform })`. The `platform` field (e.g., `CdvPurchase.Platform.APPLE_APPSTORE`) is now **mandatory** to specify which store the product belongs to. The `alias` field has been removed.

**Migration:**

*   Add the correct `platform: CdvPurchase.Platform.XXX` field to each product registration object.
*   Remove the `alias` field if present.

```typescript
// Before
store.register({
  id: 'my_product_ios',
  type: store.NON_CONSUMABLE,
  alias: 'Unlock Feature'
});
store.register({
  id: 'my_product_android',
  type: store.NON_CONSUMABLE,
  alias: 'Unlock Feature'
});

// After
const { store, ProductType, Platform } = CdvPurchase;
store.register([{
  id: 'my_product_ios',
  type: ProductType.NON_CONSUMABLE,
  platform: Platform.APPLE_APPSTORE
}, {
  id: 'my_product_android',
  type: ProductType.NON_CONSUMABLE,
  platform: Platform.GOOGLE_PLAY
}]);
```

## 4. Product Information Refactoring

*   **Before:** The `Product` object mixed metadata (title, price), local purchase state (approved, finished), and validated data (expiryDate, owned).
*   **After (v13+):** Information is separated into distinct objects for clarity and accuracy:
    *   [`Product`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Product.md): Contains store metadata (title, description, offers/pricing). Accessed via `store.products` or `store.get()`.
    *   [`Offer`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Offer.md): Represents a specific pricing option for a product (e.g., monthly vs. annual, introductory vs. regular). Accessed via `product.offers` or `product.getOffer()`. Contains `pricingPhases`.
    *   [`PricingPhase`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/interfaces/CdvPurchase.PricingPhase.md): Details a specific period within an offer (e.g., free trial, intro price, regular price). Contains `price`, `priceMicros`, `currency`, `billingPeriod`, etc.
    *   [`Receipt`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Receipt.md): Represents the purchase data reported *locally* by the device's SDK. Accessed via `store.localReceipts`. Contains `transactions`. **Do not rely solely on this for entitlement.**
    *   [`Transaction`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Transaction.md): Represents a single purchase attempt within a receipt. Contains `transactionId`, `state`, `purchaseDate`, etc.
    *   [`VerifiedReceipt`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.VerifiedReceipt.md): The result from your `store.validator`. Accessed via the `verified` event or `store.verifiedReceipts`. Contains a `collection` of `VerifiedPurchase` objects and is the **trusted source** for entitlement.
    *   [`VerifiedPurchase`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/interfaces/CdvPurchase.VerifiedPurchase.md): Authoritative purchase data from the validator (includes `id`, `purchaseDate`, `expiryDate`, `isExpired`, `renewalIntent`, etc.).

**Migration:**

*   Access metadata like `title`, `description` directly from the `Product` object (`store.get('id', platform).title`).
*   Access pricing via `product.pricing` (for simple cases: `product.offers[0].pricingPhases[0]`) or iterate through `product.offers[].pricingPhases[]` for complex offers/subscriptions.
*   Check local transaction state via `store.findInLocalReceipts(product)?.state`.
*   Check **validated** ownership and expiry via `store.owned(product)` or by inspecting `store.verifiedPurchases`. **Do not rely on local receipts for subscription status or permanent non-consumable unlocks.**

See the table in the main [Migration Guide](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/doc/migration-to-v13.md#product-fields) for a detailed mapping of old fields to new locations.

## 5. Event Handling (`store.when()`)

*   **Before:** `store.when("filter").event(callback)` used filters (product id, type, alias) directly in the `when` call. Events often related directly to a `Product` object that mixed states.
*   **After (v13+):** `store.when().event(callback)`. Filters are removed from `when()`. Events are more specific to the data they relate to (`productUpdated`, `receiptUpdated`, `approved` (for Transaction), `verified` (for VerifiedReceipt), `finished` (for Transaction)).

**Migration:**

*   Remove filters from `when()` calls (e.g., change `store.when('my_product').approved(...)` to `store.when().approved(...)`).
*   Implement filtering logic *inside* your callback functions if needed (check `transaction.products[0].id`, `receipt.collection[0].id`, `product.id`).
*   Adjust callbacks based on the new event signatures (e.g., `approved` receives a `Transaction`, `verified` receives a `VerifiedReceipt`).

```typescript
// Before
store.when("my_product", "approved", (product) => {
  product.verify(); // Called verify on the mixed Product object
});
store.when("my_product", "verified", (product) => {
  product.finish(); // Called finish on the mixed Product object
});
store.when("my_product", "updated", (product) => {
  // update UI based on mixed product state
});

// After (v13+)
const { store } = CdvPurchase;
store.when()
  .approved((transaction) => {
    // Check if this transaction is for the product we care about
    if (transaction.products.some(p => p.id === 'my_product')) {
      console.log('Transaction approved for my_product:', transaction.transactionId);
      transaction.verify(); // Call verify on the Transaction object
    }
  })
  .verified((receipt) => {
    // Check if the verified receipt contains the product we care about
    // Note: A receipt might contain multiple purchases/transactions
    const relevantPurchase = receipt.collection.find(p => p.id === 'my_product');
    if (relevantPurchase) {
        console.log('Receipt verified containing my_product');
        // Grant entitlement based on 'relevantPurchase' data
        // Finish the transaction(s) associated with this receipt
        receipt.finish();
    }
  })
  .productUpdated((product) => {
    // This event is now only for metadata updates (title, price, etc.)
    if (product.id === 'my_product') {
      console.log('Product metadata updated for my_product');
      // update UI display for my_product (price, title...)
    }
  })
  .receiptUpdated((receipt) => {
    // This event reflects changes in local transaction state
    // Check if any transaction for 'my_product' changed state
    receipt.transactions.forEach(transaction => {
        if (transaction.products.some(p => p.id === 'my_product')) {
            console.log(`Local transaction state update for my_product: ${transaction.state}`);
            // Update UI based on local state if needed (e.g., show "Pending")
            // But rely on 'verified' for actual ownership confirmation.
        }
    });
  });
```

*   **`updated` Event:** Split into `productUpdated` (for metadata changes) and `receiptUpdated` (for local purchase data changes). Update your listeners accordingly.
*   **`owned` Event:** Removed. Check ownership status within `verified` or `receiptUpdated` handlers using `store.owned(product)` or by inspecting `store.verifiedPurchases`. See the main [Migration Guide](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/doc/migration-to-v13.md#product-ownership) for strategies.
*   **`error` Event (Product):** Removed. Handle purchase errors via the promise returned by `offer.order()` or `store.requestPayment()`. General plugin errors are still caught by `store.error()`.

## 6. Ordering Products

*   **Before:** `store.order("productId")` or `store.order(product)`
*   **After (v13+):** `offer.order(additionalData?)`. You now order a specific `Offer` object obtained from a `Product`.

**Migration:**

1.  Get the `Product` object: `const product = CdvPurchase.store.get('productId', platform);`
2.  Get the desired `Offer`: `const offer = product?.getOffer();` (or `product?.getOffer('offerId')` if multiple offers exist).
3.  Call order on the offer: `if (offer) offer.order(additionalData);`

## 7. Finishing and Verifying

*   **Before:** `product.verify()` and `product.finish()` were called on the mixed `Product` object.
*   **After (v13+):** Methods are now on `Transaction`, `Receipt`, or `VerifiedReceipt` objects.
    *   `transaction.verify()`: Verifies the specific transaction's receipt data. Typically called in the `approved` handler.
    *   `transaction.finish()`: Finishes/Acknowledges/Consumes the specific transaction.
    *   `receipt.verify()`: Verifies all transactions within the local receipt (less common).
    *   `receipt.finish()`: Finishes all transactions within the local receipt.
    *   `verifiedReceipt.finish()`: Finishes the transaction(s) associated with the verified receipt. Typically called in the `verified` handler.

**Migration:**

*   Typically, you'll call `transaction.verify()` in the `approved` handler and `receipt.finish()` (or `verifiedReceipt.finish()`) in the `verified` handler.

## 8. Enumerations

*   **Before:** Constants were attached directly to the `store` object (e.g., `store.CONSUMABLE`, `store.ERR_SETUP`, `store.DEBUG`).
*   **After (v13+):** Constants are organized into proper enums within the `CdvPurchase` namespace:
    *   `CdvPurchase.ProductType.CONSUMABLE`, `CdvPurchase.ProductType.PAID_SUBSCRIPTION`, etc.
    *   `CdvPurchase.Platform.APPLE_APPSTORE`, `CdvPurchase.Platform.GOOGLE_PLAY`, etc.
    *   `CdvPurchase.ErrorCode.SETUP`, `CdvPurchase.ErrorCode.PURCHASE`, etc.
    *   `CdvPurchase.LogLevel.DEBUG`, `CdvPurchase.LogLevel.INFO`, etc.
    *   `CdvPurchase.TransactionState.APPROVED`, `CdvPurchase.TransactionState.FINISHED`, etc.

**Migration:**

*   Update references to use the new enum syntax (e.g., change `store.CONSUMABLE` to `CdvPurchase.ProductType.CONSUMABLE`).
*   **Backward Compatibility:** For easier migration, the old constants are *currently* still attached to the `store` object as properties (e.g., `CdvPurchase.store.CONSUMABLE`), but using the enums (`CdvPurchase.ProductType.CONSUMABLE`) is strongly recommended for clarity, type safety, and future-proofing.

## 9. Braintree Integration

Version 13 introduces official Braintree support via the `cordova-plugin-purchase-braintree` extension. If you were using previous unofficial Braintree integrations, you'll need to migrate to the new adapter structure, using `store.initialize()` with `Platform.BRAINTREE` and `store.requestPayment()`. Refer to the [Braintree Use Case](https://purchase.cordova.fovea.cc/use-cases/payment-braintree).

---

Review these changes carefully and update your application code accordingly. Test thoroughly after migration, especially the purchase and validation flows. Consult the [API documentation](https://github.com/j3k0/cordova-plugin-purchase/tree/v13/api) for detailed information on the new methods and classes.
