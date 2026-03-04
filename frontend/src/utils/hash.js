// Mirrors djb2 hash from C++ types.h
export function djb2Hash(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash >>> 0  // keep 32-bit unsigned
  }
  return hash
}

export function hashFiveTuple(srcIP, dstIP, srcPort, dstPort, proto) {
  const key = `${srcIP}:${srcPort}-${dstIP}:${dstPort}:${proto}`
  return djb2Hash(key)
}

export function hashToLB(hash, numWorkers = 2) {
  return hash % numWorkers
}

export function hashToFP(hash, numThreads = 4) {
  return hash % numThreads
}

export function getHashSteps(domain) {
  const steps = []
  let hash = 5381
  const sample = domain.slice(0, 6)
  for (let i = 0; i < sample.length; i++) {
    const prev = hash
    hash = ((hash << 5) + hash) ^ sample.charCodeAt(i)
    hash = hash >>> 0
    steps.push({
      char:  sample[i],
      code:  sample.charCodeAt(i),
      prev:  prev >>> 0,
      after: hash,
      op:    `(${prev} << 5) + ${prev}) ^ ${sample.charCodeAt(i)}`,
    })
  }
  return { steps, finalHash: hash }
}