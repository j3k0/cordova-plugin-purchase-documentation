# About IAP Technology

Generalities about IAP technologies that all developers have to know.

Present on both iOS (with AppStore) and Android (with Google Play as the most popular option), In-App Purchase \(IAP\) lets you integrate a variety of virtual products that users can purchase right from your application.

## Virtual Products

You can offer 4 types of virtual products:

* _Consumable_ products
  * For virtual currencies or similar \(gems, gold, lives, ...\).
  * Stuff that can be purchased \(and consumed\) multiple times.
* _Non-Consumable_ products
  * For unlocking a premium feature.
  * Stuff that can be purchased only once.
* _Auto-Renewing Subscriptions._
  * Subscriptions that will be renewed automatically every period, until canceled by the user.
* _Non-Renewing Subscriptions._
  * Temporary subscriptions that users have to renew manually.

Google Play actually only makes the difference between products incurring recurring or non-recurring payments, i.e. Auto-Renewing Subscriptions vs everything else. But iOS has a strict differentiation between those 4 categories. As such the plugin provides the logic for those 4 categories on both platforms so you can write one code that works everywhere.

## User Accounts

Purchases are linked to a user's AppStore / Google account. As such, it's made available on all devices for this user.

## Test Accounts

With both the AppStore and Google Play, you can create Test Users that do not pay for the purchases they make. We'll show you how to achieve this.

