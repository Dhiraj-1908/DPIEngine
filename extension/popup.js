chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
  const dot      = document.getElementById('dot')
  const liveText = document.getElementById('liveText')

  if (res?.stats) {
    document.getElementById('total').textContent     = res.stats.total     ?? 0
    document.getElementById('forwarded').textContent = res.stats.forwarded ?? 0
    document.getElementById('blocked').textContent   = res.stats.blocked   ?? 0
  } else {
    dot.classList.add('off')
    liveText.classList.add('off')
    liveText.textContent = 'OFF'
    document.getElementById('total').textContent     = '—'
    document.getElementById('forwarded').textContent = '—'
    document.getElementById('blocked').textContent   = '—'
  }
})

document.getElementById('openBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://dpi-engine.vercel.app' })
})