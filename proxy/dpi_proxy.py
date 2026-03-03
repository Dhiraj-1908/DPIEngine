import socket
import threading
import time
import select
from classifier import classify_host
from rules import RuleEngine

BLOCK_RESPONSE = (
    b"HTTP/1.1 403 Forbidden\r\n"
    b"Content-Type: text/html\r\n"
    b"Connection: close\r\n\r\n"
    b"<html><body style='background:#0a0a0a;color:#ef4444;font-family:monospace;"
    b"display:flex;align-items:center;justify-content:center;height:100vh;margin:0'>"
    b"<div style='text-align:center'>"
    b"<div style='font-size:48px'>BLOCKED</div>"
    b"<div style='font-size:24px;margin:16px 0'>DPI BLOCKED</div>"
    b"<div style='color:#64748b'>This site is blocked by Packet Lab DPI Engine</div>"
    b"</div></body></html>"
)

FORWARD_RESPONSE = b"HTTP/1.1 200 Connection established\r\n\r\n"

class DPIProxy:
    def __init__(self, host: str, port: int, rule_engine: RuleEngine, packet_log: list):
        self.host        = host
        self.port        = port
        self.rules       = rule_engine
        self.packet_log  = packet_log
        self.stats       = {"total": 0, "forwarded": 0, "blocked": 0}
        self._lock       = threading.Lock()
        self._running    = False

    def start(self):
        self._running = True
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((self.host, self.port))
        server.listen(100)
        print(f"  Proxy listening on {self.host}:{self.port}")
        while self._running:
            try:
                server.settimeout(1.0)
                client, addr = server.accept()
                t = threading.Thread(target=self._handle, args=(client,), daemon=True)
                t.start()
            except socket.timeout:
                continue
            except Exception:
                break

    def _handle(self, client: socket.socket):
        try:
            data = client.recv(4096)
            if not data:
                client.close()
                return

            first_line = data.split(b"\r\n")[0].decode("utf-8", errors="ignore")

            if not first_line.startswith("CONNECT"):
                client.close()
                return

            target      = first_line.split(" ")[1]
            hostname    = target.split(":")[0]
            port        = int(target.split(":")[1]) if ":" in target else 443

            app         = classify_host(hostname)
            blocked     = self.rules.is_blocked(app)
            action      = "BLOCK" if blocked else "FORWARD"
            ts          = time.strftime("%H:%M:%S")

            with self._lock:
                self.stats["total"] += 1
                self.stats["forwarded" if not blocked else "blocked"] += 1
                self.packet_log.append({
                    "time":   ts,
                    "host":   hostname,
                    "app":    app,
                    "action": action,
                })
                if len(self.packet_log) > 200:
                    self.packet_log.pop(0)

            if blocked:
                client.sendall(BLOCK_RESPONSE)
                client.close()
                return

            # Resolve DNS to raw IP to avoid looping back through system proxy
            try:
                ip = socket.getaddrinfo(hostname, port, socket.AF_INET, socket.SOCK_STREAM)[0][4][0]
                remote = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                remote.settimeout(10)
                remote.connect((ip, port))
                remote.settimeout(None)  # back to blocking after connect
            except Exception:
                client.close()
                return

            client.sendall(FORWARD_RESPONSE)
            self._tunnel(client, remote)

        except Exception:
            try: client.close()
            except: pass

    def _tunnel(self, client: socket.socket, remote: socket.socket):
        """Bidirectional pipe using select — blocking sockets, no dropped TLS bytes"""
        sockets = [client, remote]
        try:
            while True:
                readable, _, exceptional = select.select(sockets, [], sockets, 60)
                if exceptional or not readable:
                    break
                for sock in readable:
                    other = remote if sock is client else client
                    try:
                        chunk = sock.recv(8192)
                        if not chunk:
                            return
                        other.sendall(chunk)
                    except Exception:
                        return
        finally:
            try: client.close()
            except: pass
            try: remote.close()
            except: pass