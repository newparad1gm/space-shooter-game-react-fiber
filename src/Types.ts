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

export type Rock = {
    guid: string;
    position: THREE.Vector3;
    data: JsonResponse;
    mesh?: THREE.Mesh;
    collider?: THREE.Sphere;
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