import React, { useRef } from 'react';
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

interface SpaceshipProps {
	model: React.RefObject<THREE.Group>;
}

export const Spaceship = () => {
	//const { model } = props;
	const { nodes, materials } = useGLTF('/gltf/spaceship.gltf') as GLTFResult;

	return (
		<group dispose={null} >
			<mesh geometry={nodes['buffer-0-mesh-0001'].geometry} material={materials['lambert4SG.001']} />
			<mesh geometry={nodes['buffer-0-mesh-0001_1'].geometry} material={materials['lambert3SG.001']} />
			<mesh geometry={nodes['buffer-0-mesh-0001_2'].geometry} material={materials['lambert2SG.001']} />
		</group>
	);
}

useGLTF.preload('/spaceship.gltf')
