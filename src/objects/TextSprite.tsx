import React, { useMemo } from 'react';
import { Vector3 } from '@react-three/fiber';
import * as THREE from 'three';

interface TextSpriteProps {
    text: string;
    position: Vector3;
    color: string;
    font: string;
}

export const TextSprite = (props: TextSpriteProps) => {
    const { text, position, color, font } = props;
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
            const material = new THREE.SpriteMaterial({ map: texture });
            material.depthWrite = false;
            return material;
        }
    }, [text, color, font]);

    return (
        <sprite position={position} material={textMaterial} scale={[80, 3, 1]} />
    )
}