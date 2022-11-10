document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady() {

  if (!window.CdvPurchase) {
      console.log('CdvPurchase is not available');
      return;
  }
  const {store} = CdvPurchase;

  store.error(function(error) {
      console.log('ERROR ' + error.code + ': ' + error.message);
  });

  store.ready(function() {
    console.log("CdvPurchase is ready");
  });
 
  initializeStore();
  refreshUI();
}

function initializeStore() {
  // We will implement this soon
}

function refreshUI() {
  // Soon...
}