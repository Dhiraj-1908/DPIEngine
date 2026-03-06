// Bridges background script → webpage (window.postMessage)
// Announces extension ID so frontend can discover it dynamically

function announce() {
  window.postMessage({ type: 'EXTENSION_ANNOUNCE', extensionId: chrome.runtime.id }, '*')
}

announce()
document.addEventListener('DOMContentLoaded', announce)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'ANNOUNCE_TO_PAGE') announce()
})