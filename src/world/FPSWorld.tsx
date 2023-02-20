import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import { WorldProps } from './WorldLoader';
import { Lasers } from '../objects/Lasers';
import { Explosions } from '../objects/Explosions';
import { Rings } from '../objects/Rings';
import { Rocks } from '../objects/Rocks';
import { Explosion, Floor, Laser, SpaceObject } from '../Types';
import { FPS } from '../player/FPS';

export const FPSWorld = (props: WorldProps): JSX.Element => {
	const { engine } = props;
    [ engine.explosions, engine.setExplosions ] = useState<Explosion[]>([]);
    [ engine.rocks, engine.setRocks ] = useState<SpaceObject[]>([]);
    [ engine.rings, engine.setRings ] = useState<SpaceObject[]>([]);
    [ engine.lasers, engine.setLasers ] = useState<Laser[]>([]);
    const [ floors, setFloors ] = useState<Floor[]>([]);
    const cameraGroup = useRef<THREE.Group>(null);
    const rocks = useRef<THREE.Group>(null);
    const lasers = useRef<THREE.Group>(null);
    const rings = useRef<THREE.Group>(null);
    const world = useRef<THREE.Group>(null);
    
    useEffect(() => {
        engine.renderer.setClearColor(new THREE.Color('#020209'));
    }, [engine.renderer]);

    useEffect(() => {
        if (rocks.current) {
            engine.rockGroup = rocks.current;
        }
    }, [engine, rocks]);

    useEffect(() => {
        if (rings.current) {
            engine.ringGroup = rings.current;
        }
    }, [engine, rings]);

    /*useEffect(() => {
        if (engine.rocks.length === 0) {
            const testRock = {"id":"453be010-a8f1-11ed-b0e3-579384e6ae03","activity":{"name":"TT1A1 Create policy","className":"CreatePolicy","eventName":"CreatePolicy","maxRetryAttempts":null,"retryIntervalSecs":null},"activityId":"63e5b6e7ff668aa80bfe2982","time":1530457220529,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
            engine.addRock(testRock);
            engine.network.addActivity(testRock);
        }
        if (engine.rocks.length === 1) {
            const testRock1 = {"id":"47997f20-a8f1-11ed-b0e3-579384e6ae03","activity":{"name":"TT1A2 Create billing","className":"CreateBilling","eventName":"CreateBilling","maxRetryAttempts":null,"retryIntervalSecs":null},"activityId":"63e5b6e7ff668aa80bfe2983","time":1530457224498,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
            engine.addRock(testRock1);
            engine.network.addActivity(testRock1);
        }
    }, [engine, engine.rocks]);

    useEffect(() => {
        if (engine.rings.length === 0) {
            const testRing = {"id":"390cfa90-a8f1-11ed-b0e3-579384e6ae03","stage":{"name":"TT1 Policy Setup","state":"Policy Setup"},"stageId":"63e5b6e7ff668aa80bfe2981","time":1530457200086,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
            engine.addRing(testRing);
            engine.network.transitionStage(testRing);
        }
    }, [engine, engine.rings]);*/

    useEffect(() => {
        if (floors.length === 0) {
            setFloors([{
                position: new THREE.Vector3(0, 0, 0),
                dimensions: new THREE.Vector3(100, 0.2, 100)
            }]);
        }
    }, [floors]);

    useFrame(() => {
        // maintain group with same distance to camera
        if (cameraGroup.current) {
            cameraGroup.current.position.copy(engine.playerPosition);
        }
        // laser hit on rocks through the laser raycaster
        if (lasers.current && engine.lasers.length) {
            const lasersHit: Set<string> = new Set();
            for (const laser of engine.lasers) {
                if (laser.group) {
                    laser.raycaster.layers.set(1);
                    const collisionResults = laser.raycaster.intersectObject(engine.rockGroup);
                    if (collisionResults.length && collisionResults[0].point.distanceTo(laser.group.position) < 40) {
                        const collision = collisionResults[0];
                        lasersHit.add(laser.guid);
                        if (engine.meshIdToObjectId.has(collision.object.uuid)) {
                            engine.network.sendId(engine.meshIdToObjectId.get(collision.object.uuid)!);
                        }
                    }
                }
            }
            engine.setLasers && engine.setLasers(engine.lasers.filter(laser => !lasersHit.has(laser.guid)));
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
                    <mesh position={floor.position}>
                        <boxGeometry args={[floor.dimensions.x, floor.dimensions.y, floor.dimensions.z]} />
                        <meshLambertMaterial color='blue' />
                    </mesh>
                ))}
            </group>
            <Lasers group={lasers} lasers={engine.lasers} color={new THREE.Color('red')} />
            <Rocks group={rocks} rocks={engine.rocks} meshIdToRockId={engine.meshIdToObjectId} />
            <Rings group={rings} rings={engine.rings} meshIdToRingId={engine.meshIdToObjectId} color={new THREE.Color('blue')} />
            <Explosions explosions={engine.explosions} />
            <group ref={cameraGroup}>
            </group>                
            <FPS engine={engine} />
		</group>
	)
}
