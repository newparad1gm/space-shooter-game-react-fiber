import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Engine } from '../game/Engine';
import { WorldObject } from '../Types';
import { TextSprite } from './TextSprite';

interface TargetsProps {
    engine: Engine;
    group: React.RefObject<THREE.Group>;
}

export const Targets = (props: TargetsProps): JSX.Element => {
    const { engine, group } = props;

    useEffect(() => {

    }, [engine.activities]);

    return (
        <group>
            <group>
                { engine.activities.map(activity => activity.position ? (<TextSprite 
                    key={activity.guid}
                    text={activity.data.activity.name} 
                    position={[activity.position.x, activity.position.y + (activity.scale.y / 2) + 2, activity.position.z]} 
                    color={'#ff0000'} 
                    font={'50px Georgia'} 
                />) : null )}
            </group>
            <group ref={group}>
                { engine.activities.map(activity => <Target 
                    key={activity.guid} 
                    activity={activity} 
                    meshIdToTargetId={engine.meshIdToObjectId} 
                /> )}
            </group>
        </group>
    );
}

interface TargetProps {
    activity: WorldObject;
    meshIdToTargetId: Map<string, string>;
}

export const Target = (props: TargetProps) => {
	const { activity, meshIdToTargetId } = props;
    const mesh = useRef<THREE.Mesh>(null);
    const scale: THREE.Vector3 = useMemo(() => new THREE.Vector3(5, 5, 5), []);
    const ringGeometry: THREE.RingGeometry = useMemo(() => new THREE.RingGeometry(0.7, 1, 64), []);
    const innerRingGeometry: THREE.RingGeometry = useMemo(() => new THREE.RingGeometry(0.7, 0.4, 64), []);
    const innerCircleGeometry: THREE.CircleGeometry = useMemo(() => new THREE.CircleGeometry(0.4, 64), []);
    const redMaterial: THREE.MeshStandardMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 'red', side: THREE.DoubleSide }), []);
    const whiteMaterial: THREE.MeshStandardMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 'white', side: THREE.DoubleSide }), []);

    useEffect(() => {
        if (mesh.current) {
            activity.mesh = mesh.current;
            meshIdToTargetId.set(mesh.current.uuid, activity.guid);
        }
    }, [activity, mesh, meshIdToTargetId]);

	return (
		<group position={activity.position} scale={scale}>
            <mesh geometry={ringGeometry} material={redMaterial} />
            <mesh geometry={innerRingGeometry} material={whiteMaterial} />
            <mesh geometry={innerCircleGeometry} material={redMaterial} />
		</group>
	)
}
