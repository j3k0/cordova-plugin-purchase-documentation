
### Base framework

!INCLUDE "./code-framework.md"

### Initialization

As mentioned earlier, we'll use iaptic for the server side integration with Braintree.

We'll instantiate the [iaptic component](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Iaptic.md), using the provided `braintreeClientTokenProvider` and `validator` to 

!INCLUDECODE "code/braintree-initializeStore.js" (javascript)

We add the standard purchase events handlers for when the transaction is `approved` and the receipt `verified`, with the [`store.when()`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Store.md#when) block.

In our call to [`store.initialize()`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/classes/CdvPurchase.Store.md#initialize), we add in the Braintree platform with its configuration.

In particular, it requires a [Client Token](https://developer.paypal.com/braintree/docs/guides/authorization/client-token) provider. For this example, we'll use the implementation provided by iaptic.

### User interface

You are responsible for creating a user interface that presents the detail concerning the upcoming payment. Let's create a very simple interface.

{% code lineNumbers="true" %}
!INCLUDECODE "code/braintree-refreshUI.js" (javascript)

This is a primitive state machine that displays the basket, then the progress of the payment flow. While in the basket, the "Proceed to Payment" button calls the `pay()` function.

Let's implement that function.

### Payment request

{% code lineNumbers="true" %}
!INCLUDECODE "code/braintree-pay.js" (javascript)

Let's build and test that!