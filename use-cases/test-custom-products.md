# Custom Test Products

The Test platform adapter comes with a set of built-in products for quick testing, but you can also register your own custom products with specific IDs, types, titles, and pricing. This lets you test your application's UI and purchase logic with product definitions that match your real store products.

**Availability:** v13.12.0+

## Registering Custom Products

There are two ways to register custom test products.

### Option 1: Inline registration with `store.register`

Pass the custom metadata directly in the registration call:

```javascript
const { store, ProductType, Platform } = CdvPurchase;

store.register([{
    id: 'my-gems-pack',
    type: ProductType.CONSUMABLE,
    platform: Platform.TEST,
    title: '100 Gems',
    description: 'A pack of 100 gems for your adventure',
    pricing: {
        price: '$1.99',
        currency: 'USD',
        priceMicros: 1990000
    }
}]);
```

### Option 2: Pre-register with `registerTestProduct`

Use `CdvPurchase.Test.registerTestProduct()` to define the product before calling `store.register()`:

```javascript
const { store, ProductType, Platform, Test } = CdvPurchase;

// Define the custom product
Test.registerTestProduct({
    id: 'premium-annual',
    type: ProductType.PAID_SUBSCRIPTION,
    title: 'Premium Annual',
    description: 'Premium access for one year',
    pricing: [{
        price: '$29.99',
        priceMicros: 29990000,
        currency: 'USD',
        billingPeriod: 'P1Y',
        recurrenceMode: 'INFINITE_RECURRING',
        paymentMode: 'PayAsYouGo'
    }]
});

// Then register it with the store
store.register([{
    id: 'premium-annual',
    type: ProductType.PAID_SUBSCRIPTION,
    platform: Platform.TEST
}]);
```

## Pricing Formats

Custom products accept two pricing formats:

### Simple pricing (one-time products)

```javascript
pricing: {
    price: '$4.99',
    currency: 'USD',
    priceMicros: 4990000
}
```

### Pricing phases (subscriptions)

```javascript
pricing: [
    {
        price: '$0.00',
        priceMicros: 0,
        currency: 'USD',
        billingPeriod: 'P1W',
        recurrenceMode: 'FINITE_RECURRING',
        billingCycles: 1,
        paymentMode: 'FreeTrial'
    },
    {
        price: '$9.99',
        priceMicros: 9990000,
        currency: 'USD',
        billingPeriod: 'P1M',
        recurrenceMode: 'INFINITE_RECURRING',
        paymentMode: 'PayAsYouGo'
    }
]
```

This defines a subscription with a 1-week free trial followed by $9.99/month.

## Built-in Test Products

For reference, the Test adapter includes these built-in products that you can use without custom registration:

| Constant | ID | Type | Behavior |
|----------|----|------|----------|
| `Test.testProducts.CONSUMABLE` | `test-consumable` | Consumable | Normal purchase flow |
| `Test.testProducts.NON_CONSUMABLE` | `test-non-consumable` | Non-Consumable | Normal purchase flow |
| `Test.testProducts.PAID_SUBSCRIPTION` | `test-subscription` | Paid Subscription | Normal purchase flow |
| `Test.testProducts.PAID_SUBSCRIPTION_ACTIVE` | `test-subscription-active` | Paid Subscription | Starts as active immediately |
| `Test.testProducts.CONSUMABLE_FAILING` | `test-consumable-fail` | Consumable | Simulates purchase failure |

To use a built-in product:

```javascript
store.register([{
    ...CdvPurchase.Test.testProducts.CONSUMABLE,
    platform: CdvPurchase.Platform.TEST
}]);
```

## Complete Example

```javascript
const { store, ProductType, Platform, LogLevel } = CdvPurchase;

store.verbosity = LogLevel.DEBUG;

// Register a mix of custom and built-in test products
store.register([
    // Custom consumable matching your real product
    {
        id: 'gems_100',
        type: ProductType.CONSUMABLE,
        platform: Platform.TEST,
        title: '100 Gems',
        description: 'Buy 100 gems',
        pricing: { price: '$0.99', currency: 'USD', priceMicros: 990000 }
    },
    // Custom subscription matching your real product
    {
        id: 'premium_monthly',
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.TEST,
        title: 'Premium Monthly',
        description: 'Monthly premium access',
        pricing: [{
            price: '$4.99',
            priceMicros: 4990000,
            currency: 'USD',
            billingPeriod: 'P1M',
            recurrenceMode: 'INFINITE_RECURRING',
            paymentMode: 'PayAsYouGo'
        }]
    },
    // Built-in product for quick testing
    {
        ...CdvPurchase.Test.testProducts.CONSUMABLE_FAILING,
        platform: Platform.TEST
    }
]);

// Set up mock validation
store.validator = 'TEST_VALIDATOR';

store.when()
    .approved(transaction => transaction.verify())
    .verified(receipt => {
        receipt.collection.forEach(purchase => {
            console.log('Verified: ' + purchase.id);
        });
        receipt.finish();
    })
    .finished(transaction => {
        console.log('Finished: ' + transaction.transactionId);
    });

await store.initialize([Platform.TEST]);
```

## Notes

- Custom products are stored in memory and cleared when the application restarts. Register them each time before calling `store.initialize()`.
- The Test adapter uses JavaScript `prompt()` for purchase confirmation: "Y" to approve, "E" to simulate error, anything else to cancel.
- Mock validation (triggered by setting `store.validator` to any non-empty string) returns a simulated success after a short delay.
- For comprehensive testing of real purchase flows, always test on devices using platform Sandbox/Test accounts.
