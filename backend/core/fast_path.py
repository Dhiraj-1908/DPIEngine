from .hash_util import hash_to_fp

class FastPath:
    def __init__(self, num_threads=4):
        self.num_threads = num_threads
        self.pkt_counts  = [0] * num_threads

    def assign(self, flow_hash, packets):
        thread = hash_to_fp(flow_hash, self.num_threads)
        self.pkt_counts[thread] += packets
        return thread

    def get_stats(self):
        return [{"id": i, "pkts": self.pkt_counts[i]} for i in range(self.num_threads)]

    def reset(self):
        self.pkt_counts = [0] * self.num_threads
