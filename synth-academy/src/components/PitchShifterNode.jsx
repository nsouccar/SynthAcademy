import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';

/**
 * PitchShifterNode - Pitch shifter effect
 * Shifts the pitch of the input signal up or down
 */
export function PitchShifterNode({ id, data }) {
  const { setNodes } = useReactFlow();
  const effectRef = useRef(null);

  const [pitch, setPitch] = useState(data?.pitch || 0);
  const [windowSize, setWindowSize] = useState(data?.windowSize || 0.1);
  const [wet, setWet] = useState(data?.wet || 1);

  // Create the Tone.js effect on mount
  useEffect(() => {
    try {
      const effect = new Tone.PitchShift({
        pitch: pitch,
        windowSize: windowSize,
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
            console.error('Error disposing pitch shifter:', e);
          }
          effectRef.current = null;
        }
      };
    } catch (e) {
      console.error('Error creating pitch shifter effect:', e);
      return () => {}; // Return empty cleanup if creation failed
    }
  }, [id]);

  // Update pitch
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.pitch = pitch;
    }
  }, [pitch]);

  // Update window size
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.windowSize = windowSize;
    }
  }, [windowSize]);

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
            data: { ...node.data, pitch, windowSize, wet }
          };
        }
        return node;
      })
    );
  }, [pitch, windowSize, wet, id, setNodes]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      border: '2px solid #ff9a9e',
      borderRadius: 8,
      padding: 12,
      minWidth: 180,
      color: '#333',
      fontSize: '0.85em'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
        Pitch Shifter
      </div>

      {/* Pitch */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Pitch:</span>
          <span>{pitch > 0 ? '+' : ''}{pitch} semitones</span>
        </label>
        <input
          type="range"
          min="-12"
          max="12"
          step="1"
          value={pitch}
          onChange={(e) => setPitch(parseInt(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Window Size */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Window:</span>
          <span>{windowSize.toFixed(2)} s</span>
        </label>
        <input
          type="range"
          min="0.03"
          max="0.3"
          step="0.01"
          value={windowSize}
          onChange={(e) => setWindowSize(parseFloat(e.target.value))}
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
