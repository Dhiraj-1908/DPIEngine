from pydantic import BaseModel
from typing import Optional, List

class AnalyzeRequest(BaseModel):
    domains: List[str]

class ServerInfo(BaseModel):
    ip:      Optional[str]   = None
    city:    Optional[str]   = None
    country: Optional[str]   = None
    lat:     Optional[float] = None
    lon:     Optional[float] = None
    org:     Optional[str]   = None

class FlowResult(BaseModel):
    domain:     str
    app:        str
    protocol:   str
    category:   str
    hash:       int
    lb_idx:     int
    fp_idx:     int
    action:     str
    packets:    int
    bytes:      int
    latency_ms: int
    server:     Optional[ServerInfo] = None

class AnalyzeResponse(BaseModel):
    flows:     List[FlowResult]
    total:     int
    forwarded: int
    blocked:   int
    lb_stats:  List[dict]
    fp_stats:  List[dict]
