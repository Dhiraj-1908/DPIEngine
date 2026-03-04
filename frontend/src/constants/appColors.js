export const APP_COLORS = {
  youtube:    { color: '#ef4444', bg: '#ef444415', icon: '▶' },
  tiktok:     { color: '#06b6d4', bg: '#06b6d415', icon: '♪' },
  instagram:  { color: '#ec4899', bg: '#ec489915', icon: '◉' },
  facebook:   { color: '#3b82f6', bg: '#3b82f615', icon: 'f' },
  netflix:    { color: '#ef4444', bg: '#ef444415', icon: 'N' },
  twitter:    { color: '#38bdf8', bg: '#38bdf815', icon: '✕' },
  google:     { color: '#10b981', bg: '#10b98115', icon: 'G' },
  cloudflare: { color: '#f97316', bg: '#f9731615', icon: '☁' },
  amazon:     { color: '#f59e0b', bg: '#f59e0b15', icon: 'a' },
  discord:    { color: '#818cf8', bg: '#818cf815', icon: '◎' },
  twitch:     { color: '#a855f7', bg: '#a855f715', icon: '⬡' },
  spotify:    { color: '#22c55e', bg: '#22c55e15', icon: '◎' },
  whatsapp:   { color: '#22c55e', bg: '#22c55e15', icon: '◉' },
  telegram:   { color: '#38bdf8', bg: '#38bdf815', icon: '✈' },
  reddit:     { color: '#f97316', bg: '#f9731615', icon: '◈' },
  unknown:    { color: '#64748b', bg: '#64748b15', icon: '?' },
}

export function getAppStyle(appName) {
  return APP_COLORS[appName?.toLowerCase()] || APP_COLORS.unknown
}