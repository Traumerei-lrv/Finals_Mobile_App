import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, MathUtils, Vector3 } from 'three';

const OFFICE_BUILDING_SOURCE = require('../assets/3D_building/BuildingNIlee.glb');

export default function OfficeLocationModel({ interactive = false, modelSource = OFFICE_BUILDING_SOURCE }) {
  const clusterRef = useRef();
  const gltf = useLoader(GLTFLoader, modelSource);
  const modelState = useMemo(() => {
    const scene = gltf?.scene?.clone(true) ?? null;

    if (!scene) {
      return { scene: null, scale: 1 };
    }

    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    scene.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2.8 / maxDim : 1;

    return { scene, scale };
  }, [gltf]);

  useFrame((state, delta) => {
    if (!clusterRef.current) {
      return;
    }

    clusterRef.current.rotation.y += delta * 0.18;

    if (interactive) {
      clusterRef.current.rotation.x = MathUtils.clamp(
        Math.sin(state.clock.elapsedTime * 0.4) * 0.05,
        -0.08,
        0.08
      );
    }
  });

  if (!modelState.scene) {
    return null;
  }

  return (
    <group ref={clusterRef} scale={modelState.scale} position={[0, -0.25, 0]}>
      <primitive object={modelState.scene} />
    </group>
  );
}
