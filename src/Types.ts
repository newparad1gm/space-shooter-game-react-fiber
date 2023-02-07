import * as THREE from 'three';

export interface JsonResponse {
    [name: string]: any;
}

export type Explosion = {
    guid: number;
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