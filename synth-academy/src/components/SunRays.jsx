import React, { useEffect, useRef, useState } from 'react';

/**
 * SunRays - Animated sun with oscillator-reactive rays
 * The rays pulse and wave based on the active oscillator waveforms
 */
export function SunRays({ audioLevel = 0 }) {
  const canvasRef = useRef(null);
  const [waveformData, setWaveformData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef(null);
  const lastWaveformTimeRef = useRef(0);

  // Listen for waveform data from oscillators
  useEffect(() => {
    const handleWaveformUpdate = (event) => {
      setWaveformData(event.detail.waveform || []);
      lastWaveformTimeRef.current = Date.now();
      setIsPlaying(true);
    };

    window.addEventListener('oscillatorWaveform', handleWaveformUpdate);
    return () => window.removeEventListener('oscillatorWaveform', handleWaveformUpdate);
  }, []);

  // Check if audio is still playing (if no waveform update in 200ms, consider it stopped)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (Date.now() - lastWaveformTimeRef.current > 200) {
        setIsPlaying(false);
        setWaveformData([]);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, []);

  // Draw the sun with animated rays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Sun position (top right)
    const sunX = width - 150;
    const sunY = 150;
    const sunRadius = 60;
    const numRays = 16;

    let rotation = 0;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      rotation += 0.005;

      // Only draw waveform rays when audio is playing
      if (isPlaying && waveformData.length > 0) {
        // Draw waveform rays - each ray shows the actual waveform pattern
        for (let i = 0; i < numRays; i++) {
          const angle = (i / numRays) * Math.PI * 2 + rotation;
          const rayLength = 120 + audioLevel * 50;
          const waveformSegments = Math.min(64, waveformData.length); // Use more segments for smoother wave

          ctx.save();
          ctx.translate(sunX, sunY);
          ctx.rotate(angle);

          // Draw the waveform pattern
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 220, 100, ${0.6 + audioLevel * 0.3})`;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Draw the waveform extending outward from sun
          for (let j = 0; j < waveformSegments; j++) {
            const progress = j / waveformSegments;

            // Get waveform value (normalized -1 to 1)
            const waveIndex = Math.floor((j / waveformSegments) * waveformData.length);
            const waveValue = waveformData[waveIndex] || 0;

            // Distance from sun center
            const baseDistance = sunRadius + (rayLength * progress);

            // Perpendicular offset based on waveform amplitude
            // Amplify the offset so the wave pattern is clearly visible
            const amplitude = 25 + audioLevel * 10; // Dynamic amplitude
            const offset = waveValue * amplitude;

            if (j === 0) {
              ctx.moveTo(baseDistance, offset);
            } else {
              ctx.lineTo(baseDistance, offset);
            }
          }

          ctx.stroke();

          // Add glow effect for emphasis
          ctx.shadowColor = 'rgba(255, 220, 100, 0.5)';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.restore();
        }
      }

      // Draw sun glow
      const glowGradient = ctx.createRadialGradient(
        sunX, sunY, 0,
        sunX, sunY, sunRadius + 30
      );
      glowGradient.addColorStop(0, 'rgba(255, 240, 150, 0.3)');
      glowGradient.addColorStop(0.5, 'rgba(255, 220, 100, 0.2)');
      glowGradient.addColorStop(1, 'rgba(255, 200, 80, 0)');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius + 30, 0, Math.PI * 2);
      ctx.fill();

      // Draw sun core
      const sunGradient = ctx.createRadialGradient(
        sunX - sunRadius * 0.3, sunY - sunRadius * 0.3, 0,
        sunX, sunY, sunRadius
      );
      sunGradient.addColorStop(0, '#ffeb99');
      sunGradient.addColorStop(0.5, '#ffdc66');
      sunGradient.addColorStop(1, '#ffcc33');

      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveformData, audioLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
}
