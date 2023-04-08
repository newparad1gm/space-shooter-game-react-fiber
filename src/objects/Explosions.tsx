import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { RootState, useFrame } from '@react-three/fiber';
import { Explosion as ExplosionType } from '../Types';
import { Utils } from '../Utils';

interface ExplosionsProps {
    explosions: ExplosionType[];
}

export const Explosions = (props: ExplosionsProps): JSX.Element => {
    const { explosions } = props;
    return (
        <group>
            { explosions.map(({ guid, position, scale }) => <Explosion key={guid} position={position} scale={scale * 0.75} />) }
        </group>
    );
}

const randomVector = () => {
    return -1 + Math.random() * 2;
}

interface ExplosionProps {
    position: THREE.Vector3;
    scale: number;
}

export const Explosion = (props: ExplosionProps): JSX.Element => {
    const { position, scale } = props;
    const group = useRef<THREE.Group>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => [
        Utils.make('white', 20, randomVector, randomVector, randomVector, () => 30),
        Utils.make('orange', 20, randomVector, randomVector, randomVector, () => 30)
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
                    mesh.material.opacity -= mesh.material.opacity > 0 ? delta : 0;
                    mesh.instanceMatrix.needsUpdate = true;
                }
            }
        });
    });
  
    return (
        <group ref={group} position={position} scale={[scale, scale, scale]}>
            {particles.map(({ color, data }, index) => (
                <instancedMesh key={index} args={[undefined, undefined, data.length]} frustumCulled={false}>
                    <dodecahedronGeometry args={[10, 0]} />
                    <meshBasicMaterial color={color} transparent opacity={1} fog={false} toneMapped={false} />
                </instancedMesh>
            ))}
        </group>
    )
}