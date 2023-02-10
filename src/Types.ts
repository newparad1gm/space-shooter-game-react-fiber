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
    id: string;
    activities: Activity[];
    currentStage?: Stage;
}

export type Activity = {
    name: string;
    id: string;
    executionTime: Date;
}

export type Stage = {
    name: string;
    id: string;
    enteredTime: Date;
}

/*export type Ring = {
    guid: string;
    position: THREE.Vector3;
    data: JsonResponse;
    mesh?: THREE.Mesh;
}*/