import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RootState, useFrame } from '@react-three/fiber';
import { Engine } from '../game/Engine';
import { Player } from './Player';
import { Utils } from '../Utils';
import { Gun } from './Gun';
import { Timeout } from '../Types';

interface FPSProps {
	engine: Engine;
    start: THREE.Vector3;
    loaded: boolean;
}

export const FPS = (props: FPSProps) => {
	const { engine, start, loaded } = props;

    const [ shooting, setShooting ] = useState<boolean>(false);

	const player = useRef<THREE.Group>(null);
    const gun = useRef<THREE.Group>(null);

    const playerDirection: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const forwardVector: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const sideVector: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const velocity: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const shootingData: Timeout = useMemo(() => { return { count: 0 } }, []);

    const handleMouseDown = useCallback(() => {
        clearTimeout(shootingData.timeout);
        setShooting(true);
        shootingData.timeout = setTimeout(() => setShooting(false), 100);
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
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.body.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [engine, player, playerDirection, handleMouseMove, handleMouseDown]);

    useEffect(() => {
        engine.camera.position.set(0, 0, 0);
        engine.camera.rotation.order = 'YXZ';
        engine.camera.rotation.set(0, 0, 0);
    }, [engine.camera, player]);

    const controls = useCallback((delta: number) => {
        if (loaded) {
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
            if (engine.keyStates.has('KeyE')) {
                engine.intersectGroup(engine.raycaster, engine.transitionGroup, (intersection: THREE.Intersection<THREE.Object3D<THREE.Event>>) => {
                    if (intersection.distance < 1 && engine.object3DIdToWorldObjectId.has(intersection.object.uuid)) {
                        const switchId = engine.object3DIdToWorldObjectId.get(intersection.object.uuid);
                        if (switchId && engine.switches.has(switchId)) {
                            engine.switches.get(switchId)!(true);
                        }
                    }
                });
            }
            if (engine.onFloor) {
                if (engine.keyStates.has('Space')) {
                    velocity.y = 15;
                }
            }
        }
    }, [engine, forwardVector, loaded, sideVector, velocity]);

    useFrame((state: RootState, delta: number) => {
		controls(delta);
    });

    useEffect(() => {
        if (gun.current) {
            gun.current.scale.set(0.05, 0.05, 0.05);
            gun.current.position.set(0.0625, -0.0625, -0.125);
            gun.current.rotation.set(-Math.PI / 4, Math.PI / 2, Math.PI / 4);
            engine.camera.add(gun.current);
        }
    }, [engine, gun]);
    
	return (
        <Player 
            player={player} 
            engine={engine} 
            velocity={velocity} 
            gravity={30} 
            start={start} 
            radius={0.35} 
            height={1} 
            loaded={loaded}
        >
            <Gun group={gun} engine={engine} shooting={shooting} />
        </Player>
	);
}
