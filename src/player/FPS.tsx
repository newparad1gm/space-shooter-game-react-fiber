import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RootState, useFrame } from '@react-three/fiber';
import { Engine } from '../game/Engine';
import { Player } from './Player';
import { Utils } from '../Utils';

interface FPSProps {
	engine: Engine;
}

export const FPS = (props: FPSProps) => {
	const { engine } = props;
	const player = useRef<THREE.Group>(null);

    const playerDirection: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const forwardVector: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const sideVector: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const velocity: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);

    const handleMouseUp = useCallback(() => {
        // fire based on camera or ship direction whether first or third person
        if (document.pointerLockElement !== null && player.current) {
            engine.camera.getWorldDirection(playerDirection);
            playerDirection.negate();
            engine.shoot(player.current.getWorldPosition(new THREE.Vector3()), playerDirection.clone(), engine.camera.getWorldQuaternion(new THREE.Quaternion()));
        }
    }, [engine, player, playerDirection]);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (document.pointerLockElement === document.body && player.current) {
            const { movementX, movementY } = event;
            engine.camera.rotation.y -= movementX / 500;
            const verticalLook = engine.camera.rotation.x - (movementY / 500);
            if (verticalLook < 1.5 && verticalLook > -1.5) {
                engine.camera.rotation.x = verticalLook;
            }
        }
    }, [engine, player]);

    useEffect(() => {
        document.body.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.body.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [engine, player, playerDirection, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        engine.camera.position.set(0, 0, 0);
        engine.camera.rotation.order = 'YXZ';
        engine.camera.rotation.set(0, 0, 0);
    }, [engine.camera, player]);

    const controls = useCallback((delta: number) => {
        let speedDelta = delta * 8;
        Utils.getForwardVector(engine.camera, forwardVector);
        Utils.getSideVector(engine.camera, sideVector);
        if (engine.keyStates.has('KeyW')) {
            velocity.add(forwardVector.multiplyScalar(speedDelta));
        }
        if (engine.keyStates.has('KeyS')) {
            velocity.add(forwardVector.multiplyScalar(-speedDelta));
        }
        if (engine.keyStates.has('KeyA')) {
            velocity.add(sideVector.multiplyScalar(-speedDelta));
        }
        if (engine.keyStates.has('KeyD')) {
            velocity.add(sideVector.multiplyScalar(speedDelta));
        }
        if (engine.onFloor) {
            if (engine.keyStates.has('Space')) {
                velocity.y = 15;
            }
        }
    }, [engine, forwardVector, sideVector, velocity]);

    useFrame((state: RootState, delta: number) => {
		controls(delta);
    });

	return (
        <Player player={player} engine={engine} velocity={velocity} gravity={30} start={new THREE.Vector3(0, 5, 0)} radius={1} height={1} />
	);
}
