const {themes: prismThemes} = require('prism-react-renderer');
// remark-code-import will be configured once content migration needs it
// const remarkCodeImport = require('remark-code-import');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Cordova Purchase Plugin',
  tagline: 'In-App Purchases for Cordova, Capacitor, and Ionic',
  url: 'https://purchase.cordova.fovea.cc',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  markdown: {
    format: 'md',
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          // remarkPlugins: [remarkCodeImport],
          versions: {
            current: { label: 'v13', path: '/' },
          },
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  // Search plugin temporarily disabled — will re-enable after verifying base build
  // themes: [
  //   ['@easyops-cn/docusaurus-search-local', { hashed: true }],
  // ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Cordova Purchase Plugin',
        items: [
          { href: 'https://github.com/j3k0/cordova-plugin-purchase', label: 'GitHub', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Introduction', to: '/introduction' },
              { label: 'Setup', to: '/setup' },
              { label: 'Quick Reference', to: '/doc/quick-reference' },
            ],
          },
          {
            title: 'More',
            items: [
              { label: 'GitHub', href: 'https://github.com/j3k0/cordova-plugin-purchase' },
              { label: 'Iaptic', href: 'https://www.iaptic.com' },
            ],
          },
        ],
        copyright: `Copyright ${new Date().getFullYear()} Fovea.cc`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'typescript'],
      },
    }),
};

module.exports = config;
