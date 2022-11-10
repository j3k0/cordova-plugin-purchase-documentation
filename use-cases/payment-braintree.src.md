# Payment Request with Braintree

!INCLUDE "sections/plugin-v13.md"

We will proceed in steps: setup, initialization and payment.

First some setup.

1. Install NodeJS and Cordova
2. Setup your Cordova project
3. Prepare an Account on Braintree
4. Install the In-App Purchases plugin and Braintree extension
5. Configure Braintree on [iaptic](https://www.iaptic.com/)

Of course you can skip the first few steps if you already have a working application you want to integrate the code into.

Once we have a Cordova application support enabled and everything is in place on Braintree and Iaptic, we will get into some coding.

1. Initialize the in-app purchase plugin
2. Initiate the payment request
3. Handle the purchase events
4. Finalize

## Setup

!INCLUDE "sections/setup-braintree.md"

## Code

!INCLUDE "sections/payment-braintree-code.md"

