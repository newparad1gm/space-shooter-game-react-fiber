import { createRef } from 'react';
import * as THREE from 'three';
import { Particles } from './Types';

export class Utils {
    static now = (): Date => {
        return new Date();
    }

    static offsetTime = (date: Date, offset: number): Date => {
        return new Date(date.getTime() + offset);
    }

    static delay = async (duration: number): Promise<unknown> => {
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    static getEnumKeys = <T extends Object>(enumToDeconstruct: T): Array<keyof typeof enumToDeconstruct> => {
        return Object.keys(enumToDeconstruct) as Array<keyof typeof enumToDeconstruct>;
    }
    
    static checkEnum = <T extends Object>(enumToCheck: T, value: string) => {
        return Object.values(enumToCheck).includes(value);
    }

    static getForwardVector = (object: THREE.Object3D, direction: THREE.Vector3): THREE.Vector3 => {
        object.getWorldDirection(direction);
        direction.normalize();

        return direction;
    }

    static getSideVector = (object: THREE.Object3D, direction: THREE.Vector3): THREE.Vector3 => {
        object.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        direction.cross(object.up);

        return direction;
    }

    static speed = (velocity: THREE.Vector3) => {
        return Math.sqrt(velocity.dot(velocity));
    }
    
    static randomScale = () => {
        return (Math.random() + 0.5) * 10;
    }

    static make = (color: string, count: number, xVector: () => number, yVector: () => number, zVector: () => number, speed: () => number): Particles => {
        return {
            ref: createRef(),
            color,
            data: new Array(count)
                .fill(undefined)
                .map(() => [
                    new THREE.Vector3(),
                    new THREE.Vector3(xVector(), yVector(), zVector()).normalize().multiplyScalar(speed())
                ])
        }
    }
}