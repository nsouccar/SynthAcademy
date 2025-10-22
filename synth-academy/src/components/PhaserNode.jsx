import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

/**
 * PhaserNode - Phaser effect
 * Creates a sweeping, whooshing sound by filtering the signal
 */
export function PhaserNode({ id, data }) {
  const { setNodes } = useReactFlow();

  const [frequency, setFrequency] = useState(data?.frequency || 0.5);
  const [octaves, setOctaves] = useState(data?.octaves || 3);
  const [baseFrequency, setBaseFrequency] = useState(data?.baseFrequency || 350);
  const [wet, setWet] = useState(data?.wet || 0.5);

  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, frequency, octaves, baseFrequency, wet }
          };
        }
        return node;
      })
    );
  }, [frequency, octaves, baseFrequency, wet, id, setNodes]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      border: '2px solid #a18cd1',
      borderRadius: 8,
      padding: 12,
      minWidth: 180,
      color: 'white',
      fontSize: '0.85em'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
        Phaser
      </div>

      {/* Frequency */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Rate:</span>
          <span>{frequency.toFixed(2)} Hz</span>
        </label>
        <input
          type="range"
          min="0.01"
          max="10"
          step="0.01"
          value={frequency}
          onChange={(e) => setFrequency(parseFloat(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Octaves */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Octaves:</span>
          <span>{octaves.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="8"
          step="0.5"
          value={octaves}
          onChange={(e) => setOctaves(parseFloat(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Base Frequency */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Base Freq:</span>
          <span>{baseFrequency} Hz</span>
        </label>
        <input
          type="range"
          min="100"
          max="1000"
          step="10"
          value={baseFrequency}
          onChange={(e) => setBaseFrequency(parseInt(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Wet/Dry Mix */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Mix:</span>
          <span>{(wet * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={wet}
          onChange={(e) => setWet(parseFloat(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="audio-in"
        style={{ background: '#0f0', top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="audio-out"
        style={{ background: '#0f0', top: '50%' }}
      />
    </div>
  );
}
