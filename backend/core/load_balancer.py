from .hash_util import hash_to_lb

class LoadBalancer:
    def __init__(self, num_workers=2):
        self.num_workers = num_workers
        self.flow_counts = [0] * num_workers

    def assign(self, flow_hash):
        worker = hash_to_lb(flow_hash, self.num_workers)
        self.flow_counts[worker] += 1
        return worker

    def get_stats(self):
        return [{"id": i, "flows": self.flow_counts[i]} for i in range(self.num_workers)]

    def reset(self):
        self.flow_counts = [0] * self.num_workers
