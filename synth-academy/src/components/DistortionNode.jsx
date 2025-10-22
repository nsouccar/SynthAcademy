import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

/**
 * DistortionNode - Distortion effect
 * Adds harmonic distortion to the signal for grit and warmth
 */
export function DistortionNode({ id, data }) {
  const { setNodes } = useReactFlow();

  const [distortion, setDistortion] = useState(data?.distortion || 0.5);
  const [oversample, setOversample] = useState(data?.oversample || 'none');
  const [wet, setWet] = useState(data?.wet || 1);

  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, distortion, oversample, wet }
          };
        }
        return node;
      })
    );
  }, [distortion, oversample, wet, id, setNodes]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)',
      border: '2px solid #ff512f',
      borderRadius: 8,
      padding: 12,
      minWidth: 180,
      color: 'white',
      fontSize: '0.85em'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
        Distortion
      </div>

      {/* Distortion Amount */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Amount:</span>
          <span>{distortion.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={distortion}
          onChange={(e) => setDistortion(parseFloat(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Oversample */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'block', marginBottom: 4 }}>
          Oversample:
        </label>
        <select
          value={oversample}
          onChange={(e) => setOversample(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            padding: 4,
            background: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          <option value="none">None</option>
          <option value="2x">2x</option>
          <option value="4x">4x</option>
        </select>
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
