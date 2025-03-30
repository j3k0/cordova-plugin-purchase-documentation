
#### index.html

Assuming you're starting from a blank project, we'll add the minimal amount of HTML for the purpose of this tutorial. Let's replace the `<body>` from the `www/index.html` file with the below.

```markup
<body>
  <div id="app"></div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
```

Let's also make sure to comment out Cordova template project's CSS.

You also need to enable the `'unsafe-inline'` `Content-Security-Policy` by adding it to the `default-src` section:

```markup
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self' 'unsafe-inline' [...]" />
```

You can download the [full index.html file here](https://gist.github.com/j3k0/80c69837e5bacf83c4fc2320ba2e5dc2).
#### javascript


We will now create a new JavaScript file and load it from the HTML. The code below will initialize the plugin.

{% code lineNumbers="true" %}
```javascript
// Wait for Cordova to be ready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
  console.log('Device is ready.');

  // Check if the CdvPurchase plugin is available
  if (!window.CdvPurchase || !window.CdvPurchase.store) {
      console.error('CdvPurchase plugin is not available. Ensure it is installed and loaded correctly.');
      document.getElementById('app').innerHTML = 'Error: Purchase plugin not found.';
      return;
  }

  // Alias the store object for easier access
  const { store, LogLevel, ErrorCode } = CdvPurchase;
  console.log('CdvPurchase.store object found, version ' + store.version);

  // Optional: Set the verbosity level for debugging
  // LogLevel.DEBUG provides the most detailed logs
  store.verbosity = LogLevel.DEBUG;

  // Setup a global error handler for the store
  store.error(function(error) {
      console.error('STORE ERROR: Code=' + error.code + ' Message=' + error.message);
      // Display the error to the user in a dedicated element
      const errorEl = document.getElementById('error-display'); // Ensure this element exists in your HTML
      if (errorEl) {
          errorEl.textContent = 'Error: ' + error.message;
          // Optionally clear the error after a few seconds
          setTimeout(() => { if (errorEl.textContent === 'Error: ' + error.message) errorEl.textContent = ''; }, 8000);
      }
  });

  // Setup a listener for when the store is ready
  // This guarantees that initialize() has completed successfully
  store.ready(function() {
    console.log("CdvPurchase store is ready.");
    // Initial UI refresh after the store is ready
    refreshUI();
  });

  // Initialize the store and related components
  initializeStore();

  // Perform an initial UI refresh (might show loading states)
  refreshUI();
}

function initializeStore() {
  console.log('Calling initializeStore()...');
  const { store } = CdvPurchase; // Get store instance again

  // TODO: Register products using store.register([...])
  console.log('Registering products...');
  // store.register([...]); // Add your product registrations here

  // TODO: Set the validator URL or function
  console.log('Setting validator...');
  // store.validator = "YOUR_VALIDATOR_URL";

  // TODO: Setup event listeners using store.when()...
  console.log('Setting up event listeners...');
  // store.when()...

  // TODO: Call store.initialize([...platforms])
  console.log('Calling store.initialize()...');
  // store.initialize([...]);
}

function refreshUI() {
  console.log('Calling refreshUI()...');
  // TODO: Implement UI updates based on product/purchase status
  // This function will be called by event listeners and after initialization.
  const appEl = document.getElementById('app');
  if (appEl) {
      // Example: Display loading state or initial content
      // appEl.innerHTML = '<p>Store is initializing...</p>';
  } else {
      console.error('App element not found for UI refresh.');
  }
}
```
{% endcode %}

Here's a little explanation:

**Line 1**, it's important to wait for the "deviceready" event before using cordova plugins.

**Lines 5-8**, we check if the plugin was correctly loaded.

**Lines 11-13**, we setup an error handler. It just logs errors to the console.

> Whatever your setup is, you should make sure this runs as soon as the javascript application starts. You have to be ready to handle IAP events as soon as possible.
