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
    loaded: boolean;
    children?: React.ReactNode;
}

export const Player = (props: PlayerProps) => {
	const { engine, player, velocity, gravity, start, radius, height, loaded, children } = props;
    const capsule = useMemo(() => new Capsule(
        new THREE.Vector3(start.x, start.y, start.z),
        new THREE.Vector3(start.x, start.y + height, start.z), 
        radius
    ), [height, radius, start]);

    useEffect(() => {
        player.current && player.current.add(engine.camera);
    }, [engine, player]);

    const calculatePosition = useCallback((delta: number, group: THREE.Group) => {
        if (loaded) {
            let damping = Math.exp(-2 * delta) - 1;
            if (!engine.onFloor) {
                velocity.y -= gravity * delta;
                // small air resistance
                damping *= 0.05;
            }
            velocity.addScaledVector(velocity, damping);
            const deltaPosition = velocity.clone().multiplyScalar(delta);
            capsule.translate(deltaPosition);
            group.position.copy(capsule.end);
        }
    }, [capsule, engine.onFloor, gravity, velocity, loaded]);

    useFrame((state: RootState, delta: number) => {
        engine.collisions(capsule, velocity);
        engine.teleportPlayerIfOob(capsule, height, radius, velocity);
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
