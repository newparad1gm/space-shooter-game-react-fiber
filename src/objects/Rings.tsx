import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { WorldObject } from '../Types';
import { TextSprite } from './TextSprite';

interface RingsProps {
    transitions: WorldObject[];
    meshIdToObjectId: Map<string, string>;
    color: THREE.Color;
    group: React.RefObject<THREE.Group>;
}

export const Rings = (props: RingsProps) => {
    const { transitions, meshIdToObjectId, color, group } = props;
    const ringGeometry: THREE.RingGeometry = useMemo(() => new THREE.RingGeometry(0.9, 1.01, 64), []);
    const ringMaterial: THREE.MeshBasicMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide }), [color]);

    return (
        <group ref={group}>
            { transitions.map(transition =>
                <Ring key={transition.guid} transition={transition} geometry={ringGeometry} material={ringMaterial} meshIdToRingId={meshIdToObjectId} />
            )}
        </group>
    )
}

interface RingProps {
    transition: WorldObject;
    geometry: THREE.RingGeometry;
    material: THREE.MeshBasicMaterial;
    meshIdToRingId: Map<string, string>;
}

export const Ring = (props: RingProps) => {
    const { transition, geometry, material, meshIdToRingId } = props;
    const mesh = useRef<THREE.Mesh>(null);
    const clearGeometry: THREE.CircleGeometry = useMemo(() => new THREE.CircleGeometry(geometry.parameters['outerRadius'], 64), [geometry]);
    const clearMaterial: THREE.MeshBasicMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: material.color, side: THREE.DoubleSide, transparent: true, opacity: 0.1 }), [material]);

    useEffect(() => {
        if (mesh.current) {
            transition.object = mesh.current;
            meshIdToRingId.set(mesh.current.uuid, transition.guid);
        }
    }, [mesh, meshIdToRingId, transition]);

    return (
        <group position={transition.position}>
            <TextSprite text={transition.data.stage.name} position={[0, transition.scale.y + 3, 0]} scale={[80, 3, 1]} color={'#0000ff'} font={'50px Georgia'} />
            <mesh scale={transition.scale} geometry={geometry} material={material} />
            <mesh ref={mesh} scale={transition.scale} geometry={clearGeometry} material={clearMaterial} />
        </group>
    )
}