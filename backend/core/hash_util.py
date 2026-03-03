def djb2_hash(s: str) -> int:
    h = 5381
    for c in s:
        h = ((h << 5) + h) ^ ord(c)
        h = h & 0xFFFFFFFF
    return h

def hash_five_tuple(src_ip, dst_ip, src_port, dst_port, proto) -> int:
    key = f"{src_ip}:{src_port}-{dst_ip}:{dst_port}:{proto}"
    return djb2_hash(key)

def hash_to_lb(h, num_workers=2): return h % num_workers
def hash_to_fp(h, num_threads=4): return h % num_threads
