import threading

class RuleEngine:
    """Thread-safe rule engine — mirrors rule_manager.cpp"""

    def __init__(self):
        self._lock = threading.Lock()
        self._rules = {
            "tiktok":    False,
            "instagram": False,
            "youtube":   False,
            "facebook":  False,
            "twitter":   False,
            "netflix":   False,
            "discord":   False,
            "reddit":    False,
        }

    def is_blocked(self, app: str) -> bool:
        with self._lock:
            return self._rules.get(app, False)

    def set_rule(self, app: str, blocked: bool):
        with self._lock:
            self._rules[app] = blocked

    def get_all(self) -> dict:
        with self._lock:
            return dict(self._rules)