import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';

/**
 * VibratoNode - Vibrato effect
 * Creates pitch modulation for a vibrato effect
 */
export function VibratoNode({ id, data }) {
  const { setNodes } = useReactFlow();
  const effectRef = useRef(null);

  const [frequency, setFrequency] = useState(data?.frequency || 5);
  const [depth, setDepth] = useState(data?.depth || 0.1);
  const [wet, setWet] = useState(data?.wet || 1);

  // Create the Tone.js effect on mount
  useEffect(() => {
    try {
      const effect = new Tone.Vibrato({
        frequency: frequency,
        depth: depth,
        wet: wet
      });
      effectRef.current = effect;
      audioGraph.registerNode(id, effect);

      return () => {
        if (effectRef.current) {
          audioGraph.unregisterNode(id);
          try {
            effectRef.current.dispose();
          } catch (e) {
            console.error('Error disposing vibrato:', e);
          }
          effectRef.current = null;
        }
      };
    } catch (e) {
      console.error('Error creating vibrato effect:', e);
      return () => {}; // Return empty cleanup if creation failed
    }
  }, [id]);

  // Update frequency
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.frequency.value = frequency;
    }
  }, [frequency]);

  // Update depth
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.depth.value = depth;
    }
  }, [depth]);

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
            data: { ...node.data, frequency, depth, wet }
          };
        }
        return node;
      })
    );
  }, [frequency, depth, wet, id, setNodes]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      border: '2px solid #fa709a',
      borderRadius: 8,
      padding: 12,
      minWidth: 180,
      color: '#333',
      fontSize: '0.85em'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
        Vibrato
      </div>

      {/* Frequency */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Rate:</span>
          <span>{frequency.toFixed(2)} Hz</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="20"
          step="0.1"
          value={frequency}
          onChange={(e) => setFrequency(parseFloat(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Depth */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Depth:</span>
          <span>{depth.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={depth}
          onChange={(e) => setDepth(parseFloat(e.target.value))}
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
        style={{ background: '#0f0', top: '50%', width: 24, height: 24, left: -12 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="audio-out"
        style={{ background: '#0f0', top: '50%', width: 24, height: 24, right: -12 }}
      />
    </div>
  );
}
