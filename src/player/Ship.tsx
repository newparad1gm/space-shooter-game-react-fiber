import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RootState, useFrame } from '@react-three/fiber';
import { Engine } from '../game/Engine';
import { Player } from './Player';
import { Spaceship } from '../objects/Spaceship';
import { Utils } from '../Utils';

interface ShipProps {
	engine: Engine;
    start: THREE.Vector3;
    loaded: boolean;
}

export const Ship = (props: ShipProps) => {
	const { engine, start, loaded } = props;
	const ship = useRef<THREE.Group>(null);
    const model = useRef<THREE.Group>(null);
    const front = useRef<THREE.Object3D>(null);
    const engineRef = useRef<THREE.Group>(null);
    const [ firstPerson, setFirstPerson ] = useState<boolean>(false);
    const [ engineOn, setEngineOn ] = useState<boolean>(false);

    const shipDirection: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const cameraOrigin: THREE.Vector3 = useMemo(() => new THREE.Vector3(0, 3.0, 0), []);
    const forwardVector: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const sideVector: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const frontPosition: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const velocity: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const shipray: THREE.Raycaster = useMemo(() => new THREE.Raycaster(), []);
    const shiprayPosition: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const shiprayDirection: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);

    const setThirdPersonCamera = useCallback((ship: THREE.Group, cameraOrigin: THREE.Vector3, movementX: number, movementY: number) => {
        // third person camera based on sphere around the camera origin, camera will always look at origin
        if (!firstPerson) {
            const offset = new THREE.Spherical().setFromVector3(
                engine.camera.position.clone().sub(cameraOrigin)
            );
            const phi = offset.phi - movementY * 0.02;
            offset.theta -= movementX * 0.02;
            offset.phi = Math.max(0.5, Math.min(0.9 * Math.PI, phi));
            engine.camera.position.copy(
                cameraOrigin.clone().add(new THREE.Vector3().setFromSpherical(offset))
            );
            engine.camera.lookAt(ship.position.clone().add(cameraOrigin));
        }
    }, [engine.camera, firstPerson]);

    const handleMouseDown = useCallback(() => {
        // fire based on camera or ship direction whether first or third person
        if (document.pointerLockElement !== null && ship.current) {
            let object: THREE.Object3D = engine.camera;
            if (!firstPerson && model.current) {
                object = model.current;
                object.getWorldDirection(shipDirection);
            } else {
                object.getWorldDirection(shipDirection);
                shipDirection.negate();
            }
            engine.shoot(ship.current.getWorldPosition(new THREE.Vector3()), shipDirection.clone(), object.getWorldQuaternion(new THREE.Quaternion()));
        }
    }, [engine, firstPerson, model, ship, shipDirection]);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (document.pointerLockElement === document.body && ship.current) {
            const { movementX, movementY } = event;
            if (!firstPerson) {
                setThirdPersonCamera(ship.current, cameraOrigin, movementX, movementY);
            } else {
                engine.camera.rotation.y -= movementX / 500;
                const verticalLook = engine.camera.rotation.x - (movementY / 500);
                if (verticalLook < 1.5 && verticalLook > -1.5) {
                    engine.camera.rotation.x = verticalLook;
                }
            }
        }
    }, [cameraOrigin, engine, firstPerson, ship, setThirdPersonCamera]);

    useEffect(() => {
        document.body.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.body.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [cameraOrigin, engine, firstPerson, model, ship, shipDirection, handleMouseMove, handleMouseDown]);

    useEffect(() => {
        if (firstPerson && ship.current) {
            engine.camera.position.set(0, 0, 0);
            engine.camera.rotation.order = 'YXZ';
            engine.camera.rotation.set(0, 0, 0);
            front.current && engine.camera.lookAt(front.current.getWorldPosition(frontPosition));
        } else if (!firstPerson && model.current && ship.current) {
            model.current.quaternion.copy(engine.camera.quaternion);
            const position = new THREE.Vector3(0, 3, 6);
            position.applyQuaternion(engine.camera.quaternion);
            engine.camera.position.copy(position);
            engine.camera.rotation.order = 'XYZ';
        }
    }, [engine.camera, firstPerson, frontPosition, model, ship]);

    const rotateQuat = useCallback((model: THREE.Group) => {
        // rotate model position towards camera direction in third person
        model.quaternion.slerp(engine.camera.quaternion, 0.1);
    }, [engine.camera]);

    const controls = useCallback((delta: number) => {
        if (loaded) {
            let speedDelta = delta * 8;
            let object: THREE.Object3D = engine.camera;
            if (!firstPerson && model.current) {
                object = model.current;
            }
            Utils.getForwardVector(object, forwardVector);
            Utils.getSideVector(object, sideVector);
            if (!firstPerson && model.current) {
                forwardVector.negate();
                sideVector.negate();
            }
            if (engine.keyStates.has('KeyW')) {
                velocity.add(forwardVector.multiplyScalar(speedDelta));
            }
            if (engine.keyStates.has('KeyA')) {
                velocity.add(sideVector.multiplyScalar(-speedDelta));
            }
            if (engine.keyStates.has('KeyD')) {
                velocity.add(sideVector.multiplyScalar(speedDelta));
            }
            if (engine.keyStates.has('KeyS')) {
                velocity.multiplyScalar(0.98);
            }
            if (engine.keyStates.has('KeyT')) {
                engine.keyStates.delete('KeyT');
                setFirstPerson(!firstPerson);
            }
        }
    }, [engine, firstPerson, forwardVector, loaded, sideVector, velocity, setFirstPerson]);

    useFrame((state: RootState, delta: number) => {
		controls(delta);
        const speed = Utils.speed(velocity);
        let tempRay = engine.raycaster;
        if (!firstPerson && model.current) {
            ship.current && engine.camera.lookAt(ship.current.position.clone().add(cameraOrigin));
            tempRay = shipray;
            model.current.getWorldDirection(shiprayDirection);
            shiprayDirection.negate();
            tempRay.set(model.current.getWorldPosition(shiprayPosition), shiprayDirection);
        }
        engine.intersectGroup(tempRay, engine.transitionGroup, (intersection: THREE.Intersection<THREE.Object3D<THREE.Event>>) => {
            if (intersection.distance < 0.4 && speed > 0.1 && engine.object3DIdToWorldObjectId.has(intersection.object.uuid)) {
                engine.network.sendId(engine.object3DIdToWorldObjectId.get(intersection.object.uuid)!);
            }
        });

		if (speed > 0.1) {
            model.current && rotateQuat(model.current);
            setEngineOn(true);
            if (!firstPerson && engineRef.current) {
                engineRef.current.position.set(0, 0, 1 + (speed / 8));
                engineRef.current.scale.set(Math.min(1, speed / 4), speed / 4, Math.min(1, speed / 4));
            }
        } else {
            setEngineOn(false);
        }
    });

	return (
        <Player 
            player={ship} 
            engine={engine} 
            velocity={velocity} 
            gravity={0} 
            start={start} 
            radius={1} 
            height={1}
            loaded={loaded}
        >
            <group ref={model}>
                <object3D ref={front} position={[0, 0, -3]}></object3D>
                { !firstPerson && <Spaceship /> }
                { engineOn && !firstPerson && 
                <group ref={engineRef} position={[0, 0, 1]} rotation={[Math.PI / 2, 0, Math.PI]}>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.15, 0.4, 1]} />
                        <meshStandardMaterial color='orange' emissive='orange' emissiveIntensity={50} toneMapped={false} opacity={0.5} transparent={true} />
                    </mesh> 
                    <mesh position={[0, -1, 0]} rotation={[0, 0, Math.PI]}>
                        <coneGeometry args={[0.4, 1]} />
                        <meshStandardMaterial color='orange' emissive='orange' emissiveIntensity={50} toneMapped={false} opacity={0.5} transparent={true} />
                    </mesh> 
                </group> }
            </group>
        </Player>
	);
}
