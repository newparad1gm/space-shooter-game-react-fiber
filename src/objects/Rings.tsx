import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SpaceObject as RingType } from '../Types';
import { TextSprite } from './TextSprite';

interface RingsProps {
    rings: RingType[];
    meshIdToRingId: Map<string, string>;
    group: React.RefObject<THREE.Group>;
}

export const Rings = (props: RingsProps) => {
    const { rings, meshIdToRingId, group } = props;

    const ringGeometry: THREE.RingGeometry = useMemo(() => new THREE.RingGeometry(0.9, 1.01, 64), []);
    const ringColor: THREE.Color = useMemo(() => new THREE.Color('blue'), []);
    const ringMaterial: THREE.MeshBasicMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: ringColor, side: THREE.DoubleSide }), [ringColor]);

    return (
        <group ref={group}>
            { rings.map((ring, i) => (
                <Ring key={i} ring={ring} geometry={ringGeometry} material={ringMaterial} scale={15} meshIdToRingId={meshIdToRingId} />
            ))}
        </group>
    )
}

interface RingProps {
    ring: RingType;
    geometry: THREE.RingGeometry;
    material: THREE.MeshBasicMaterial;
    scale: number;
    meshIdToRingId: Map<string, string>;
}

export const Ring = (props: RingProps) => {
    const { ring, geometry, material, scale, meshIdToRingId } = props;
    const mesh = useRef<THREE.Mesh>(null);
    const clearGeometry = useMemo(() => new THREE.CircleGeometry(geometry.parameters['outerRadius'], 64), [geometry]);
    const clearMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: material.color, side: THREE.DoubleSide, transparent: true, opacity: 0.1 }), [material]);

    useEffect(() => {
        if (mesh.current) {
            ring.mesh = mesh.current;
            meshIdToRingId.set(mesh.current.uuid, ring.guid);
        }
    }, [mesh, meshIdToRingId, ring]);

    return (
        <group position={ring.position}>
            <TextSprite text={ring.data.stage.name} position={[0, scale + 3, 0]} color={'#0000ff'} font={'50px Georgia'} />
            <mesh scale={[scale, scale, scale]} geometry={geometry} material={material} />
            <mesh ref={mesh} scale={[scale, scale, scale]} geometry={clearGeometry} material={clearMaterial} layers={1} />
        </group>
    )
}