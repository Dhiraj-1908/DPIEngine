// Bridge: receives message from background, forwards to the React page
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'EXTENSION_ANNOUNCE') {
    window.postMessage(msg, '*')
  }
})