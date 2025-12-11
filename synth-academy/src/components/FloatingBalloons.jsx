import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';

function FallingBalloon({ initialPosition, audioLevel, fallSpeed, driftSpeed }) {
  const groupRef = useRef();
  const stringRef = useRef();
  const [position, setPosition] = useState(initialPosition);
  const startTimeRef = useRef(Date.now());

  useFrame(() => {
    if (groupRef.current) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      // Fall from top to bottom
      const newY = initialPosition[1] - (elapsed * fallSpeed);

      // Horizontal drift
      const drift = Math.sin(elapsed * driftSpeed) * 2;

      // Reset balloon to top when it falls off screen
      if (newY < -15) {
        startTimeRef.current = Date.now();
        // Avoid center by biasing to edges: -20 to -5 or 5 to 20
        const isLeftSide = Math.random() > 0.5;
        const newX = isLeftSide
          ? -20 + (Math.random() * 15)  // -20 to -5
          : 5 + (Math.random() * 15);   // 5 to 20
        setPosition([newX, 15, initialPosition[2]]);
      } else {
        groupRef.current.position.set(
          initialPosition[0] + drift,
          newY,
          initialPosition[2]
        );
      }

      // Slow rotation for balloon
      groupRef.current.rotation.y += 0.01;
      groupRef.current.rotation.x = Math.sin(elapsed * 0.5) * 0.2;

      // Sway the string independently - pendulum motion
      if (stringRef.current) {
        stringRef.current.rotation.x = Math.sin(elapsed * 2.5) * 0.3;
        stringRef.current.rotation.z = Math.cos(elapsed * 1.8) * 0.2;
      }

      // Scale with audio level (smaller balloons)
      const baseScale = 0.8;
      const scale = baseScale + (audioLevel * 0.5);
      groupRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Balloon - glossy rubber look */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color="#ff2020"
          metalness={0.0}
          roughness={0.15}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          reflectivity={0.9}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Balloon knot */}
      <mesh position={[0, -1.05, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshPhysicalMaterial
          color="#cc1818"
          metalness={0.0}
          roughness={0.3}
        />
      </mesh>
      {/* String - pivots from top */}
      <group position={[0, -1.15, 0]}>
        <mesh ref={stringRef} position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2.5, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
}

export function FloatingBalloons({ audioLevel }) {
  // Create just 3 balloons - sporadic timing and positions, avoiding center
  const balloons = useMemo(() => [
    { position: [-12, 15, -5], fallSpeed: 0.8, driftSpeed: 0.4 },
    { position: [14, 20, -6], fallSpeed: 1.3, driftSpeed: 0.6 },
    { position: [-16, 10, -7], fallSpeed: 1.0, driftSpeed: 0.5 }
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
        {/* Environment for glossy reflections */}
        <Environment preset="city" />

        <ambientLight intensity={0.8} />
        {/* Key light - creates the main highlight */}
        <directionalLight position={[-5, 8, 5]} intensity={2} color="#ffffff" />
        {/* Fill light */}
        <pointLight position={[10, 5, 10]} intensity={1.0} />
        {/* Rim light for edge definition */}
        <pointLight position={[-10, -5, -5]} intensity={0.6} color="#ffcccc" />

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
