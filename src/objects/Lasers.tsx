import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RootState, useFrame } from '@react-three/fiber';
import { Laser as LaserType } from '../Types';

interface LasersProps {
    lasers: LaserType[];
    color: THREE.Color;
}

export const Lasers = (props: LasersProps) => {
    const { lasers, color } = props;

    const laserGeometry: THREE.BoxGeometry = useMemo(() => new THREE.BoxGeometry(0.20, 0.20, 20), []);
    const laserMaterial: THREE.MeshBasicMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: color, toneMapped: false }), [color]);

    return (
        <group>
            { lasers.map(laser => (
                <Laser key={laser.count} laser={laser} geometry={laserGeometry} material={laserMaterial} />
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
            group.current.position.add(laser.direction.clone().multiplyScalar(-delta * 300));
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
            <mesh position={[-0.3, -0.3, -5]} geometry={geometry} material={material} />
            <mesh position={[0.3, -0.3, -5]} geometry={geometry} material={material} />
        </group>
    )
}