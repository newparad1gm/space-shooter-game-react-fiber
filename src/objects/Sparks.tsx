import React, { createRef, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { RootState, useFrame } from '@react-three/fiber';
import { Explosion as ExplosionType } from '../Types';
import { Utils } from '../Utils';

interface SparksProps {
    sparks: ExplosionType[];
}

export const Sparks = (props: SparksProps): JSX.Element => {
    const { sparks } = props;
    return (
        <group>
            { sparks.map(({ guid, position, scale, orientation }) => <Spark key={guid} position={position} scale={scale * 0.75} rotation={orientation} />) }
        </group>
    );
}

const randomVector = () => {
    return -0.25 + Math.random() * 0.5;
}

interface SparkProps {
    position: THREE.Vector3;
    rotation?: THREE.Euler;
    scale: number;
}

export const Spark = (props: SparkProps): JSX.Element => {
    const { position, rotation, scale } = props;
    const group = useRef<THREE.Group>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => [
        Utils.make('white', 50, randomVector, randomVector, () => 1, () => (2 * Math.random())),
        Utils.make('yellow', 50, randomVector, randomVector, () => 1, () => (2 * Math.random()))
    ], []);

    useFrame((state: RootState, delta: number) => {
        particles.forEach(({ data }, type) => {
            if (group.current) {
                const mesh = group.current.children[type];
                if (mesh instanceof THREE.InstancedMesh) {
                    data.forEach(([vec, normal], i) => {
                        const deltaNormal = normal.clone();
                        deltaNormal.multiplyScalar(delta);
                        vec.add(deltaNormal);
                        dummy.position.copy(vec);
                        dummy.updateMatrix();
                        mesh.setMatrixAt(i, dummy.matrix);
                    });
                    mesh.material.opacity -= mesh.material.opacity > 0 ? delta * 2 : 0;
                    mesh.instanceMatrix.needsUpdate = true;
                }
            }
        });
    });
  
    return (
        <group ref={group} position={position} scale={[scale, scale, scale]} rotation={rotation}>
            {particles.map(({ color, data }, index) => (
                <instancedMesh key={index} args={[undefined, undefined, data.length]} frustumCulled={false}>
                    <dodecahedronGeometry args={[0.02, 0]} />
                    <meshBasicMaterial color={color} transparent opacity={1} fog={false} toneMapped={false} />
                </instancedMesh>
            ))}
        </group>
    )
}