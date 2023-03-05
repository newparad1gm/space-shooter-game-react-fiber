import React, { useMemo } from 'react';
import { Euler, Vector3 } from '@react-three/fiber';
import * as THREE from 'three';

interface TextPlaneProps {
    text: string;
    position: Vector3;
    scale: Vector3;
    rotation: Euler;
    color: string;
    font: string;
}

export const TextPlane = (props: TextPlaneProps) => {
    const { text, position, scale, rotation, color, font } = props;
    const textMaterial = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 2000;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.font = font; //'50px Georgia';
            ctx.fillStyle = color; //'#ff0000';
            ctx.textBaseline = 'middle'
            ctx.textAlign = 'center';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);

            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1, side: THREE.DoubleSide });
            material.depthWrite = false;
            return material;
        }
    }, [text, color, font]);

    return (
        <mesh position={position} geometry={new THREE.PlaneGeometry()} scale={scale} rotation={rotation} material={textMaterial} layers={1} />
    )
}