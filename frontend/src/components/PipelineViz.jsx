import ReactFlow, { Background, Handle, Position } from 'reactflow'
import 'reactflow/dist/style.css'
import { useDPIStore } from '../store/useDPIStore'

const nodeStyle = (color) => ({
  background: 'var(--bg-surface)', border: `1px solid ${color}55`,
  borderRadius: 8, padding: '8px 14px', minWidth: 90,
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
  color, textAlign: 'center',
})

function CustomNode({ data }) {
  return (
    <div style={nodeStyle(data.color)}>
      <Handle type="target" position={Position.Left}  style={{ background: data.color, border: 'none', width: 6, height: 6 }} />
      <div style={{ fontWeight: 700, fontSize: 11 }}>{data.label}</div>
      {data.sub && <div style={{ fontSize: 8, opacity: 0.6, marginTop: 2 }}>{data.sub}</div>}
      {data.count != null && (
        <div style={{ fontSize: 9, marginTop: 4, color: '#fff' }}>{data.count} flows</div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: data.color, border: 'none', width: 6, height: 6 }} />
    </div>
  )
}

const nodeTypes = { custom: CustomNode }

export default function PipelineViz() {
  const { lbStats, fpStats, isAnalyzing } = useDPIStore()

  const nodes = [
    { id: 'reader', position: { x: 0,   y: 80  }, data: { label: 'READER', sub: 'packet capture', color: '#7c3aed', count: null }, type: 'custom' },
    { id: 'lb0',    position: { x: 160, y: 20  }, data: { label: 'LB-0',   sub: 'load balancer',  color: '#2563eb', count: lbStats[0]?.flows }, type: 'custom' },
    { id: 'lb1',    position: { x: 160, y: 110 }, data: { label: 'LB-1',   sub: 'load balancer',  color: '#2563eb', count: lbStats[1]?.flows }, type: 'custom' },
    { id: 'fp0',    position: { x: 330, y: 0   }, data: { label: 'FP-0',   sub: `${fpStats[0]?.pkts} pkts`, color: '#059669' }, type: 'custom' },
    { id: 'fp1',    position: { x: 330, y: 65  }, data: { label: 'FP-1',   sub: `${fpStats[1]?.pkts} pkts`, color: '#059669' }, type: 'custom' },
    { id: 'fp2',    position: { x: 330, y: 130 }, data: { label: 'FP-2',   sub: `${fpStats[2]?.pkts} pkts`, color: '#059669' }, type: 'custom' },
    { id: 'fp3',    position: { x: 330, y: 195 }, data: { label: 'FP-3',   sub: `${fpStats[3]?.pkts} pkts`, color: '#059669' }, type: 'custom' },
  ]

  const edges = [
    { id: 'r-lb0', source: 'reader', target: 'lb0', animated: isAnalyzing },
    { id: 'r-lb1', source: 'reader', target: 'lb1', animated: isAnalyzing },
    { id: 'lb0-fp0', source: 'lb0', target: 'fp0', animated: isAnalyzing },
    { id: 'lb0-fp1', source: 'lb0', target: 'fp1', animated: isAnalyzing },
    { id: 'lb1-fp2', source: 'lb1', target: 'fp2', animated: isAnalyzing },
    { id: 'lb1-fp3', source: 'lb1', target: 'fp3', animated: isAnalyzing },
  ]

  return (
    <div style={{ height: 260 }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false} nodesConnectable={false}
        elementsSelectable={false} zoomOnScroll={false}
        panOnDrag={false} proOptions={{ hideAttribution: true }}
      >
        <Background color="#0f2040" gap={18} size={1} />
      </ReactFlow>
    </div>
  )
}