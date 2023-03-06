import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import { WorldProps } from './WorldLoader';
import { Ship } from '../player/Ship';
import { Lasers } from '../objects/Lasers';
import { Explosions } from '../objects/Explosions';
import { Rings } from '../objects/Rings';
import { Rocks } from '../objects/Rocks';
import { Explosion, JsonResponse, Laser, Timeout, WorldObject } from '../Types';

export const SpaceWorld = (props: WorldProps): JSX.Element => {
	const { engine } = props;
    const [ earthTexture, moonTexture ] = useLoader(THREE.TextureLoader, ['/textures/earth.jpg', '/textures/moon.png']);

    [ engine.activities, engine.setActivities ] = useState<WorldObject[]>([]);
    [ engine.transitions, engine.setTransitions ] = useState<WorldObject[]>([]);
    const [ explosions, setExplosions ] = useState<Explosion[]>([]);
    const [ lasers, setLasers ] = useState<Laser[]>([]);
    const [ loaded, setLoaded ] = useState<boolean>(false);
    const [ controlsLoaded, setControlsLoaded ] = useState<boolean>(false);

    const cameraGroup = useRef<THREE.Group>(null);
    const planets = useRef<THREE.Group>(null);
    const earthMoon = useRef<THREE.Group>(null);
    const earth = useRef<THREE.Mesh>(null);
    const moon = useRef<THREE.Mesh>(null);
    const rocks = useRef<THREE.Group>(null);
    const rings = useRef<THREE.Group>(null);

    const laserData: Timeout = useMemo(() => { return { count: 0 } }, []);
    const explosionData: Timeout = useMemo(() => { return { count: 0 } }, []);
    const positions = useMemo(() => {
        // generate stars
        let positions = []
        for (let i = 0; i < 2000; i++) {
            const r = 4000;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            const x = r * Math.cos(theta) * Math.sin(phi) + (-2000 + Math.random() * 4000);
            const y = r * Math.sin(theta) * Math.sin(phi) + (-2000 + Math.random() * 4000);
            const z = r * Math.cos(phi) + (-2000 + Math.random() * 4000);
            positions.push(x);
            positions.push(y);
            positions.push(z);
        }
        return new Float32Array(positions);
    }, []);

    const addExplosion = useCallback((position: THREE.Vector3, object: THREE.Object3D) => {
        const now = Date.now();
        setExplosions(explosions => [...explosions.filter(({ time }) => now - time <= 1000), { guid: object.uuid, position: position, scale: 1, time: now }]);
        clearTimeout(explosionData.timeout);
        explosionData.timeout = setTimeout(() => setExplosions(explosions => explosions.filter(({ time }) => Date.now() - time <= 1000)), 1000);
    }, [explosionData, setExplosions]);

    useEffect(() => {
        engine.start.set(0, 0, 0);

        engine.addActivity = (activity: JsonResponse) => {    
            const randomScale = () => {
                return (Math.random() + 0.5) * 10;
            };
            const randomPos = () => {
                return (-1 + Math.random() * 2) * 15;
            };
            const object: WorldObject = {
                guid: activity.id,
                data: activity,
                scale: new THREE.Vector3(randomScale(), randomScale(), randomScale()),
                position: new THREE.Vector3(randomPos(), randomPos(), 30 + engine.objectCount * 30)
            }
            engine.idToObject.set(object.guid, object);
            engine.objectCount++;
            engine.setActivities && engine.setActivities([...engine.activities, object]);
        };

        engine.removeActivity = (activityId: string) => {
            if (engine.idToObject.has(activityId)) {
                const rock = engine.idToObject.get(activityId)!;
                rock.object && addExplosion(rock.object.getWorldPosition(new THREE.Vector3()), rock.object);
                engine.setActivities && engine.setActivities(engine.activities.filter(r => r.guid !== rock.guid));
                engine.idToObject.delete(rock.guid);
                rock.object && engine.object3DIdToWorldObjectId.delete(rock.object.uuid);
                engine.setCurrentActivity && engine.setCurrentActivity(undefined);
            }
        };

        engine.addTransition = (transition: JsonResponse) => {
            const randomPos = () => {
                return (-1 + Math.random() * 2) * 5;
            };
            const object: WorldObject = {
                guid: transition.id,
                data: transition,
                scale: new THREE.Vector3(15, 15, 15),
                position: new THREE.Vector3(randomPos(), randomPos(), 30 + engine.objectCount * 30)
            }
            engine.idToObject.set(object.guid, object);
            engine.objectCount++;
            engine.setTransitions && engine.setTransitions([...engine.transitions, object]);
        };

        engine.removeTransition = (transitionId: string) => {
            if (engine.idToObject.has(transitionId)) {
                const ring = engine.idToObject.get(transitionId)!;
                engine.setTransitions && engine.setTransitions(engine.transitions.filter(r => r.guid !== ring.guid));
                engine.idToObject.delete(ring.guid);
                ring.object && engine.object3DIdToWorldObjectId.delete(ring.object.uuid);
            }
        };

        engine.shoot = (position: THREE.Vector3, direction: THREE.Vector3, quaternion: THREE.Quaternion) => {
            const now = Date.now();
            setLasers(lasers => [...lasers.filter(({ time }) => now - time <= 1000), { 
                count: laserData.count++,
                guid: '', 
                time: now, 
                position: position, 
                direction: direction, 
                quaternion: quaternion,
                raycaster: new THREE.Raycaster(position, direction.clone().negate())
            }]);
            clearTimeout(laserData.timeout);
            laserData.timeout = setTimeout(() => setLasers(lasers => lasers.filter(({ time }) => Date.now() - time <= 1000)), 1000);
        };

        setControlsLoaded(true);
    });

    useEffect(() => {
        engine.renderer.setClearColor(new THREE.Color('#020209'));
    }, [engine.renderer]);

    useEffect(() => {
        if (rings.current) {
            engine.transitionGroup = rings.current;
        }
    }, [engine, rings]);

    useEffect(() => {
        if (rocks.current) {
            engine.activityGroup = rocks.current;
        }
    }, [engine, rocks]);

    /*useEffect(() => {
        if (controlsLoaded) {
            if (engine.activities.length === 0) {
                const testRock = {"id":"453be010-a8f1-11ed-b0e3-579384e6ae03","activity":{"name":"TT1A1 Create policy","className":"CreatePolicy","eventName":"CreatePolicy","maxRetryAttempts":null,"retryIntervalSecs":null},"activityId":"63e5b6e7ff668aa80bfe2982","time":1530457220529,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
                engine.addActivity(testRock);
                engine.network.addActivity(testRock);
            }
            if (engine.activities.length === 1) {
                const testRock1 = {"id":"47997f20-a8f1-11ed-b0e3-579384e6ae03","activity":{"name":"TT1A2 Create billing very long activity name, it is so long its very long","className":"CreateBilling","eventName":"CreateBilling","maxRetryAttempts":null,"retryIntervalSecs":null},"activityId":"63e5b6e7ff668aa80bfe2983","time":1530457224498,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
                engine.addActivity(testRock1);
                engine.network.addActivity(testRock1);
            }
        }
    }, [controlsLoaded, engine, engine.activities]);

    useEffect(() => {
        if (controlsLoaded) {
            if (engine.transitions.length === 0) {
                const testRing = {"id":"390cfa90-a8f1-11ed-b0e3-579384e6ae03","stage":{"name":"TT1 Policy Setup","state":"Policy Setup"},"stageId":"63e5b6e7ff668aa80bfe2981","time":1530457200086,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
                engine.addTransition(testRing);
                engine.network.transitionStage(testRing);
            }
        }
    }, [controlsLoaded, engine, engine.transitions]);*/

    useFrame(() => {
        // maintain group with same distance to camera
        if (cameraGroup.current) {
            cameraGroup.current.position.copy(engine.playerPosition);
        }
        // rotate and orbit planets
        if (earth.current && moon.current && earthMoon.current) {
            earth.current.rotation.y += 0.001;
            moon.current.rotation.y += 0.001;
            earthMoon.current.rotation.y += 0.001;
        }
        // laser hit on rocks through the laser raycaster
        if (lasers.length) {
            const lasersHit: Set<string> = new Set();
            for (const laser of lasers) {
                if (laser.group) {
                    const collisionResults = laser.raycaster.intersectObject(engine.activityGroup);
                    if (collisionResults.length && collisionResults[0].point.distanceTo(laser.group.position) < 40) {
                        const collision = collisionResults[0];
                        lasersHit.add(laser.guid);
                        if (collision.object.parent && engine.object3DIdToWorldObjectId.has(collision.object.parent.uuid)) {
                            engine.network.sendId(engine.object3DIdToWorldObjectId.get(collision.object.parent.uuid)!);
                            //engine.removeActivity(engine.object3DIdToWorldObjectId.get(collision.object.parent.uuid)!);
                        }
                    }
                }
            }
            setLasers(lasers.filter(laser => !lasersHit.has(laser.guid)));
        }
    });

    useEffect(() => {
        engine.resetOctree();
        if (rocks.current && engine.activities.length) {
            engine.octree.fromGraphNode(rocks.current);
        }
        setLoaded(true);
    }, [engine, engine.activities, rocks, setLoaded]);

	return (
		<group {...props} dispose={null}>
            <fog attach="fog" args={['#070710', 100, 700]} />
            <ambientLight intensity={0.25} />
            <Lasers lasers={lasers} color={new THREE.Color('red')} />
            <Rocks group={rocks} activities={engine.activities} meshIdToObjectId={engine.object3DIdToWorldObjectId} />
            <Rings group={rings} transitions={engine.transitions} meshIdToObjectId={engine.object3DIdToWorldObjectId} color={new THREE.Color('blue')} />
            <Explosions explosions={explosions} />
            <group ref={cameraGroup}>
                <points>      
                    <bufferGeometry attach="geometry">
                        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                    </bufferGeometry>
                    <pointsMaterial size={15} sizeAttenuation color="white" fog={false} />
                </points>
                <group ref={planets} scale={[50, 50, 50]} position={[-500, -400, 1000]}>
                    <group ref={earthMoon}>
                        <mesh ref={earth}>
                            <sphereGeometry args={[5, 32, 32]} />
                            <meshStandardMaterial map={earthTexture} roughness={1} fog={false} />
                        </mesh>
                        <mesh ref={moon} position={[30, 0, -5]}>
                            <sphereGeometry args={[0.8, 32, 32]} />
                            <meshStandardMaterial map={moonTexture} roughness={1} fog={false} />
                        </mesh>
                    </group>
                    <mesh position={[10, 40, 60]}>
                        <sphereGeometry args={[10, 32, 32]} />
                        <meshStandardMaterial emissive='yellow' emissiveIntensity={3} toneMapped={false} />
                        <pointLight distance={6100} intensity={50} color='white' />
                    </mesh>
                </group>
            </group>                
            <Ship engine={engine} start={engine.start} loaded={loaded} />
		</group>
	)
}
