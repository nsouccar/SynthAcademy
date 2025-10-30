import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';

/**
 * ChorusNode - Chorus effect
 * Creates a thickening/doubling effect by adding delayed, modulated copies of the signal
 */
export function ChorusNode({ id, data }) {
  const { setNodes } = useReactFlow();
  const effectRef = useRef(null);

  const [frequency, setFrequency] = useState(data?.frequency || 2.5);
  const [delayTime, setDelayTime] = useState(data?.delayTime || 5);
  const [depth, setDepth] = useState(data?.depth || 0.85);
  const [wet, setWet] = useState(data?.wet || 0.65);

  // Create the Tone.js effect on mount
  useEffect(() => {
    try {
      const effect = new Tone.Chorus({
        frequency: frequency,
        delayTime: delayTime,
        depth: depth,
        wet: wet
      }).start();
      effectRef.current = effect;
      audioGraph.registerNode(id, effect);

      return () => {
        if (effectRef.current) {
          audioGraph.unregisterNode(id);
          try {
            effectRef.current.stop();
            effectRef.current.dispose();
          } catch (e) {
            console.error('Error disposing chorus:', e);
          }
          effectRef.current = null;
        }
      };
    } catch (e) {
      console.error('Error creating chorus effect:', e);
      return () => {}; // Return empty cleanup if creation failed
    }
  }, [id]);

  // Update frequency
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.frequency.value = frequency;
    }
  }, [frequency]);

  // Update delay time
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.delayTime = delayTime;
    }
  }, [delayTime]);

  // Update depth
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.depth = depth;
      // Dispatch chorus change for aurora lights
      window.dispatchEvent(new CustomEvent('chorusChange', {
        detail: { nodeId: id, depth: depth }
      }));
    }
  }, [depth, id]);

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
            data: { ...node.data, frequency, delayTime, depth, wet }
          };
        }
        return node;
      })
    );
  }, [frequency, delayTime, depth, wet, id, setNodes]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '2px solid #667eea',
      borderRadius: 8,
      padding: 12,
      minWidth: 180,
      color: 'white',
      fontSize: '0.85em'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
        Chorus
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
          max="10"
          step="0.1"
          value={frequency}
          onChange={(e) => setFrequency(parseFloat(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Delay Time */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Delay:</span>
          <span>{delayTime.toFixed(1)} ms</span>
        </label>
        <input
          type="range"
          min="2"
          max="30"
          step="0.5"
          value={delayTime}
          onChange={(e) => setDelayTime(parseFloat(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Depth */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Depth:</span>
          <span>{(depth * 100).toFixed(0)}%</span>
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
