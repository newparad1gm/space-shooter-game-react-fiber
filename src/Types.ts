import React from 'react';
import * as THREE from 'three';

export interface JsonResponse {
    [name: string]: any;
}

export type Explosion = {
    guid: string;
    position: THREE.Vector3;
    scale: number;
    time: number;
    orientation?: THREE.Euler;
}

export type SpaceObject = {
    guid: string;
    position: THREE.Vector3;
    data: JsonResponse;
    scale: THREE.Vector3;
    mesh?: THREE.Mesh;
}

export type Laser = {
    guid: string;
    count: number;
    position: THREE.Vector3;
    direction: THREE.Vector3;
    quaternion: THREE.Quaternion;
    time: number;
    raycaster: THREE.Raycaster;
    group?: THREE.Group;
}

export type Workflow = {
    name: string;
    activities: string[];
    requirements: string[];
    currentStage?: Stage;
}

export type WorldObject = {
    guid: string;
    data: JsonResponse;
    scale: THREE.Vector3;
    position: THREE.Vector3;
    rotation?: THREE.Euler;
    object?: THREE.Object3D;
}

export type Platform = WorldObject & {
    prevPlatform?: Platform;
    nextPlatform?: Platform;
    setNextPlatform?: React.Dispatch<React.SetStateAction<Platform | undefined>>; 
    opening?: boolean;
    setOpening?: React.Dispatch<React.SetStateAction<boolean>>;
}

export type Stage = {
    name: string;
    enteredTime: Date;
}

export type Floor = {
    guid: string;
    position: THREE.Vector3;
    dimensions: THREE.Vector3;
}

export type Timeout = {
    timeout?: NodeJS.Timeout;
    count: number;
}

export type Particles = {
    ref: React.RefObject<any>;
    color: string;
    data: THREE.Vector3[][];
}