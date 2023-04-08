import React, { useMemo } from 'react';
import { Vector3 } from '@react-three/fiber';
import * as THREE from 'three';

interface TextSpriteProps {
    text: string;
    position: Vector3;
    scale: Vector3;
    color: string;
    font: string;
}

export const TextSprite = (props: TextSpriteProps) => {
    const { text, position, scale, color, font } = props;
    const textMaterial = useMemo(() => {
        const canvas = document.createElement('canvas');
        const [scaleX, scaleY] = Array.isArray(scale) ? [scale[0], scale[1]] : [(scale as THREE.Vector3).x, (scale as THREE.Vector3).y];
        canvas.width = scaleX * 100;
        canvas.height = scaleY * 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.font = font; //'50px Georgia';
            ctx.fillStyle = color; //'#ff0000';
            ctx.textBaseline = 'middle'
            ctx.textAlign = 'center';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);

            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            const material = new THREE.SpriteMaterial({ map: texture });
            material.depthWrite = false;
            return material;
        }
    }, [text, color, font, scale]);

    return (
        <sprite position={position} material={textMaterial} scale={scale} layers={1} />
    )
}