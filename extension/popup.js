chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
  if (res) {
    document.getElementById('total').textContent   = res.stats?.total   || 0
    document.getElementById('blocked').textContent = res.stats?.blocked || 0
  }
})

document.getElementById('openBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://packet-lab.vercel.app' }) // update with your actual URL
})