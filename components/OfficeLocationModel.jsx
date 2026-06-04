import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Asset } from 'expo-asset';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Box3, MathUtils, Vector3 } from 'three';

const OFFICE_BUILDING_SOURCE = require('../assets/3D_building/BuildingNIlee.glb');

export default function OfficeLocationModel({ interactive = false }) {
  const clusterRef = useRef();
  const [modelState, setModelState] = useState({ scene: null, scale: 1 });

  useEffect(() => {
    let cancelled = false;

    const loadModel = async () => {
      const asset = Asset.fromModule(OFFICE_BUILDING_SOURCE);
      await asset.downloadAsync();

      const loader = new GLTFLoader();
      loader.load(
        asset.localUri ?? asset.uri,
        (gltf) => {
          if (cancelled) {
            return;
          }

          const scene = gltf.scene.clone(true);
          const box = new Box3().setFromObject(scene);
          const size = new Vector3();
          const center = new Vector3();
          box.getSize(size);
          box.getCenter(center);

          scene.position.sub(center);

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = maxDim > 0 ? 2.8 / maxDim : 1;

          setModelState({ scene, scale });
        },
        undefined,
        () => {
          if (!cancelled) {
            setModelState({ scene: null, scale: 1 });
          }
        }
      );
    };

    void loadModel();

    return () => {
      cancelled = true;
    };
  }, []);

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