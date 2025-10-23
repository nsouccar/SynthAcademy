import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';

/**
 * ReverbNode - Reverb effect
 * Simulates the sound of a space by creating many echoes
 */
export function ReverbNode({ id, data }) {
  const { setNodes } = useReactFlow();
  const effectRef = useRef(null);

  const [decay, setDecay] = useState(data?.decay || 3.0);
  const [preDelay, setPreDelay] = useState(data?.preDelay || 0.01);
  const [wet, setWet] = useState(data?.wet || 0.5);

  // Create the Tone.js effect on mount
  useEffect(() => {
    const effect = new Tone.Reverb({
      decay: decay,
      preDelay: preDelay,
      wet: wet
    });
    effectRef.current = effect;
    audioGraph.registerNode(id, effect);

    // Reverb needs to be ready before use
    effect.ready.then(() => {
      console.log('Reverb ready');
    });

    return () => {
      audioGraph.unregisterNode(id);
      effect.dispose();
      effectRef.current = null;
    };
  }, [id]);

  // Update decay
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.decay = decay;
    }
  }, [decay]);

  // Update preDelay
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.preDelay = preDelay;
    }
  }, [preDelay]);

  // Update wet/dry mix
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.wet.value = wet;
    }
  }, [wet]);

  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, decay, preDelay, wet }
          };
        }
        return node;
      })
    );
  }, [decay, preDelay, wet, id, setNodes]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      border: '2px solid #a8edea',
      borderRadius: 8,
      padding: 12,
      minWidth: 180,
      color: '#333',
      fontSize: '0.85em'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
        Reverb
      </div>

      {/* Decay */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Decay:</span>
          <span>{decay.toFixed(2)} s</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="20"
          step="0.1"
          value={decay}
          onChange={(e) => setDecay(parseFloat(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Pre-delay */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Pre-delay:</span>
          <span>{(preDelay * 1000).toFixed(0)} ms</span>
        </label>
        <input
          type="range"
          min="0"
          max="0.1"
          step="0.001"
          value={preDelay}
          onChange={(e) => setPreDelay(parseFloat(e.target.value))}
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
