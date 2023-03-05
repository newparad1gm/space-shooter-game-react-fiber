import React, { useEffect, useMemo, useRef } from 'react';
import { Euler, Vector3 } from '@react-three/fiber';
import * as THREE from 'three';
import { TextPlane } from './TextPlane';

interface SwitchProps {
    text: string;
    position: Vector3;
    scale: Vector3;
    rotation: Euler;
    color: string;
    font: string;
    group: React.RefObject<THREE.Group>;
    mesh: React.RefObject<THREE.Mesh>;
    switchOn: boolean;
}

export const Switch = (props: SwitchProps) => {
    const { text, position, scale, rotation, color, font, group, mesh, switchOn } = props;
    const red = useMemo(() => new THREE.Color('red'), []);
    const green = useMemo(() => new THREE.Color('green'), []);
    const material = useRef<THREE.MeshStandardMaterial>(null);

    useEffect(() => {
        if (material.current) {
            material.current.color = switchOn ? green : red;
        }
    }, [switchOn]);

    return (
        <group ref={group} position={position} scale={scale} rotation={rotation}>
            <TextPlane text={text} position={[0, 0, -1]} scale={[4, 0.2, 0.2]} rotation={[Math.PI / 2, 0, Math.PI]} color={color} font={font} />
            <mesh>
                <boxGeometry args={[1, 0.1, 1]} />
                <meshStandardMaterial color={'white'} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.051, 0]} ref={mesh}>
                <planeGeometry args={[0.8, 0.8]} />
                <meshStandardMaterial ref={material} />
            </mesh>
        </group>
    );
}