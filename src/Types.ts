import * as THREE from 'three';

export interface JsonResponse {
    [name: string]: any;
}

export type Explosion = {
    guid: string;
    position: THREE.Vector3;
    scale: number;
    time: number;
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
    mesh?: THREE.Mesh;
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