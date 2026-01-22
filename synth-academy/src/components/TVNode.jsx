import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';
import { Handle, Position } from 'reactflow';

/**
 * TVNode - Visualize waveform at any point in the effects chain
 *
 * Acts as a pass-through node with real-time waveform visualization
 * Can be placed anywhere in the signal chain to see what the audio looks like
 */
export function TVNode({ id, data }) {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const gainRef = useRef(null);
  const animationRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    console.log('TV Node: Initializing audio nodes for', id);

    // Simple approach: just a pass-through gain node
    const gain = new Tone.Gain(1);

    // Connect an analyser directly to Tone.Destination (the speakers)
    // This way we always see what's going to the speakers
    const analyser = new Tone.Analyser('waveform', 2048);
    Tone.Destination.connect(analyser);

    gainRef.current = gain;
    analyserRef.current = analyser;

    console.log('TV Node: Connecting analyser to Destination', { id, gain, analyser });

    // Register the gain node with audio graph
    audioGraph.registerNode(id, gain);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioGraph.unregisterNode(id);
      // Don't disconnect the analyser from Destination - let it keep listening
      // analyser.dispose();
      gain.dispose();
    };
  }, [id]);

  // Draw waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      // Clear canvas with retro TV effect
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      // Add subtle scanlines
      ctx.fillStyle = 'rgba(0, 255, 0, 0.02)';
      for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 2);
      }

      if (analyserRef.current) {
        const waveform = analyserRef.current.getValue();

        // Check if there's actual signal (lower threshold for more sensitivity)
        const hasSignal = waveform.some(val => Math.abs(val) > 0.001);

        // Debug: Always log waveform data (even when no signal)
        if (Math.random() < 0.01) { // Log occasionally to avoid spam
          const maxVal = Math.max(...waveform.map(Math.abs));
          // Also check the meter value
          const meterValue = gainRef.current?._internalChannels?.[0]?._internalChannels?.[1]?.getValue?.() || 0;
          console.log('TV Node: Waveform check', {
            hasSignal,
            maxVal,
            sampleValues: waveform.slice(0, 10),
            analyserExists: !!analyserRef.current,
            gainExists: !!gainRef.current,
            gainConnections: gainRef.current?._internalChannels?.length || 0
          });
        }

        setIsActive(hasSignal);

        // Always draw the waveform, even if it's just a flat line
        ctx.strokeStyle = hasSignal ? '#00ff00' : '#003300';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const sliceWidth = width / waveform.length;
        let x = 0;

        for (let i = 0; i < waveform.length; i++) {
          const v = waveform[i];
          const y = (v + 1) * height / 2; // Convert from -1..1 to 0..height

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();

        // Add glow effect if active
        if (hasSignal) {
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // Draw center line
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        border: '3px solid #7f8c8d',
        borderRadius: 12,
        padding: 12,
        minWidth: 240,
        color: 'white',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#00ff00', width: 24, height: 24, left: -12 }}
      />

      {/* Title */}
      <div style={{
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        fontSize: '1em',
        fontFamily: 'monospace',
        color: isActive ? '#00ff00' : '#7f8c8d',
        textShadow: isActive ? '0 0 10px rgba(0, 255, 0, 0.5)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        TV MONITOR
      </div>

      {/* Waveform Display - Retro TV Style */}
      <div style={{
        background: '#000',
        border: '2px solid #555',
        borderRadius: 4,
        padding: 4,
        marginBottom: 8,
        boxShadow: 'inset 0 0 20px rgba(0, 255, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <canvas
          ref={canvasRef}
          width={220}
          height={120}
          style={{
            width: '100%',
            display: 'block',
            imageRendering: 'pixelated'
          }}
        />

        {/* TV glass reflection effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Status indicator */}
      <div style={{
        fontSize: '0.7em',
        textAlign: 'center',
        color: isActive ? '#00ff00' : '#7f8c8d',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {isActive ? '● SIGNAL DETECTED' : '○ NO SIGNAL'}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#00ff00', width: 24, height: 24, right: -12 }}
      />
    </div>
  );
}
