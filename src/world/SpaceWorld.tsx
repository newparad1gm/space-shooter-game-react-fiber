import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import { Engine } from '../game/Engine';
import { Lasers } from '../objects/Lasers';
import { Explosions } from '../objects/Explosions';
import { Rings } from '../objects/Rings';
import { Rocks } from '../objects/Rocks';
import { Explosion, Laser, SpaceObject } from '../Types';

interface WorldProps {
    engine: Engine;
}

export const SpaceWorld = (props: WorldProps): JSX.Element => {
	const { engine, } = props;
    [ engine.explosions, engine.setExplosions ] = useState<Explosion[]>([]);
    [ engine.rocks, engine.setRocks ] = useState<SpaceObject[]>([]);
    [ engine.rings, engine.setRings ] = useState<SpaceObject[]>([]);
    [ engine.lasers, engine.setLasers ] = useState<Laser[]>([]);
    const count = 2000;
    const [ earthTexture, moonTexture ] = useLoader(THREE.TextureLoader, ['/textures/earth.jpg', '/textures/moon.png']);
    const cameraGroup = useRef<THREE.Group>(null);
    const planets = useRef<THREE.Group>(null);
    const earthMoon = useRef<THREE.Group>(null);
    const earth = useRef<THREE.Mesh>(null);
    const moon = useRef<THREE.Mesh>(null);
    const rocks = useRef<THREE.Group>(null);
    const lasers = useRef<THREE.Group>(null);
    const rings = useRef<THREE.Group>(null);
    
    const positions = useMemo(() => {
        // generate stars
        let positions = []
        for (let i = 0; i < count; i++) {
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
        return new Float32Array(positions)
    }, [count]);

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

    useFrame(() => {
        // maintain group with same distance to camera
        if (cameraGroup.current) {
            cameraGroup.current.position.copy(engine.camera.position);
        }
        // rotate and orbit planets
        if (earth.current && moon.current && earthMoon.current) {
            earth.current.rotation.y += 0.001;
            moon.current.rotation.y += 0.001;
            earthMoon.current.rotation.y += 0.001;
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

	return (
		<group {...props} dispose={null}>
            <fog attach="fog" args={['#070710', 100, 700]} />
            <ambientLight intensity={0.25} />
            <Lasers group={lasers} lasers={engine.lasers} />
            <Rocks group={rocks} rocks={engine.rocks} meshIdToRockId={engine.meshIdToObjectId} />
            <Rings group={rings} rings={engine.rings} meshIdToRingId={engine.meshIdToObjectId} />
            <Explosions explosions={engine.explosions} />
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
		</group>
	)
}
