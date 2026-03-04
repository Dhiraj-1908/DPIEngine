export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const APP_SIGNATURES = {
  youtube:   { sni: ['youtube.com','googlevideo.com','ytimg.com','yt3.ggpht.com'], protocol: 'QUIC/TLS1.3', category: 'streaming' },
  tiktok:    { sni: ['tiktok.com','tiktokcdn.com','tiktokv.com','musical.ly'],    protocol: 'TLS1.3',      category: 'social'    },
  instagram: { sni: ['instagram.com','cdninstagram.com','fbcdn.net'],             protocol: 'TLS1.3',      category: 'social'    },
  facebook:  { sni: ['facebook.com','fbcdn.net','fb.com','fbsbx.com'],           protocol: 'TLS1.3',      category: 'social'    },
  netflix:   { sni: ['netflix.com','nflxvideo.net','nflximg.net'],                protocol: 'TLS1.3',      category: 'streaming' },
  twitter:   { sni: ['twitter.com','x.com','twimg.com','t.co'],                  protocol: 'TLS1.3',      category: 'social'    },
  google:    { sni: ['google.com','googleapis.com','gstatic.com','ggpht.com'],   protocol: 'QUIC/TLS1.3', category: 'search'    },
  cloudflare:{ sni: ['cloudflare.com','cloudflare-dns.com','1.1.1.1'],           protocol: 'TLS1.3',      category: 'infra'     },
  amazon:    { sni: ['amazon.com','amazonaws.com','cloudfront.net'],              protocol: 'TLS1.3',      category: 'ecommerce' },
  discord:   { sni: ['discord.com','discordapp.com','discordcdn.com'],            protocol: 'TLS1.3',      category: 'comms'     },
  twitch:    { sni: ['twitch.tv','twitchsvc.net','jtvnw.net'],                   protocol: 'TLS1.3',      category: 'streaming' },
  spotify:   { sni: ['spotify.com','scdn.co','spotifycdn.com'],                  protocol: 'TLS1.3',      category: 'audio'     },
  whatsapp:  { sni: ['whatsapp.com','whatsapp.net'],                              protocol: 'TLS1.3',      category: 'comms'     },
  telegram:  { sni: ['telegram.org','t.me','cdn.telegram.org'],                  protocol: 'TLS1.3',      category: 'comms'     },
  reddit:    { sni: ['reddit.com','redd.it','redditmedia.com','reddituploads.com'], protocol: 'TLS1.3',   category: 'social'    },
}

export const KNOWN_SERVERS = {
  'youtube.com':    { ip: '142.250.80.46',  city: 'Mountain View', country: 'US', lat: 37.4, lon: -122.0, org: 'Google LLC' },
  'tiktok.com':     { ip: '23.214.129.50',  city: 'Los Angeles',   country: 'US', lat: 34.0, lon: -118.2, org: 'Akamai'     },
  'instagram.com':  { ip: '157.240.241.174',city: 'Menlo Park',    country: 'US', lat: 37.4, lon: -122.1, org: 'Meta'       },
  'facebook.com':   { ip: '157.240.241.35', city: 'Menlo Park',    country: 'US', lat: 37.4, lon: -122.1, org: 'Meta'       },
  'netflix.com':    { ip: '54.74.73.0',     city: 'Dublin',        country: 'IE', lat: 53.3, lon: -6.2,   org: 'Netflix'    },
  'twitter.com':    { ip: '104.244.42.129', city: 'San Francisco', country: 'US', lat: 37.7, lon: -122.4, org: 'Twitter'    },
  'google.com':     { ip: '142.250.80.100', city: 'Mountain View', country: 'US', lat: 37.4, lon: -122.0, org: 'Google LLC' },
  'cloudflare.com': { ip: '104.16.132.229', city: 'San Francisco', country: 'US', lat: 37.7, lon: -122.4, org: 'Cloudflare' },
  'discord.com':    { ip: '162.159.130.234',city: 'San Francisco', country: 'US', lat: 37.7, lon: -122.4, org: 'Cloudflare' },
  'reddit.com':     { ip: '151.101.65.140', city: 'San Francisco', country: 'US', lat: 37.7, lon: -122.4, org: 'Fastly'     },
}

export const PRESETS = [
  { label: 'Social Media', domains: 'facebook.com, instagram.com, tiktok.com, twitter.com, reddit.com' },
  { label: 'Streaming',    domains: 'youtube.com, netflix.com, twitch.tv, spotify.com' },
  { label: 'Big Tech',     domains: 'google.com, amazon.com, cloudflare.com, discord.com' },
  { label: 'Comms',        domains: 'whatsapp.com, telegram.org, discord.com, twitter.com' },
]