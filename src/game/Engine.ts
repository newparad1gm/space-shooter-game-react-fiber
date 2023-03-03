import * as THREE from 'three';
import { Octree } from "three/examples/jsm/math/Octree";
import { WorldObject, JsonResponse, Workflow } from '../Types';
import { Network } from './Network';

export class Engine {
    clock: THREE.Clock;

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;

    raycaster: THREE.Raycaster;
    cameraPosition: THREE.Vector3;
    cameraDirection: THREE.Vector3;

    keyStates: Set<string>;

    playerPosition: THREE.Vector3;
    onFloor: boolean;

    objectCount: number = 0;

    activities: WorldObject[];
    setActivities?: React.Dispatch<React.SetStateAction<WorldObject[]>>;
    activityGroup: THREE.Group;

    currentActivity?: WorldObject;
    setCurrentActivity?: React.Dispatch<React.SetStateAction<WorldObject | undefined>>;

    transitions: WorldObject[];
    setTransitions?: React.Dispatch<React.SetStateAction<WorldObject[]>>;
    transitionGroup: THREE.Group;
    switches: Map<string, React.Dispatch<React.SetStateAction<boolean>>>;

    meshIdToObjectId: Map<string, string>;
    idToObject: Map<string, WorldObject>;

    network: Network;

    workflows: Workflow[];
    setWorkflows?: React.Dispatch<React.SetStateAction<Workflow[]>>;

    octree!: Octree;

    constructor() {
        this.clock = new THREE.Clock(false);

        this.camera = new THREE.PerspectiveCamera();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.cameraPosition = new THREE.Vector3();
        this.cameraDirection = new THREE.Vector3();
        this.playerPosition = new THREE.Vector3();
        this.onFloor = false;

        this.keyStates = new Set();

        this.activities = [];
        this.idToObject = new Map();
        this.meshIdToObjectId = new Map();
        this.activityGroup = new THREE.Group();
        this.transitionGroup = new THREE.Group();
        this.transitions = [];
        this.switches = new Map();

        this.raycaster = new THREE.Raycaster();
        this.network = new Network(this);
        this.workflows = [];

        this.resetOctree();
    }

    resetOctree = () => {
        this.octree = new Octree();
    }

    setRay = () => {
        this.raycaster.set(this.camera.getWorldPosition(this.cameraPosition), this.camera.getWorldDirection(this.cameraDirection));
    }

    shootRay = () => {
        this.raycaster.layers.set(1);
        this.setCurrentActivity && this.setCurrentActivity(undefined);
        this.intersectGroup(this.raycaster, this.activityGroup, (intersection: THREE.Intersection<THREE.Object3D<THREE.Event>>) => {
            const object = intersection.object;

            object.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    const rockId = this.meshIdToObjectId.get(child.uuid);
                    if (rockId && this.idToObject.has(rockId)) {
                        this.setCurrentActivity && this.setCurrentActivity(this.idToObject.get(rockId));
                    }
                }
            });
        });
    }
    
    intersectGroup = (raycaster: THREE.Raycaster, group: THREE.Group, intersectCallback: (intersection: THREE.Intersection<THREE.Object3D<THREE.Event>>) => void) => {
        const intersects: THREE.Intersection<THREE.Object3D<THREE.Event>>[] = [];
        raycaster.intersectObject(group, true, intersects);
        if (intersects.length) {
            intersectCallback(intersects[0]);
        }
    }

    addActivity = (activityData: JsonResponse) => {
        // overwritten in JSX element
    }

    removeActivity = (activityId: string) => {
        // overwritten in JSX element
    }

    addTransition = (transitionData: JsonResponse) => {
        // overwritten in JSX element
    }

    removeTransition = (ringId: string) => {
        // overwritten in JSX element
    }

    shoot = (position: THREE.Vector3, direction: THREE.Vector3, quaternion: THREE.Quaternion) => {
        // overwritten in JSX element
    }
}