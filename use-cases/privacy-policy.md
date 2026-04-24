# Validator Privacy Policy

The `store.validator_privacy_policy` property controls what device and user information is included in receipt validation requests sent to your validator server. This allows you to comply with privacy regulations (GDPR, CCPA, etc.) and match your application's privacy policy.

**Availability:** v13.12.0+

## Configuration

Set the property before initializing the store:

```javascript
const { store } = CdvPurchase;

store.validator_privacy_policy = ['fraud', 'support', 'analytics'];
```

## Available Values

| Value | What it enables | Typical use |
|-------|----------------|-------------|
| `'fraud'` | Device fingerprint data | Fraud detection and prevention |
| `'support'` | Device model, OS version | Handling customer support requests |
| `'analytics'` | Aggregated usage data | Purchase analytics and reporting |
| `'tracking'` | Advertising identifiers | Cross-app tracking and attribution |

## Type Definition

```typescript
type PrivacyPolicyItem = 'fraud' | 'support' | 'analytics' | 'tracking';

// Accepts a single value, an array, or undefined
store.validator_privacy_policy: PrivacyPolicyItem | PrivacyPolicyItem[] | undefined;
```

## Default Behavior

If not set (or set to `undefined`), the plugin defaults to:

```javascript
['analytics', 'support', 'fraud']
```

This default sends device information for analytics, support, and fraud detection, but excludes advertising identifiers (`'tracking'`).

## Examples

### Minimal data (fraud detection only)

```javascript
store.validator_privacy_policy = ['fraud'];
```

### Full data collection

```javascript
store.validator_privacy_policy = ['fraud', 'support', 'analytics', 'tracking'];
```

### GDPR-compliant setup

Adjust the policy based on user consent:

```javascript
function initializeStore(userConsent) {
    const { store, Platform, ProductType } = CdvPurchase;

    // Base policies that don't require consent
    const policies = ['fraud', 'support'];

    if (userConsent.analytics) {
        policies.push('analytics');
    }
    if (userConsent.tracking) {
        policies.push('tracking');
    }

    store.validator_privacy_policy = policies;
    store.validator = 'https://validator.iaptic.com/v1/validate';

    // Continue with registration and initialization...
}
```

## What Data Is Affected

The privacy policy controls what is included in the `device` object sent with each validation request:

- **Without `'fraud'`:** No device fingerprint is sent
- **Without `'support'`:** No device model, OS version, or locale information is sent
- **Without `'analytics'`:** No aggregated usage metrics are included
- **Without `'tracking'`:** No advertising identifiers (IDFA/GAID) are included

## Notes

- This property only affects requests sent to the validator URL. It has no effect on communication with Apple or Google servers.
- The property can also be set as a comma-separated string (e.g., `'fraud,support'`), but the array form is preferred.
- Always align the values you set with what your privacy policy actually discloses to users.
