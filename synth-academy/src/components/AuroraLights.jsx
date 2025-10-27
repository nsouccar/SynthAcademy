import React, { useEffect, useRef, useState } from 'react';

/**
 * AuroraLights - Effect-reactive light beams
 * - Chorus: Shimmering aurora effect
 * - Delay: Echoing light trails
 * - Phaser: Swirling light patterns
 */
export function AuroraLights() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [effectData, setEffectData] = useState({
    chorus: 0,
    delay: 0,
    phaser: 0
  });

  // Listen for effect parameter changes
  useEffect(() => {
    const handleChorusChange = (event) => {
      setEffectData(prev => ({ ...prev, chorus: event.detail.depth || 0 }));
    };

    const handleDelayChange = (event) => {
      setEffectData(prev => ({ ...prev, delay: event.detail.wet || 0 }));
    };

    const handlePhaserChange = (event) => {
      setEffectData(prev => ({ ...prev, phaser: event.detail.wet || 0 }));
    };

    window.addEventListener('chorusChange', handleChorusChange);
    window.addEventListener('delayChange', handleDelayChange);
    window.addEventListener('phaserChange', handlePhaserChange);

    return () => {
      window.removeEventListener('chorusChange', handleChorusChange);
      window.removeEventListener('delayChange', handleDelayChange);
      window.removeEventListener('phaserChange', handlePhaserChange);
    };
  }, []);

  // Draw aurora lights
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.01;

      // Chorus: Shimmering vertical aurora beams
      if (effectData.chorus > 0.1) {
        const numBeams = 8;
        for (let i = 0; i < numBeams; i++) {
          const x = (i / numBeams) * width;
          const shimmer = Math.sin(time * 3 + i) * 0.3 + 0.7;
          const opacity = effectData.chorus * shimmer * 0.4;

          const gradient = ctx.createLinearGradient(x, height, x, 0);
          gradient.addColorStop(0, `rgba(100, 255, 200, ${opacity})`);
          gradient.addColorStop(0.5, `rgba(150, 100, 255, ${opacity * 0.6})`);
          gradient.addColorStop(1, `rgba(100, 255, 200, 0)`);

          ctx.fillStyle = gradient;
          ctx.fillRect(x - 30, 0, 60, height);

          // Add shimmer waves
          ctx.save();
          ctx.globalAlpha = opacity * 0.5;
          ctx.fillStyle = `rgba(200, 255, 255, ${opacity})`;
          const waveHeight = height * 0.6;
          const waveY = height - waveHeight + Math.sin(time * 2 + i * 0.5) * 50;
          ctx.fillRect(x - 20, waveY, 40, 100);
          ctx.restore();
        }
      }

      // Delay: Echoing light trails
      if (effectData.delay > 0.1) {
        const numTrails = 5;
        for (let i = 0; i < numTrails; i++) {
          const offset = (time * 50 + i * 150) % (width + 200);
          const x = offset - 100;
          const opacity = effectData.delay * 0.6 * (1 - i / numTrails);

          // Diagonal light beam
          ctx.save();
          ctx.translate(x, 0);
          ctx.rotate(Math.PI / 6);

          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, `rgba(255, 200, 100, ${opacity})`);
          gradient.addColorStop(0.5, `rgba(255, 150, 200, ${opacity * 0.7})`);
          gradient.addColorStop(1, `rgba(255, 200, 100, 0)`);

          ctx.fillStyle = gradient;
          ctx.fillRect(-15, 0, 30, height * 2);
          ctx.restore();

          // Echo particles
          for (let j = 0; j < 10; j++) {
            const particleY = (j / 10) * height + Math.sin(time + j) * 20;
            ctx.beginPath();
            ctx.arc(x, particleY, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 220, 150, ${opacity * 0.8})`;
            ctx.fill();
          }
        }
      }

      // Phaser: Swirling light patterns
      if (effectData.phaser > 0.1) {
        const numSwirls = 6;
        for (let i = 0; i < numSwirls; i++) {
          const centerX = width / 2 + Math.cos(time * 0.5 + i) * (width * 0.3);
          const centerY = height / 2 + Math.sin(time * 0.7 + i * 0.8) * (height * 0.3);
          const radius = 100 + Math.sin(time * 2 + i) * 50;
          const opacity = effectData.phaser * 0.5;

          // Swirling gradient
          const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
          );
          gradient.addColorStop(0, `rgba(255, 100, 255, ${opacity})`);
          gradient.addColorStop(0.4, `rgba(100, 150, 255, ${opacity * 0.6})`);
          gradient.addColorStop(0.7, `rgba(255, 200, 100, ${opacity * 0.3})`);
          gradient.addColorStop(1, 'rgba(255, 100, 255, 0)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Swirling particles
          const numParticles = 12;
          for (let j = 0; j < numParticles; j++) {
            const angle = (j / numParticles) * Math.PI * 2 + time * 2;
            const particleRadius = radius * 0.8;
            const px = centerX + Math.cos(angle) * particleRadius;
            const py = centerY + Math.sin(angle) * particleRadius;

            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 150, 255, ${opacity * 0.8})`;
            ctx.fill();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [effectData]);

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
        zIndex: 1,
        mixBlendMode: 'screen' // Makes lights blend beautifully
      }}
    />
  );
}
