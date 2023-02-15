import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RootState, useFrame } from '@react-three/fiber';
import { Engine } from '../game/Engine';
import { Spaceship } from '../objects/Spaceship';
import { Utils } from '../Utils';

interface ShipProps {
	engine: Engine;
}

export const Ship = (props: ShipProps) => {
	const { engine } = props;
	const ship = useRef<THREE.Group>(null);
    const model = useRef<THREE.Group>(null);
    const front = useRef<THREE.Object3D>(null);
    [ engine.firstPerson, engine.setFirstPerson ] = useState<boolean>(false);
    const [ engineOn, setEngineOn ] = useState<boolean>(false);
    const engineRef = useRef<THREE.Group>(null);

    const cameraOrigin: THREE.Vector3 = useMemo(() => new THREE.Vector3(0, 3.0, 0), []);
    const frontPosition: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const playerDirection: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);

    const velocity: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const forwardVector: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const sideVector: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);

    const shipray: THREE.Raycaster = useMemo(() => new THREE.Raycaster(), []);
    const shiprayPosition: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const shiprayDirection: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);

    const setThirdPersonCamera = useCallback((ship: THREE.Group, cameraOrigin: THREE.Vector3, movementX: number, movementY: number) => {
        // third person camera based on sphere around the camera origin, camera will always look at origin
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
    }, [engine.camera]);

    const handleMouseUp = useCallback(() => {
        // fire based on camera or ship direction whether first or third person
        if (document.pointerLockElement !== null && ship.current) {
            let object: THREE.Object3D = engine.camera;
            if (!engine.firstPerson && model.current) {
                object = model.current;
                object.getWorldDirection(playerDirection);
            } else {
                object.getWorldDirection(playerDirection);
                playerDirection.negate();
            }
            engine.shoot(ship.current.getWorldPosition(new THREE.Vector3()), playerDirection, object.getWorldQuaternion(new THREE.Quaternion()));
        }
    }, [engine, model, playerDirection, ship]);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (document.pointerLockElement === document.body && ship.current) {
            const { movementX, movementY } = event;
            if (!engine.firstPerson) {
                setThirdPersonCamera(ship.current, cameraOrigin, movementX, movementY);
            } else {
                engine.camera.rotation.y -= movementX / 500;
                const verticalLook = engine.camera.rotation.x - (movementY / 500);
                if (verticalLook < 1.5 && verticalLook > -1.5) {
                    engine.camera.rotation.x = verticalLook;
                }
            }
        }
    }, [cameraOrigin, engine, ship, setThirdPersonCamera]);

    useEffect(() => {
        if (ship.current) {
            ship.current.add(engine.camera);

            document.addEventListener('mouseup', handleMouseUp);
            document.body.addEventListener('mousemove', handleMouseMove);
        }
    }, [engine, ship, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        if (engine.firstPerson && ship.current) {
            engine.camera.position.set(0, 0, 0);
            engine.camera.rotation.order = 'YXZ';
            engine.camera.rotation.set(0, 0, 0);
            front.current && engine.camera.lookAt(front.current.getWorldPosition(frontPosition));
        } else if (!engine.firstPerson && model.current && ship.current) {
            model.current.quaternion.copy(engine.camera.quaternion);
            const position = new THREE.Vector3(0, 3, 6);
            position.applyQuaternion(engine.camera.quaternion);
            engine.camera.position.copy(position);
            engine.camera.rotation.order = 'XYZ';
        }
    }, [engine.camera, engine.firstPerson, frontPosition, model, ship]);

    const controls = useCallback((delta: number) => {
        let speedDelta = delta * 8;
        let object: THREE.Object3D = engine.camera;
        if (!engine.firstPerson && model.current) {
            object = model.current;
        }
        Utils.getForwardVector(object, forwardVector);
        Utils.getSideVector(object, sideVector);
        if (!engine.firstPerson && model.current) {
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
            engine.setFirstPerson && engine.setFirstPerson(!engine.firstPerson);
        }
    }, [engine, forwardVector, sideVector, velocity]);

    const speed = useCallback(() => {
        return Math.sqrt(velocity.dot(velocity));
    }, [velocity]);

    const rotateQuat = useCallback((model: THREE.Group) => {
        // rotate model position towards camera direction in third person
        model.quaternion.slerp(engine.camera.quaternion, 0.1);
    }, [engine.camera]);

    const calculatePosition = useCallback((delta: number, group: THREE.Group) => {
        let damping = Math.exp(-4 * delta) - 1;
        damping *= 0.05;
        velocity.addScaledVector(velocity, damping);
        const deltaPosition = velocity.clone().multiplyScalar(delta);
        group.position.add(deltaPosition);
        if (!engine.firstPerson) {
            engine.camera.lookAt(group.position.clone().add(cameraOrigin));
        }
    }, [cameraOrigin, engine.camera, engine.firstPerson, velocity]);

    useFrame((state: RootState, delta: number) => {
        ship.current && ship.current.getWorldPosition(engine.playerPosition);
		controls(delta);
        engine.setRay();
        engine.shootRay();
        let tempRay = engine.raycaster;
        if (!engine.firstPerson && model.current) {
            tempRay = shipray;
            tempRay.layers.set(1);
            model.current.getWorldDirection(shiprayDirection);
            shiprayDirection.negate();
            tempRay.set(model.current.getWorldPosition(shiprayPosition), shiprayDirection);
        }
        engine.intersectGroup(tempRay, engine.ringGroup, (intersection: THREE.Intersection<THREE.Object3D<THREE.Event>>) => {
            if (intersection.distance < 0.4 && speed() > 0.1 && engine.meshIdToObjectId.has(intersection.object.uuid)) {
                engine.network.sendId(engine.meshIdToObjectId.get(intersection.object.uuid)!);
            }
        })
		
		if (speed() > 0.1) {
            model.current && rotateQuat(model.current);
            ship.current && calculatePosition(delta, ship.current);
            setEngineOn(true);
            if (!engine.firstPerson && engineRef.current) {
                engineRef.current.position.set(0, 0, 1 + (speed() / 2));
                engineRef.current.scale.set(Math.min(1, speed()), speed(), Math.min(1, speed()));
            }
        } else {
            setEngineOn(false);
        }
    });

	return (
		<group ref={ship} rotation={[0, Math.PI, 0]}>
            <group ref={model}>
                <object3D ref={front} position={[0, 0, -3]}></object3D>
                { !engine.firstPerson && <Spaceship /> }
                { engineOn && 
                <group ref={engineRef} position={[0, 0, 1]} rotation={[Math.PI / 2, 0, Math.PI]}>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.25, 0.5, 1]} />
                        <meshStandardMaterial color='orange' emissive='orange' toneMapped={false} />
                    </mesh> 
                    <mesh position={[0, -1, 0]} rotation={[0, 0, Math.PI]}>
                        <coneGeometry args={[0.5, 1]} />
                        <meshStandardMaterial color='orange' emissive='orange' toneMapped={false} />
                    </mesh> 
                </group> }
            </group>
		</group>
	);
}
