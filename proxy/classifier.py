APP_SIGNATURES = {
    "youtube":    ["youtube.com","googlevideo.com","ytimg.com","yt3.ggpht.com"],
    "tiktok":     ["tiktok.com","tiktokcdn.com","tiktokv.com","musical.ly"],
    "instagram":  ["instagram.com","cdninstagram.com","fbcdn.net"],
    "facebook":   ["facebook.com","fb.com","fbsbx.com","fbcdn.net"],
    "netflix":    ["netflix.com","nflxvideo.net","nflximg.net"],
    "twitter":    ["twitter.com","x.com","twimg.com","t.co"],
    "google":     ["google.com","googleapis.com","gstatic.com"],
    "discord":    ["discord.com","discordapp.com","discordcdn.com"],
    "reddit":     ["reddit.com","redd.it","redditmedia.com"],
}

def classify_host(hostname: str) -> str:
    h = hostname.lower().strip()
    for app, patterns in APP_SIGNATURES.items():
        if any(h == p or h.endswith("." + p) for p in patterns):
            return app
    return "unknown"