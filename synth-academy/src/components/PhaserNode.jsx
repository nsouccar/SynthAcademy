import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';

/**
 * PhaserNode - Phaser effect
 * Creates a sweeping, whooshing sound by filtering the signal
 */
export function PhaserNode({ id, data }) {
  const { setNodes } = useReactFlow();
  const effectRef = useRef(null);

  const [frequency, setFrequency] = useState(data?.frequency || 0.5);
  const [octaves, setOctaves] = useState(data?.octaves || 3);
  const [baseFrequency, setBaseFrequency] = useState(data?.baseFrequency || 350);
  const [wet, setWet] = useState(data?.wet || 0.5);

  // Create the Tone.js effect on mount
  useEffect(() => {
    try {
      const effect = new Tone.Phaser({
        frequency: frequency,
        octaves: octaves,
        baseFrequency: baseFrequency,
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
            console.error('Error disposing phaser:', e);
          }
          effectRef.current = null;
        }
      };
    } catch (e) {
      console.error('Error creating phaser effect:', e);
      return () => {}; // Return empty cleanup if creation failed
    }
  }, [id]);

  // Update frequency
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.frequency.value = frequency;
    }
  }, [frequency]);

  // Update octaves
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.octaves = octaves;
    }
  }, [octaves]);

  // Update base frequency
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.baseFrequency = baseFrequency;
    }
  }, [baseFrequency]);

  // Update wet/dry mix
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.wet.value = wet;
      // Dispatch phaser change for aurora lights
      window.dispatchEvent(new CustomEvent('phaserChange', {
        detail: { nodeId: id, wet: wet }
      }));
    }
  }, [wet, id]);

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
