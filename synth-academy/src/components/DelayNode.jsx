import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

/**
 * DelayNode - Delay/Echo effect
 * Creates distinct echoes of the input signal
 */
export function DelayNode({ id, data }) {
  const { setNodes } = useReactFlow();

  const [delayTime, setDelayTime] = useState(data?.delayTime || 0.25);
  const [feedback, setFeedback] = useState(data?.feedback || 0.5);
  const [wet, setWet] = useState(data?.wet || 0.5);

  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, delayTime, feedback, wet }
          };
        }
        return node;
      })
    );
  }, [delayTime, feedback, wet, id, setNodes]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      border: '2px solid #fcb69f',
      borderRadius: 8,
      padding: 12,
      minWidth: 180,
      color: '#333',
      fontSize: '0.85em'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
        Delay
      </div>

      {/* Delay Time */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Time:</span>
          <span>{(delayTime * 1000).toFixed(0)} ms</span>
        </label>
        <input
          type="range"
          min="0.01"
          max="2"
          step="0.01"
          value={delayTime}
          onChange={(e) => setDelayTime(parseFloat(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Feedback */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Feedback:</span>
          <span>{(feedback * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="0.9"
          step="0.01"
          value={feedback}
          onChange={(e) => setFeedback(parseFloat(e.target.value))}
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
