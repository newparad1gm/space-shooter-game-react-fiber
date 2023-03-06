import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RootState, useFrame } from '@react-three/fiber';
import { Engine } from '../game/Engine';
import { Explosion, Platform as PlatformType, Timeout } from '../Types';
import { Switch } from './Switch';
import { ShatteredTargets, Targets } from './Targets';
import { TextPlane } from './TextPlane';

interface PlatformsProps {
    engine: Engine;
    color: THREE.Color;
    group: React.RefObject<THREE.Group>;
}

export const Platforms = (props: PlatformsProps) => {
    const { engine, color, group } = props;
    const platformGeometry: THREE.BoxGeometry = useMemo(() => new THREE.BoxGeometry(20, 0.25, 8), []);
    const platformMaterial: THREE.MeshStandardMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: color }), [color]);

    return (
        <group ref={group}>
            { engine.transitions.map(transition =>
                <Platform key={transition.guid} engine={engine} platforms={group} transition={transition} geometry={platformGeometry} material={platformMaterial} meshIdToTransitionId={engine.object3DIdToWorldObjectId} />
            )}
        </group>
    )
}

interface PlatformProps {
    engine: Engine;
    transition: PlatformType;
    platforms: React.RefObject<THREE.Group>;
    geometry: THREE.BoxGeometry;
    material: THREE.MeshStandardMaterial;
    meshIdToTransitionId: Map<string, string>;
}

export const Platform = (props: PlatformProps) => {
    const { engine, transition, platforms, geometry, material, meshIdToTransitionId } = props;

    const [ switchOn, setSwitchOn ] = useState<boolean>(false);
    const [ doorYPos, setDoorYPos ] = useState<number>(4);
    const [ shattered, setShattered ] = useState<Explosion[]>([]);
    [ transition.currentPlatform, transition.setCurrentPlatform ] = useState<boolean>(!!transition.currentPlatform);
    [ transition.nextPlatform, transition.setNextPlatform ] = useState<PlatformType>();

    const mesh = useRef<THREE.Mesh>(null);
    const group = useRef<THREE.Group>(null);
    const targets = useRef<THREE.Group>(null);
    const door = useRef<THREE.Group>(null);

    const shatteredData: Timeout = useMemo(() => { return { count: 0 } }, []);

    const addShatter = useCallback((position: THREE.Vector3, object: THREE.Object3D, orientation?: THREE.Euler) => {
        const now = Date.now();
        setShattered(shattered => [...shattered.filter(({ time }) => now - time <= 500), { guid: object.uuid, position: position, scale: 1, time: now, orientation: orientation }]);
        clearTimeout(shatteredData.timeout);
        shatteredData.timeout = setTimeout(() => setShattered(shattered => shattered.filter(({ time }) => Date.now() - time <= 500)), 500);
    }, [setShattered, shatteredData]);

    useEffect(() => {
        if (transition.currentPlatform) {
            engine.removeActivity = (activityId: string) => {
                if (engine.idToObject.has(activityId)) {
                    const target = engine.idToObject.get(activityId)!;
                    target.object && addShatter(target.position.clone(), target.object, target.rotation);
                    engine.setActivities && engine.setActivities(engine.activities.filter(r => r.guid !== target.guid));
                    engine.idToObject.delete(target.guid);
                    target.object && engine.object3DIdToWorldObjectId.delete(target.object.uuid);
                    engine.setCurrentActivity && engine.setCurrentActivity(undefined);
                }
            };
        }
    }, [transition.currentPlatform]);

    useEffect(() => {
        engine.switches.set(transition.guid, setSwitchOn);
    }, [engine, transition, setSwitchOn]);

    useEffect(() => {
        if (mesh.current && transition.nextPlatform) {
            transition.object = mesh.current;
            meshIdToTransitionId.set(mesh.current.uuid, transition.guid);
        }
    }, [mesh, meshIdToTransitionId, transition, transition.nextPlatform]);

    useEffect(() => {
        if (transition.currentPlatform && targets.current) {
            engine.activityGroup = targets.current;
        }
    }, [targets, transition.currentPlatform]);

    useEffect(() => {
        if (switchOn && transition.nextPlatform) {
            transition.nextPlatform.setCurrentPlatform && transition.nextPlatform.setCurrentPlatform(true);
            engine.network.sendId(transition.nextPlatform.guid);
        }
    }, [switchOn, transition]);

    useEffect(() => {
        if (switchOn && platforms.current && doorYPos <= -5) {
            engine.resetOctree();
            engine.octree.fromGraphNode(platforms.current);
        }
    }, [switchOn, platforms, doorYPos]);

    useFrame((state: RootState, delta: number) => {
        if (switchOn && doorYPos > -25) {
            setDoorYPos(ypos => ypos - (4 * delta));
        }
    });

    return (
        <group position={transition.position} scale={transition.scale}>
            <group>
                <mesh geometry={geometry} material={material} rotation={[0, 0, 0]} />
            </group>
            {doorYPos > -25 && <group ref={door} position={[0, doorYPos, 4]}>
                <TextPlane text={transition.data.stage.name} position={[0, 3, -0.2]} scale={[20, 2, 2]} rotation={[0, Math.PI, 0]} color={'#ff00ff'} font={'50px Georgia'} />
                {transition.nextPlatform && <Switch 
                    text={transition.nextPlatform.data.stage.name} 
                    position={[-8, -2.5, -0.2]} 
                    scale={[1, 1, 1]} 
                    rotation={[Math.PI / 2, 0, 0]} 
                    color={'#f000ff'} 
                    font={'25px Georgia'} 
                    group={group} 
                    mesh={mesh} 
                    switchOn={switchOn} 
                />}
                {transition.currentPlatform && <Targets group={targets} activities={engine.activities} meshIdToObjectId={engine.object3DIdToWorldObjectId} />}
                <ShatteredTargets shattered={shattered} />
                <mesh geometry={geometry} material={material} rotation={[Math.PI / 2, 0, 0]} />
            </group>}
        </group>
    )
}