import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

/**
 * LFONode - Low Frequency Oscillator for modulation
 *
 * Modulates parameters of connected nodes (pitch, filter cutoff, etc.)
 *
 * Parameters:
 * - Waveform: sine, triangle, square, sawtooth, random
 * - Frequency: LFO speed (0.01 - 20 Hz)
 * - Depth: Modulation amount (0 - 1)
 * - Delay: Time before LFO starts (0 - 5 seconds)
 * - Smoothness: For random wave, controls interpolation smoothness (0 - 1)
 */
export function LFONode({ id, data }) {
  const { setNodes } = useReactFlow();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const phaseRef = useRef(0);

  // LFO parameters
  const [waveform, setWaveform] = useState(data?.waveform || 'sine');
  const [frequency, setFrequency] = useState(data?.frequency || 5);
  const [depth, setDepth] = useState(data?.depth || 0.5);
  const [delay, setDelay] = useState(data?.delay || 0);
  const [smoothness, setSmoothness] = useState(data?.smoothness || 0.5);

  // Update node data whenever parameters change
  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              waveform,
              frequency,
              depth,
              delay,
              smoothness
            }
          };
        }
        return node;
      })
    );

    // Dispatch LFO parameter change event for bird
    window.dispatchEvent(new CustomEvent('lfoChange', {
      detail: { nodeId: id, frequency, depth, waveform }
    }));
  }, [waveform, frequency, depth, delay, smoothness, id, setNodes]);

  // Generate real-time waveform values for bird animation
  useEffect(() => {
    let lastTime = Date.now();
    let randomValue = 0;
    let smoothedRandomValue = 0;

    const generateWaveValue = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000; // Convert to seconds
      lastTime = now;

      // Advance phase based on frequency
      phaseRef.current += frequency * deltaTime * Math.PI * 2;
      if (phaseRef.current > Math.PI * 2) {
        phaseRef.current -= Math.PI * 2;
      }

      let value = 0;
      const phase = phaseRef.current;

      switch (waveform) {
        case 'sine':
          value = Math.sin(phase);
          break;
        case 'triangle':
          value = (2 / Math.PI) * Math.asin(Math.sin(phase));
          break;
        case 'square':
          value = Math.sin(phase) >= 0 ? 1 : -1;
          break;
        case 'sawtooth':
          value = ((phase % (Math.PI * 2)) / (Math.PI * 2)) * 2 - 1;
          break;
        case 'random':
          // Generate new random value
          randomValue = Math.random() * 2 - 1;
          // Smooth it based on smoothness parameter
          smoothedRandomValue = smoothedRandomValue * smoothness + randomValue * (1 - smoothness);
          value = smoothedRandomValue;
          break;
        default:
          value = 0;
      }

      // Dispatch waveform value event for bird
      window.dispatchEvent(new CustomEvent('lfoWaveform', {
        detail: { nodeId: id, value, frequency, depth, waveform }
      }));

      animationRef.current = requestAnimationFrame(generateWaveValue);
    };

    animationRef.current = requestAnimationFrame(generateWaveValue);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frequency, waveform, depth, smoothness, id]);

  // Draw waveform visualization
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = '#f5576c';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const cycles = 2; // Number of cycles to display
    const amplitude = (height / 2) * 0.8 * depth;

    for (let x = 0; x < width; x++) {
      const phase = (x / width) * cycles * Math.PI * 2;
      let y;

      switch (waveform) {
        case 'sine':
          y = height / 2 - Math.sin(phase) * amplitude;
          break;
        case 'triangle':
          y = height / 2 - (2 / Math.PI) * Math.asin(Math.sin(phase)) * amplitude;
          break;
        case 'square':
          y = height / 2 - (Math.sin(phase) >= 0 ? 1 : -1) * amplitude;
          break;
        case 'sawtooth':
          y = height / 2 - ((phase % (Math.PI * 2)) / (Math.PI * 2) * 2 - 1) * amplitude;
          break;
        case 'random':
          // Simplified random visualization - just show noise
          const noise = Math.random() * 2 - 1;
          // Apply smoothness by mixing with previous value
          const prevY = x > 0 ? (ctx.getImageData(x - 1, 0, 1, height).data.findIndex(v => v > 0) || height / 2) : height / 2;
          y = height / 2 - (noise * (1 - smoothness) + ((prevY - height / 2) / amplitude) * smoothness) * amplitude;
          break;
        default:
          y = height / 2;
      }

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [waveform, frequency, depth, smoothness]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '2px solid #8b5cf6',
      borderRadius: 8,
      padding: 12,
      minWidth: 200,
      color: 'white',
      fontSize: '0.9em'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
        LFO
      </div>

      {/* Waveform visualization */}
      <canvas
        ref={canvasRef}
        width={180}
        height={60}
        style={{ width: '100%', marginBottom: 8, borderRadius: 4 }}
      />

      {/* Waveform selector */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'block', marginBottom: 4 }}>
          Waveform:
        </label>
        <select
          value={waveform}
          onChange={(e) => setWaveform(e.target.value)}
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
          <option value="sine">Sine</option>
          <option value="triangle">Triangle</option>
          <option value="square">Square</option>
          <option value="sawtooth">Sawtooth</option>
          <option value="random">Random</option>
        </select>
      </div>

      {/* Frequency control */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Frequency:</span>
          <span>{frequency.toFixed(2)} Hz</span>
        </label>
        <input
          type="range"
          min="0.01"
          max="20"
          step="0.01"
          value={frequency}
          onChange={(e) => setFrequency(parseFloat(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Depth control */}
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

      {/* Delay control */}
      <div className="nodrag nopan" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Delay:</span>
          <span>{delay.toFixed(2)} s</span>
        </label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.01"
          value={delay}
          onChange={(e) => setDelay(parseFloat(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Smoothness control (only for random waveform) */}
      {waveform === 'random' && (
        <div className="nodrag nopan" style={{ marginBottom: 8 }}>
          <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
            <span>Smoothness:</span>
            <span>{(smoothness * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={smoothness}
            onChange={(e) => setSmoothness(parseFloat(e.target.value))}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      )}

      {/* Output handle (modulation output) */}
      <Handle
        type="source"
        position={Position.Right}
        id="modulation-out"
        style={{ background: '#f5576c', top: '50%' }}
      />
    </div>
  );
}
