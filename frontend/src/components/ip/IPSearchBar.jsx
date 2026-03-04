import { useIPStore } from '../../store/useIPStore'
import { fetchIPIntel, fetchMyIP } from '../../utils/ipService'
import { isValidIPv4 } from '../../utils/ipUtils'

export default function IPSearchBar() {
  const { inputIP, setInputIP, isScanning, setIsScanning, setResult, setError, reset } = useIPStore()

  async function handleLookup(ip) {
    const target = (ip || inputIP).trim()
    if (!target) return
    reset()
    setIsScanning(true)
    try {
      const data = await fetchIPIntel(target)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setIsScanning(false)
    }
  }

  async function handleMyIP() {
    reset()
    setIsScanning(true)
    try {
      const ip = await fetchMyIP()
      setInputIP(ip)
      const data = await fetchIPIntel(ip)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <input
        value={inputIP}
        onChange={e => setInputIP(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLookup()}
        placeholder="Enter any IPv4 address — e.g. 8.8.8.8"
        style={{
          flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 7, padding: '11px 16px', color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none',
        }}
      />
      <button
        onClick={() => handleLookup()}
        disabled={isScanning}
        style={{
          background: isScanning ? 'var(--border)' : '#f59e0b',
          border: 'none', borderRadius: 7, padding: '0 22px',
          color: '#000', fontFamily: 'var(--font-mono)', fontSize: 12,
          fontWeight: 700, cursor: isScanning ? 'not-allowed' : 'pointer',
          letterSpacing: '1px',
        }}
      >
        {isScanning ? 'SCANNING...' : '🔍 LOOKUP'}
      </button>
      <button
        onClick={handleMyIP}
        disabled={isScanning}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 7, padding: '0 18px', color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
          letterSpacing: '0.5px',
        }}
      >
        SCAN MY IP
      </button>
    </div>
  )
}