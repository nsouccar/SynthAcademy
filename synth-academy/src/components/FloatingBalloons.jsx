import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

function FallingBalloon({ initialPosition, audioLevel, fallSpeed, driftSpeed }) {
  const meshRef = useRef();
  const { scene } = useGLTF('/blurry+face+3d+model.glb');
  const [position, setPosition] = useState(initialPosition);
  const startTimeRef = useRef(Date.now());

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      // Fall from top to bottom
      const newY = initialPosition[1] - (elapsed * fallSpeed);

      // Horizontal drift
      const drift = Math.sin(elapsed * driftSpeed) * 2;

      // Reset balloon to top when it falls off screen
      if (newY < -15) {
        startTimeRef.current = Date.now();
        const newX = (Math.random() - 0.5) * 20;
        setPosition([newX, 15, initialPosition[2]]);
      } else {
        meshRef.current.position.set(
          initialPosition[0] + drift,
          newY,
          initialPosition[2]
        );
      }

      // Slow rotation
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(elapsed * 0.5) * 0.2;

      // Scale with audio level (base size 2-5 based on audio)
      const baseScale = 2.5;
      const scale = baseScale + (audioLevel * 2.5);
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={scene.clone()}
      position={position}
    />
  );
}

export function FloatingBalloons({ audioLevel }) {
  // Create 8 balloons starting at different heights and positions
  const balloons = useMemo(() => [
    { position: [-8, 15, -5], fallSpeed: 1.2, driftSpeed: 0.5 },
    { position: [8, 12, -5], fallSpeed: 1.0, driftSpeed: 0.7 },
    { position: [0, 18, -8], fallSpeed: 0.9, driftSpeed: 0.6 },
    { position: [-5, 10, -6], fallSpeed: 1.1, driftSpeed: 0.8 },
    { position: [6, 14, -7], fallSpeed: 1.3, driftSpeed: 0.55 },
    { position: [-3, 16, -6], fallSpeed: 0.95, driftSpeed: 0.65 },
    { position: [4, 11, -8], fallSpeed: 1.15, driftSpeed: 0.75 },
    { position: [-6, 13, -7], fallSpeed: 1.05, driftSpeed: 0.6 }
  ], []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 2
    }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#00ffff" />
        <spotLight position={[0, 10, 5]} intensity={0.5} color="#ff00ff" />

        {balloons.map((balloon, i) => (
          <FallingBalloon
            key={i}
            initialPosition={balloon.position}
            audioLevel={audioLevel}
            fallSpeed={balloon.fallSpeed}
            driftSpeed={balloon.driftSpeed}
          />
        ))}
      </Canvas>
    </div>
  );
}
