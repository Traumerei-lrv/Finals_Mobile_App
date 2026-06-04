import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { MathUtils } from 'three';

function WindowStrip({ positions = [], color = '#dbeafe' }) {
  return (
    <>
      {positions.map((position, index) => (
        <mesh key={`${position.join('-')}-${index}`} position={position}>
          <boxGeometry args={[0.16, 0.16, 0.03]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
        </mesh>
      ))}
    </>
  );
}

export default function OfficeLocationModel({ interactive = false }) {
  const clusterRef = useRef();

  const frontWindows = useMemo(() => {
    const positions = [];
    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        positions.push([-0.45 + col * 0.3, -0.45 + row * 0.28, 0.67]);
      }
    }
    return positions;
  }, []);

  const sideWindows = useMemo(() => {
    const positions = [];
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        positions.push([0.76, -0.32 + row * 0.3, -0.18 + col * 0.34]);
      }
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (!clusterRef.current) {
      return;
    }

    clusterRef.current.rotation.y += delta * 0.2;

    if (interactive) {
      clusterRef.current.rotation.x = MathUtils.clamp(
        Math.sin(state.clock.elapsedTime * 0.45) * 0.08,
        -0.12,
        0.12
      );
      clusterRef.current.position.y = -0.12 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    }
  });

  return (
    <group ref={clusterRef} position={[0, -0.12, 0]} scale={1.1}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]}>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color="#d7e3f4" />
      </mesh>

      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.45, 2.15, 1.3]} />
        <meshStandardMaterial color="#90a4c2" roughness={0.7} metalness={0.18} />
      </mesh>

      <mesh position={[0, 0.23, 0.69]}>
        <boxGeometry args={[1.15, 1.95, 0.08]} />
        <meshStandardMaterial color="#bfd7ea" roughness={0.15} metalness={0.05} transparent opacity={0.9} />
      </mesh>

      <mesh position={[0.77, 0.15, 0]}>
        <boxGeometry args={[0.08, 1.85, 0.92]} />
        <meshStandardMaterial color="#7b8eab" roughness={0.6} metalness={0.12} />
      </mesh>

      <mesh position={[-0.9, -0.38, 0]}>
        <boxGeometry args={[0.5, 0.85, 0.72]} />
        <meshStandardMaterial color="#7f93b5" roughness={0.72} metalness={0.12} />
      </mesh>

      <mesh position={[-0.9, -0.08, 0.37]}>
        <boxGeometry args={[0.26, 0.24, 0.06]} />
        <meshStandardMaterial color="#e0b04b" emissive="#facc15" emissiveIntensity={0.2} />
      </mesh>

      <mesh position={[0.1, 1.34, 0.18]}>
        <cylinderGeometry args={[0.03, 0.03, 0.62, 16]} />
        <meshStandardMaterial color="#495a75" metalness={0.4} roughness={0.4} />
      </mesh>

      <mesh position={[0.1, 1.66, 0.18]}>
        <sphereGeometry args={[0.05, 18, 18]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.7} />
      </mesh>

      <WindowStrip positions={frontWindows} />
      <WindowStrip positions={sideWindows} color="#bfdbfe" />
    </group>
  );
}
