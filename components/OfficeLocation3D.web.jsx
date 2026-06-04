import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas } from '@react-three/fiber';
import OfficeLocationModel from './OfficeLocationModel';

export default function OfficeLocation3D({ height = 220, interactive = false }) {
  return (
    <View style={[styles.container, { height }]}>
      <Canvas camera={{ position: [3.6, 2.1, 4.1], fov: 40 }} shadows>
        <color attach="background" args={["#f2f6ff"]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3.5, 5, 2]} intensity={1.05} castShadow />
        <directionalLight position={[-2, 2, -3]} intensity={0.35} />
        <OfficeLocationModel interactive={interactive} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
});
