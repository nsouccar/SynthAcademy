import React, { useRef, useEffect, useState } from 'react';

export function RadioTowers({ oscillatorFrequency = 440 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Define wire positions - straight horizontal lines connecting towers at center
    const wires = [
      { x1: 0.05, y1: 0.50, x2: 0.15, y2: 0.50, height: 0.15 },
      { x1: 0.15, y1: 0.50, x2: 0.25, y2: 0.50, height: 0.15 },
      { x1: 0.25, y1: 0.50, x2: 0.35, y2: 0.50, height: 0.15 },
      { x1: 0.35, y1: 0.50, x2: 0.45, y2: 0.50, height: 0.15 },
      { x1: 0.45, y1: 0.50, x2: 0.55, y2: 0.50, height: 0.15 },
      { x1: 0.55, y1: 0.50, x2: 0.65, y2: 0.50, height: 0.15 },
      { x1: 0.65, y1: 0.50, x2: 0.75, y2: 0.50, height: 0.15 },
      { x1: 0.75, y1: 0.50, x2: 0.85, y2: 0.50, height: 0.15 },
      { x1: 0.85, y1: 0.50, x2: 0.95, y2: 0.50, height: 0.15 },
    ];

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update time based on frequency (higher frequency = faster vibration)
      const speed = (oscillatorFrequency / 440) * 0.1; // Normalize to A440
      time += speed;

      wires.forEach((wire, index) => {
        const x1 = wire.x1 * canvas.width;
        const y1 = wire.y1 * canvas.height;
        const x2 = wire.x2 * canvas.width;
        const y2 = wire.y2 * canvas.height;
        const maxHeight = wire.height * canvas.height;

        // Draw vibrating wire using quadratic curve
        ctx.beginPath();
        ctx.moveTo(x1, y1);

        // Calculate number of waves based on frequency
        const numWaves = Math.max(1, Math.floor(oscillatorFrequency / 200));
        const segments = numWaves * 10;

        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const x = x1 + (x2 - x1) * t;
          const baseY = y1 + (y2 - y1) * t;

          // Create wave pattern
          const waveOffset = Math.sin(t * Math.PI * numWaves + time + index) *
                            (maxHeight * (oscillatorFrequency > 0 ? 1 : 0.1));

          const y = baseY + waveOffset;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Wire styling - thicker like node connection lines
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 + (oscillatorFrequency > 0 ? 0.4 : 0)})`;
        ctx.lineWidth = 4; // Thicker like canvas connection lines
        ctx.shadowBlur = oscillatorFrequency > 0 ? 15 : 0;
        ctx.shadowColor = '#00ffff';
        ctx.stroke();

        // Add glow overlay
        ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + (oscillatorFrequency > 0 ? 0.3 : 0)})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = oscillatorFrequency > 0 ? 20 : 0;
        ctx.shadowColor = '#ff00ff';
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [oscillatorFrequency]);

  // SVG Tower component - x and y are decimal percentages (0-1)
  const Tower = ({ x, y, width, height, scale = 1 }) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const actualX = x * canvas.width;
    const actualY = y * canvas.height;

    return (
      <g transform={`translate(${actualX}, ${actualY}) scale(${scale})`}>
        {/* Main tower structure - triangular lattice */}
        <line x1={width/2} y1={0} x2={0} y2={height} stroke="#4a5568" strokeWidth="3" />
        <line x1={width/2} y1={0} x2={width} y2={height} stroke="#4a5568" strokeWidth="3" />
        <line x1={0} y1={height} x2={width} y2={height} stroke="#4a5568" strokeWidth="3" />

        {/* Cross beams */}
        {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => (
          <line
            key={i}
            x1={width/2 - (width/2 * (1-ratio))}
            y1={height * ratio}
            x2={width/2 + (width/2 * (1-ratio))}
            y2={height * ratio}
            stroke="#4a5568"
            strokeWidth="2"
          />
        ))}

        {/* Antenna on top */}
        <line x1={width/2} y1={0} x2={width/2} y2={-20} stroke="#ff6b6b" strokeWidth="2" />
        <circle cx={width/2} cy={-25} r="5" fill="#ff6b6b" />

        {/* Lights */}
        <circle cx={width/2} cy={height * 0.3} r="3" fill="#ffff00" opacity="0.8" />
        <circle cx={width/2} cy={height * 0.7} r="3" fill="#ffff00" opacity="0.8" />
      </g>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none'
    }}>
      {/* Blurred background image for atmosphere */}
      <img
        src="/Screenshot 2025-10-25 at 3.04.33 AM.png"
        alt="Radio Towers"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          filter: 'blur(8px) brightness(0.4)',
          opacity: 0.6
        }}
      />

      {/* SVG Drawn Towers */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      >
        {/* Straight horizontal line of towers across the center of screen */}
        <Tower x={0.05} y={0.50} width={60} height={200} scale={1.4} />
        <Tower x={0.15} y={0.50} width={60} height={200} scale={1.4} />
        <Tower x={0.25} y={0.50} width={60} height={200} scale={1.4} />
        <Tower x={0.35} y={0.50} width={60} height={200} scale={1.4} />
        <Tower x={0.45} y={0.50} width={60} height={200} scale={1.4} />
        <Tower x={0.55} y={0.50} width={60} height={200} scale={1.4} />
        <Tower x={0.65} y={0.50} width={60} height={200} scale={1.4} />
        <Tower x={0.75} y={0.50} width={60} height={200} scale={1.4} />
        <Tower x={0.85} y={0.50} width={60} height={200} scale={1.4} />
        <Tower x={0.95} y={0.50} width={60} height={200} scale={1.4} />
      </svg>

      {/* Vibrating wires overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
}
