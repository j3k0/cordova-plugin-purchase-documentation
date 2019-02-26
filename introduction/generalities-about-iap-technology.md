---
description: Generalities about IAP technologies that all developers have to know.
---

# About IAP Technology

Present on both iOS and Android, IAP allow you to integrate a variety of virtual products that users can purchase right from inside your application.

## Virtual Products

You can offer 4 families of virtual products:

* _Auto-Renewing Subscriptions._
  * A subscription that will be renewed automatically every period, until canceled by the user.
* _Non-Renewing Subscriptions._
  * A subscription the user has to renew manually.
* _Consumable_ products
  * Like virtual currencies or alike \(gems, gold, lives, ...\).
  * Stuff that can be purchased multiple times.
* _Non-Consumable_ products
  * Like unlocking a premium feature.
  * Stuff that can be purchased only once.

Android actually only makes the difference between products incurring recurring or non-recurring payments, i.e. Auto-Renewing Subscriptions vs everything else. But iOS has a strict differentiation between those 4 categories. As such the plugin provides the logic for those 4 categories on both platforms. You can write your code once and have it work everywhere.

## User Accounts

Purchases are linked to a user's iTunes / Google account. As such, it's made available on all devices for this user.

Test Accounts



