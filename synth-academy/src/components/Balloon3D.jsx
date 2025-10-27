import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

function BalloonModel({ scale }) {
  const meshRef = useRef();
  const { scene } = useGLTF('/blurry+face+3d+model.glb');

  useFrame(() => {
    if (meshRef.current) {
      // Slow rotation for visual interest
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={scene}
      scale={scale}
    />
  );
}

export function Balloon3D({ scale = 1, style = {} }) {
  return (
    <div style={{
      width: '200px',
      height: '200px',
      ...style
    }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#00ffff" />
        <spotLight position={[0, 10, 0]} intensity={0.5} color="#ff00ff" />
        <BalloonModel scale={scale} />
      </Canvas>
    </div>
  );
}
