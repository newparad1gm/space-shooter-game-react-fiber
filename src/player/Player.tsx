import React, { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule';
import { RootState, useFrame } from '@react-three/fiber'
import { Engine } from '../game/Engine';

interface PlayerProps {
	engine: Engine;
    player: React.RefObject<THREE.Group>;
    velocity: THREE.Vector3;
    gravity: number;
    start: THREE.Vector3;
    radius: number;
    height: number;
    children?: React.ReactNode;
}

export const Player = (props: PlayerProps) => {
	const { engine, player, velocity, gravity, start, radius, height, children } = props;
    const capsule = useMemo(() => new Capsule(
        new THREE.Vector3(start.x, start.y, start.z),
        new THREE.Vector3(start.x, start.y + height, start.z), 
        radius
    ), [height, radius, start.x, start.y, start.z]);

    useEffect(() => {
        player.current && player.current.add(engine.camera);
    }, [engine, player]);

    const calculatePosition = useCallback((delta: number, group: THREE.Group) => {
        let damping = Math.exp(-4 * delta) - 1;
        if (!engine.onFloor) {
            velocity.y -= gravity * delta;
            // small air resistance
            damping *= 0.05;
        }
        velocity.addScaledVector(velocity, damping);
        const deltaPosition = velocity.clone().multiplyScalar(delta);
        //group.position.add(deltaPosition);
        capsule.end.add(deltaPosition);
        group.position.copy(capsule.end);
    }, [capsule.end, engine.onFloor, gravity, velocity]);

    const collisions = useCallback(() => {
        const result = engine.octree.capsuleIntersect(capsule);
        engine.onFloor = false;
        if (result) {
            engine.onFloor = result.normal.y > 0;
            if (!engine.onFloor) {
                velocity.addScaledVector(result.normal, -result.normal.dot(velocity));
            }
            capsule.translate(result.normal.multiplyScalar(result.depth));
        }
    }, [capsule, engine, velocity]);

    useFrame((state: RootState, delta: number) => {
        collisions();
        player.current && player.current.getWorldPosition(engine.playerPosition);
        engine.setRay();
        engine.shootRay();
        player.current && calculatePosition(delta, player.current);
    });

	return (
		<group ref={player} rotation={[0, Math.PI, 0]}>
            { children }
		</group>
	);
}
