/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.1.4 gun.glb -t
*/

import * as THREE from 'three';
import React, { useRef } from 'react';
import { Engine } from '../game/Engine';
import { Scar } from '../objects/Scar';

interface GunProps {
	engine: Engine
	group: React.RefObject<THREE.Group>;
}

export function Gun(props: GunProps) {
	const { engine, group } = props;
    const gun = useRef<THREE.Group>(null);

	return (
		<group ref={group} dispose={null}>
			<Scar group={gun} />
		</group>
	)
}
