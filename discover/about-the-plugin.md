# About the Plugin

The Cordova purchase plugin presents a unified interface for all supported platforms: Apple AppStore, Google Play, Windows, Braintree.

The main functionalities exposed by the plugin will allow you:

* Load **Products** - To show information about your In-App Products: title and pricing.
* Handle the **Purchase flow** - React to events to finalize a pending purchase.
* **Initiate** a purchases and payments - When users click "buy".
* Analyze **Purchase Receipts** - To determine what the user owns.

> A common misconception is that handling the purchase flow should be done after initiating a purchase. Don't forget that users can initiate a transaction from outside the app, for example by redeeming a promo code or when a purchase is shared between users with Family Sharing.

## Displaying products

Platform owners \(Apple, Google, etc.\) request that you load the details for your products from their stores. This ensure that the displayed price always reflects the real details. Hardcoding price will create issues when the actual price changes for reasons outside your control: for instance tax changes, price tiers changes, etc.

The plugin requires you to register the list of all your products and will take care of loading the details. Your UI should reflect the data loaded by the plugin. It should hide products that cannot be loaded, as they might not be available anymore.

Each product has a title, description and a list of available offers. Each offer present different pricing options for the same product. For subscriptions, pricing is defined as a list of phase: for example 3 week for free, followed by 12 months at $1.99 per month, followed by $4.99 per month.

A product can be purchased only if it's not already owned and there's not a transaction in progress for that product. Products have a field \(`canPurchase`\) that indicates if it can be purchased or not. Your UI will have to check for that field and display a _Buy_ button only if `canPurchase` is true.

## Purchase flow

Purchasing a product is a 5 steps process:

1. **Initiate** a purchase.
2. Get **approval** from the bank.
3. Validate the **receipt**.
4. **Deliver** the purchased virtual good.
5. **Finalize** the transaction.

After an order has been placed (through the app or not), the platform will negotiate the authorization to withdraw an amount from the customer's bank account. Once it gets the approval, your app gets notified of the **approved** transaction and should do the following:

1. Verify if the transaction receipt is legit
2. Deliver the product.

When the application has delivered the product, it finalizes the order. Only after that, money will be transferred to your account. This method ensures that no customers is charged for a product that couldn't be delivered.

After finalization, non-consumable and subscription products will be owned, consumable products can be purchased again.

The **validation** and **delivery** steps might happen on your server, the plugin will send a receipt to validate, which you'll use to determine what features the user is entitled to. _Our service https://www.iaptic.com/ exists to make that process easier._

> While it might look like a linear process, don't forget that the process can be interrupted and restarted at any point! Transactions can remain pending for approval for a few days (for example with _Ask to Buy_ on devices used by kids), approved and unfinished transactions might remain in the queue after the application crashed or the network connection was lost,... anything can happen.
> 
> That's why an app must be ready to handle purchase process events as soon as the application is started. A classic mistake is to assume that **approval** will only happen after the user clicked the _Buy_ button, which is **not** true.

## Requesting payments

The plugin now also supports Braintree, that lets you charge custom amounts to your customers. The process is similar:

1. Initiate a payment request
2. Get approval
3. Deliver and finalize the transaction

OK, enough with theory! We will get into the practical details in the guide.