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

    const cameraOrigin: THREE.Vector3 = useMemo(() => new THREE.Vector3(0, 3.0, 0), []);
    const frontPosition: THREE.Vector3 = useMemo(() => new THREE.Vector3(0, 0, 0), []);

    const velocity: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);
    const tempDirection: THREE.Vector3 = useMemo(() => new THREE.Vector3(), []);

    const keyStates: Set<string> = useMemo(() => new Set(), []);

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

    useEffect(() => {
        if (ship.current) {
            ship.current.add(engine.camera);

            document.addEventListener('keydown', event => {
                keyStates.add(event.code);
            });
            document.addEventListener('keyup', event => {
                keyStates.delete(event.code);
            });
            document.addEventListener('mouseup', () => {
                // fire based on camera or ship direction whether first or third person
                if (document.pointerLockElement !== null && ship.current) {
                    let object: THREE.Object3D = engine.camera;
                    let direction = object.getWorldDirection(new THREE.Vector3());
                    direction = direction.negate();
                    if (!engine.firstPerson && model.current) {
                        object = model.current;
                        direction = object.getWorldDirection(direction);
                    }
                    engine.shoot(ship.current.getWorldPosition(new THREE.Vector3()), direction, object.getWorldQuaternion(new THREE.Quaternion()));
                }
            });
            document.body.addEventListener('mousedown', () => {
                document.body.requestPointerLock();
            });
            document.body.addEventListener('mousemove', (event: MouseEvent) => {
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
            });
        }
    }, [cameraOrigin, engine, keyStates, ship, setThirdPersonCamera]);

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
            speedDelta = -speedDelta;
        }
        if (keyStates.has('KeyW')) {
            velocity.add(Utils.getForwardVector(object, tempDirection).multiplyScalar(speedDelta));
        }
        if (keyStates.has('KeyS')) {
            velocity.add(Utils.getForwardVector(object, tempDirection).multiplyScalar(-speedDelta));
        }
        if (keyStates.has('KeyA')) {
            velocity.add(Utils.getSideVector(object, tempDirection).multiplyScalar(-speedDelta));
        }
        if (keyStates.has('KeyD')) {
            velocity.add(Utils.getSideVector(object, tempDirection).multiplyScalar(speedDelta));
        }
        if (keyStates.has('KeyT')) {
            keyStates.delete('KeyT');
            engine.setFirstPerson && engine.setFirstPerson(!engine.firstPerson);
        }
    }, [engine, keyStates, tempDirection, velocity]);

    const speed = useCallback(() => {
        return Math.sqrt(velocity.dot(velocity));
    }, [velocity]);

    const rotateQuat = useCallback((model: THREE.Group) => {
        // rotate model position towards camera direction in third person
        model.quaternion.slerp(engine.camera.quaternion, 0.1);
    }, [engine.camera]);

    const calculatePosition = useCallback((delta: number, group: THREE.Group) => {
        let damping = Math.exp(-4 * delta) - 1;
        damping *= 0.1;
        velocity.addScaledVector(velocity, damping);
        const deltaPosition = velocity.clone().multiplyScalar(delta);
        group.position.add(deltaPosition);
        if (!engine.firstPerson) {
            engine.camera.lookAt(group.position.clone().add(cameraOrigin));
        }
    }, [cameraOrigin, engine.camera, engine.firstPerson, velocity]);

    useFrame((state: RootState, delta: number) => {
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
        } else {
            setEngineOn(false);
        }
    });

	return (
		<group ref={ship} rotation={[0, Math.PI, 0]}>
            <group ref={model}>
                <object3D ref={front} position={[0, 0, -3]}></object3D>
                { !engine.firstPerson && <Spaceship /> }
            </group>
		</group>
	);
}
