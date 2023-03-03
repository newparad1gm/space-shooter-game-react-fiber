import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { WorldObject } from '../Types';
import { TextPlane } from './TextPlane';

interface TargetsProps {
    activities: WorldObject[];
    meshIdToObjectId: Map<string, string>;
    group: React.RefObject<THREE.Group>;
}

export const Targets = (props: TargetsProps): JSX.Element => {
    const { activities, meshIdToObjectId, group } = props;

    return (
        <group>
            <group>
                { activities.map(activity => <TextPlane 
                    key={activity.guid}
                    text={activity.data.activity.name} 
                    position={[activity.position.x, activity.position.y + (activity.scale.y / 2) + 0.3, activity.position.z]} 
                    rotation={[0, Math.PI, 0]}
                    scale={[6, 0.2, 0.2]}
                    color={'#ff0000'} 
                    font={'50px Georgia'} 
                />)}
            </group>
            <group ref={group}>
                { activities.map(activity => <Target 
                    key={activity.guid} 
                    activity={activity} 
                    meshIdToTargetId={meshIdToObjectId} 
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
		<group position={activity.position} scale={activity.scale}>
            <mesh geometry={ringGeometry} material={redMaterial} />
            <mesh geometry={innerRingGeometry} material={whiteMaterial} />
            <mesh geometry={innerCircleGeometry} material={redMaterial} />
		</group>
	)
}
