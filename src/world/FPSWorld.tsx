import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import { WorldProps } from './WorldLoader';
import { Explosions } from '../objects/Explosions';
import { Explosion, Floor, Laser, SpaceObject } from '../Types';
import { FPS } from '../player/FPS';
import { Targets } from '../objects/Targets';

export const FPSWorld = (props: WorldProps): JSX.Element => {
	const { engine } = props;
    const [ explosions, setExplosions ] = useState<Explosion[]>([]);
    const [ floors, setFloors ] = useState<Floor[]>([]);
    const cameraGroup = useRef<THREE.Group>(null);
    const targets = useRef<THREE.Group>(null);
    const lasers = useRef<THREE.Group>(null);
    const rings = useRef<THREE.Group>(null);
    const world = useRef<THREE.Group>(null);

    useEffect(() => {
        engine.renderer.setClearColor(new THREE.Color('#020209'));
    }, [engine.renderer]);

    useEffect(() => {
        if (targets.current) {
            engine.activityGroup = targets.current;
        }
    }, [engine, targets]);

    useEffect(() => {
        if (rings.current) {
            engine.transitionGroup = rings.current;
        }
    }, [engine, rings]);

    useEffect(() => {
        if (engine.activities.length === 0) {
            const testRock = {"id":"453be010-a8f1-11ed-b0e3-579384e6ae03","activity":{"name":"TT1A1 Create policy","className":"CreatePolicy","eventName":"CreatePolicy","maxRetryAttempts":null,"retryIntervalSecs":null},"activityId":"63e5b6e7ff668aa80bfe2982","time":1530457220529,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
            engine.addActivity(testRock);
            engine.network.addActivity(testRock);
        }
        if (engine.activities.length === 1) {
            const testRock1 = {"id":"47997f20-a8f1-11ed-b0e3-579384e6ae03","activity":{"name":"TT1A2 Create billing","className":"CreateBilling","eventName":"CreateBilling","maxRetryAttempts":null,"retryIntervalSecs":null},"activityId":"63e5b6e7ff668aa80bfe2983","time":1530457224498,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
            engine.addActivity(testRock1);
            engine.network.addActivity(testRock1);
        }
    }, [engine, engine.activities]);

    /*useEffect(() => {
        if (engine.rings.length === 0) {
            const testRing = {"id":"390cfa90-a8f1-11ed-b0e3-579384e6ae03","stage":{"name":"TT1 Policy Setup","state":"Policy Setup"},"stageId":"63e5b6e7ff668aa80bfe2981","time":1530457200086,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
            engine.addRing(testRing);
            engine.network.transitionStage(testRing);
        }
    }, [engine, engine.rings]);*/

    useEffect(() => {
        if (floors.length === 0) {
            setFloors([{
                guid: '390cfa90-a8f1-11ed-b0e3-579384e6ae06',
                position: new THREE.Vector3(0, 0, 0),
                dimensions: new THREE.Vector3(5, 0.2, 100)
            }]);
        }
    }, [floors]);

    useFrame(() => {
        // maintain group with same distance to camera
        if (cameraGroup.current) {
            cameraGroup.current.position.copy(engine.playerPosition);
        }
    });

    useEffect(() => {
        if (world.current && floors.length > 0) {
            engine.octree.fromGraphNode(world.current);
        }
    }, [engine.octree, floors, world]);

	return (
		<group {...props} dispose={null}>
            <fog attach="fog" args={['#070710', 100, 700]} />
            <ambientLight intensity={0.25} />
            <group ref={world}>
                { floors.map(floor => (
                    <mesh key={floor.guid} position={floor.position}>
                        <boxGeometry args={[floor.dimensions.x, floor.dimensions.y, floor.dimensions.z]} />
                        <meshStandardMaterial color='blue' />
                    </mesh>
                ))}
            </group>
            <Targets group={targets} engine={engine} />
            <Explosions explosions={explosions} />
            <group ref={cameraGroup}>
                <mesh position={[-500, 400, 1000]}>
                    <sphereGeometry args={[10, 32, 32]} />
                    <meshStandardMaterial emissive='yellow' emissiveIntensity={3} toneMapped={false} />
                    <spotLight distance={6100} intensity={10} />
                </mesh>
            </group>
            <FPS engine={engine} start={new THREE.Vector3(0, 10, 0)} />
		</group>
	)
}
