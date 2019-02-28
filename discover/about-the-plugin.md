# About the Plugin

The Cordova purchase plugin presents a unified interface for all supported platforms: iOS, Android and Windows.

The core of the API revolves around two main concepts:

* **States,** associated with in-app products.
* **Event listeners,** used to track product state changes.

## Product states

The platform associates a state with each In-app products. A product will always be in one of the following states \(simplified view\):

* **registered** \(the product is known to the plugin\)
* **valid** \(details have been loaded from the store, the product can be purchased\)
  * **invalid** \(details can't be loaded\).
* **requested** \(an order have been placed\)
* **approved** \(the order have been approved\)
* **finished** \(the app has delivered the order\)
* **owned** \(the product is owned\)

As a user, you will have to listen to changes happening to the state of your in-app products and act accordingly. The plugin provides an event API through which you'll perform those operations.

Some state changes are your responsibility: registering the product, requesting a purchase, finishing the order. The other state changes are the handled by the platform.

## Purchase process

Purchasing a product is a 4 steps process:

1. **Requesting** a purchase.
2. Getting **approval** from the bank
3. **Delivery** by the application
4. **Finalization**

After an order has been placed, the platform will negotiate the authorization to withdraw an amount from the customer's bank account. Once it gets the approval, the product enters the **approved** state. The app gets notified and should do the following:

1. Check if the transaction receipt is legit
   * \(fake receipts generators can be used that let users unlock features for free\)
2. Deliver the product.

When the application has delivered the product, it finalises the order. That's when the money will be transferred to you. This way we ensure that no customers is charged for a product that cannot be delivered.

After finalisation, the product will be owned. Consumable products can be purchased again.

{% hint style="danger" %}
It looks like a linear process, but don't forget that it can be interrupted at any point! Orders pending approval, approved \(unfinished\) orders can remain in the queue after the application crashed or connection was lost, or... you know, anything can happen.

It's even possible that an order is placed on one device and finalized on another device.

That's why an app must be ready to handle purchase process events as soon as the application is started. A classic mistake is to assume that **approval** can only happen after the user clicked the _Buy_ button, this is just **not** true.
{% endhint %}

## Displaying products

Platform owners \(Apple, Google\) request that you load the details for your products from the stores. This ensure that the displayed price always reflects the real details. Hardcoding price will create issues when the actual price will change for reasons outside your control: for instance taxation changes, price tiers changes, etc.

The plugin requires you to register the full list of all your products and will take care of loading the details. Your UI should reflect the data loaded by the plugin. It should hide products that aren't loaded yet.

A product cannot be purchased if it's already owned or if there's already a transaction in progress for that product. Each product has a field \(`canPurchase`\) that indicates if it can be purchased or not. Your UI will have to check for that field and display a _Buy_ button only if it's true.

OK, enough with theory! We will get into the practical details in the guide.

