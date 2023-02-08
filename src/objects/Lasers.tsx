import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RootState, useFrame } from '@react-three/fiber';
import { Laser as LaserType } from '../Types';

interface LasersProps {
    lasers: LaserType[];
    group: React.RefObject<THREE.Group>;
}

export const Lasers = (props: LasersProps) => {
    const { lasers, group } = props;

    const laserGeometry: THREE.BoxGeometry = useMemo(() => new THREE.BoxGeometry(0.10, 0.10, 20), []);
    const laserColor: THREE.Color = useMemo(() => new THREE.Color('lightgreen'), []);
    const laserMaterial: THREE.MeshBasicMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: laserColor, toneMapped: false }), [laserColor]);

    return (
        <group ref={group}>
            { lasers.map((laser, i) => (
                <Laser key={i} laser={laser} geometry={laserGeometry} material={laserMaterial} />
            ))}
        </group>
    )
}

interface LaserProps {
    laser: LaserType;
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
}

export const Laser = (props: LaserProps) => {
    const { laser, geometry, material } = props;
    const group = useRef<THREE.Group>(null);
    
    useFrame((state: RootState, delta: number) => {
        if (group.current) {
            group.current.position.add(laser.direction.clone().multiplyScalar(-delta * 200));
        }
    });

    useEffect(() => {
        if (group.current) {
            laser.guid = group.current.uuid;
            laser.group = group.current;
        }
    }, [group, laser]);

    return (
        <group ref={group} position={laser.position} quaternion={laser.quaternion}>
            <mesh position={[-0.3, 0, -7]} geometry={geometry} material={material} />
            <mesh position={[0.3, 0, -7]} geometry={geometry} material={material} />
        </group>
    )
}