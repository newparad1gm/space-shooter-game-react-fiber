import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Explosion, WorldObject } from '../Types';
import { TextPlane } from './TextPlane';
import { Utils } from '../Utils';

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
                    position={[activity.position.x, activity.position.y + (activity.scale.y / 2) + 0.35, activity.position.z]} 
                    rotation={[0, Math.PI, 0]}
                    scale={[10, 0.5, 0.5]}
                    color={'#ff0000'} 
                    font={'25px Georgia'} 
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
    const group = useRef<THREE.Group>(null);
    const ringGeometry: THREE.RingGeometry = useMemo(() => new THREE.RingGeometry(0.7, 1, 64), []);
    const innerRingGeometry: THREE.RingGeometry = useMemo(() => new THREE.RingGeometry(0.7, 0.4, 64), []);
    const innerCircleGeometry: THREE.CircleGeometry = useMemo(() => new THREE.CircleGeometry(0.4, 64), []);
    const redMaterial: THREE.MeshStandardMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 'red', side: THREE.DoubleSide }), []);
    const whiteMaterial: THREE.MeshStandardMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 'white', side: THREE.DoubleSide }), []);

    useEffect(() => {
        if (group.current) {
            activity.object = group.current;
            meshIdToTargetId.set(group.current.uuid, activity.guid);
        }
    }, [activity, group, meshIdToTargetId]);

	return (
		<group position={activity.position} scale={activity.scale} ref={group}>
            <mesh geometry={ringGeometry} material={redMaterial} rotation={[0, Math.PI, 0]} />
            <mesh geometry={innerRingGeometry} material={whiteMaterial} />
            <mesh geometry={innerCircleGeometry} material={redMaterial} rotation={[0, Math.PI, 0]} />
		</group>
	)
}

interface ShatteredTargetsProps {
    shattered: Explosion[];
}

export const ShatteredTargets = (props: ShatteredTargetsProps): JSX.Element => {
    const { shattered } = props;
    return (
        <group>
            { shattered.map(({ guid, position, scale, orientation }) => <ShatteredTarget key={guid} position={position} scale={scale * 0.5} rotation={orientation} />) }
        </group>
    );
}

const randomVector = () => {
    return -0.75 + Math.random() * 1.5;
}

interface ShatteredTargetProps {
    position: THREE.Vector3;
    rotation?: THREE.Euler;
    scale: number;
}

export const ShatteredTarget = (props: ShatteredTargetProps): JSX.Element => {
    const { position, rotation, scale } = props;
    const group = useRef<THREE.Group>(null);

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const geometry: THREE.ShapeGeometry = useMemo(() => {
        const triangle = new THREE.Shape();
		triangle.moveTo(0, 1);
		triangle.lineTo(1, -1);
		triangle.lineTo(-1, -1);

		return new THREE.ShapeGeometry(triangle);
    }, []);
    const particles = useMemo(() => [
        Utils.make('white', 10, randomVector, randomVector, () => 1, () => (0.5 * Math.random())),
        Utils.make('red', 20, randomVector, randomVector, () => 1, () => (0.5 * Math.random()))
    ], []);

    useFrame(() => {
        particles.forEach(({ data }, type) => {
            if (group.current) {
                const mesh = group.current.children[type];
                if (mesh instanceof THREE.InstancedMesh) {
                    data.forEach(([vec, normal], i) => {
                        vec.add(normal);
                        dummy.position.copy(vec);
                        dummy.updateMatrix();
                        dummy.rotation.setFromVector3(vec);
                        mesh.setMatrixAt(i, dummy.matrix);
                    });
                    mesh.material.opacity -= mesh.material.opacity > 0 ? 0.025 : 0;
                    mesh.instanceMatrix.needsUpdate = true;
                }
            }
        });
    });
  
    return (
        <group ref={group} position={position} scale={[scale, scale, scale]} rotation={rotation}>
            {particles.map(({ color, data }, index) => (
                <instancedMesh geometry={geometry} key={index} args={[undefined, undefined, data.length]} frustumCulled={false}>
                    <meshBasicMaterial color={color} transparent opacity={1} fog={false} toneMapped={false} side={THREE.DoubleSide} />
                </instancedMesh>
            ))}
        </group>
    )
}