# Payment Request with Braintree

!INCLUDE "sections/plugin-v13.md"

We will proceed in steps: setup, initialization and payment.

First we'll details the basic setup steps, of course you can skip the first few steps if you already have a working application you want to integrate the code into.

1. Install NodeJS and Cordova
2. Setup your Cordova project
3. Prepare an Account on Braintree
4. Install the In-App Purchases plugin and Braintree extension
5. Configure Braintree on [iaptic](https://www.iaptic.com/)

Once we have a Cordova application with Braintree support enabled and everything is in place on Braintree and Iaptic dashboards, we will move to coding a minimal demo app.

1. Initialize the in-app purchase plugin
2. Launch a payment request
3. Handle the purchase events
4. Finalize

## Setup

!INCLUDE "sections/setup-braintree.md"

## Code

!INCLUDE "sections/payment-braintree-code.md"

## Build and Test

!INCLUDE "sections/payment-braintree-test.md"

