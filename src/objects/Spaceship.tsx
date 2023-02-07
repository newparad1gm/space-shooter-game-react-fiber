import React from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
	nodes: {
		['buffer-0-mesh-0001']: THREE.Mesh;
		['buffer-0-mesh-0001_1']: THREE.Mesh;
		['buffer-0-mesh-0001_2']: THREE.Mesh;
	}
	materials: {
		['lambert4SG.001']: THREE.MeshStandardMaterial;
		['lambert3SG.001']: THREE.MeshStandardMaterial;
		['lambert2SG.001']: THREE.MeshStandardMaterial;
	}
}

export const Spaceship = () => {
	const { nodes, materials } = useGLTF('/gltf/spaceship.gltf') as GLTFResult;

	return (
		<group >
			<mesh geometry={nodes['buffer-0-mesh-0001'].geometry} material={materials['lambert4SG.001']} material-roughness={1} material-metalness={0.25} />
			<mesh geometry={nodes['buffer-0-mesh-0001_1'].geometry} material={materials['lambert3SG.001']} material-roughness={1} material-metalness={0.25} />
			<mesh geometry={nodes['buffer-0-mesh-0001_2'].geometry} material={materials['lambert2SG.001']} material-roughness={1} material-metalness={0.25} />
		</group>
	);
}

useGLTF.preload('/spaceship.gltf')
