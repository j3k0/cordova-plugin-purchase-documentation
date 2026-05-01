---
title: "Cordova Purchase Plugin"
sidebar_position: 0
slug: /
---

# Cordova Purchase Plugin

![](/img/banner.jpg)

> **In-App Purchases for Cordova, Capacitor, and Ionic**

---

Need professional help and support? [Contact Me](mailto:hoelt@fovea.cc).

## Summary

This plugin allows **In-App Purchases** (IAP) to be made from **Cordova, Capacitor, and Ionic** applications using a single, unified JavaScript API.

It simplifies handling in-app purchases across multiple platforms by abstracting platform-specific complexities.

**Supported Platforms & Features:**

| Feature                      | App Store (iOS/macOS) | Google Play (Android) | Braintree (iOS/Android)¹ | Test Platform |
| :--------------------------- | :-------------------: | :-------------------: | :----------------------: | :-----------: |
| Consumables                  |           ✅          |           ✅          |            ✅            |       ✅      |
| Multi-Quantity Consumables   |           ✅          |           ✅          |                          |               |
| Non-Consumables              |           ✅          |           ✅          |                          |       ✅      |
| Auto-Renewing Subscriptions  |           ✅          |           ✅          |                          |       ✅      |
| Non-Renewing Subscriptions   |           ✅          |           ✅          |                          |               |
| Restore Purchases            |           ✅          |           ✅          |            ✅            |       ✅      |
| Payment Requests             |                       |                       |            ✅            |       ✅      |
| Receipt Validation           |           ✅          |           ✅          |            ✅            |       ✅      |
| Introductory Offers          |           ✅          |           ✅          |                          |       ✅      |
| Promotional Offers (iOS)     |           ✅          |                       |                          |               |
| Subscription Offers (GP)     |                       |           ✅          |                          |       ✅      |
| Manage Subscriptions UI      |           ✅          |           ✅          |                          |       ✅      |
| Manage Billing UI            |           ✅          |           ✅          |                          |       ✅      |

¹ *Requires the [cordova-plugin-purchase-braintree](https://github.com/j3k0/cordova-plugin-purchase-braintree) extension.*

## Documentation

**Key Sections:**

- [**Introduction**](introduction) — Overview and core concepts
- [**Micro Example**](discover/micro-example) — Get started with a working example
- [**Setup**](setup/) — Platform and framework configuration
- [**Use Cases**](use-cases/consumable-appstore) — Step-by-step guides for each product type
- [**API Reference**](https://github.com/j3k0/cordova-plugin-purchase/tree/v13/api) — Full API documentation
- [**Quick Reference**](doc/quick-reference) — Key types and methods at a glance
- [**Troubleshooting**](doc/troubleshooting) — Solutions for common problems
- [**Migration Guide**](doc/migration-to-v13) — Upgrading from older versions

## Installation

### Cordova

```bash
cordova plugin add cordova-plugin-purchase
```

### Capacitor

```bash
npm install capacitor-plugin-cdv-purchase
npx cap sync
```

See the [Capacitor Setup](setup/setup-capacitor) guide for details.

### Ionic

```bash
ionic cordova plugin add cordova-plugin-purchase
npm install cordova-plugin-purchase
```

## Sponsors & License

This plugin is maintained thanks to its sponsors. See the full [README on GitHub](https://github.com/j3k0/cordova-plugin-purchase#sponsors) for details.

Licensed under the MIT License.

---
[GitHub](https://github.com/j3k0/cordova-plugin-purchase) | [Iaptic Validation](https://www.iaptic.com/)
