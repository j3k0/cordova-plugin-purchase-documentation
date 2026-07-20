/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    { type: 'doc', id: 'index', label: 'Home' },
    { type: 'doc', id: 'introduction', label: 'Introduction' },
    { type: 'doc', id: 'doc/migration-to-v13', label: 'Migrating to v13' },
    {
      type: 'category', label: 'Discover',
      items: [
        'discover/micro-example',
        'discover/generalities-about-iap-technology',
        'discover/about-the-plugin',
        'discover/receipt-validation-importance',
      ],
    },
    {
      type: 'category', label: 'Setup',
      items: [
        'setup/index',
        'setup/setup-capacitor',
        'setup/setup-appstore',
        'setup/setup-googleplay',
        'setup/setup-braintree',
        'setup/storekit2',
        'setup/code-framework',
      ],
    },
    {
      type: 'category', label: 'Use Cases',
      items: [
        {
          type: 'category', label: 'Product Types',
          items: [
            'use-cases/consumable-googleplay', 'use-cases/consumable-appstore',
            'use-cases/non-consumable-googleplay', 'use-cases/non-consumable-appstore',
            'use-cases/subscription-googleplay', 'use-cases/subscription-appstore',
            'use-cases/non-renewing-googleplay', 'use-cases/non-renewing-appstore',
          ],
        },
        {
          type: 'category', label: 'Payment Providers',
          items: ['use-cases/payment-braintree', 'use-cases/iaptic-js'],
        },
        {
          type: 'category', label: 'Advanced Features',
          items: [
            'use-cases/storefront-api', 'use-cases/multi-quantity',
            'use-cases/privacy-policy', 'use-cases/google-play-billing',
            'use-cases/offline-entitlements',
          ],
        },
        {
          type: 'category', label: 'Testing',
          items: ['use-cases/test-platform', 'use-cases/test-custom-products'],
        },
        {
          type: 'category', label: 'Platform Specifics',
          items: ['use-cases/macos-specifics'],
        },
      ],
    },
    {
      type: 'category', label: 'References',
      items: [
        { type: 'link', label: 'API v13+', href: 'https://github.com/j3k0/cordova-plugin-purchase/tree/v13/api' },
        'doc/quick-reference',
        'doc/troubleshooting',
      ],
    },
  ],
};

module.exports = sidebars;
