import * as THREE from 'three';
import { Octree } from "three/examples/jsm/math/Octree";
import { Capsule } from 'three/examples/jsm/math/Capsule';
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

    currentTransition?: WorldObject;
    setCurrentTransition?: React.Dispatch<React.SetStateAction<WorldObject | undefined>>;
    transitionCount?: number;
    setTransitionCount?: React.Dispatch<React.SetStateAction<number>>;

    requirements: string[];
    setRequirements?: React.Dispatch<React.SetStateAction<string[]>>;

    object3DIdToWorldObjectId: Map<string, string>;
    idToObject: Map<string, WorldObject>;

    network: Network;

    workflows: Workflow[];
    setWorkflows?: React.Dispatch<React.SetStateAction<Workflow[]>>;

    start: THREE.Vector3;

    octree: Octree;

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
        this.object3DIdToWorldObjectId = new Map();
        this.activityGroup = new THREE.Group();
        this.transitionGroup = new THREE.Group();
        this.transitions = [];
        this.switches = new Map();
        this.requirements = [];

        this.raycaster = new THREE.Raycaster();
        this.network = new Network(this);
        this.workflows = [];
        
        this.start = new THREE.Vector3();
        this.octree = new Octree();
    }

    setRay = () => {
        this.raycaster.set(this.camera.getWorldPosition(this.cameraPosition), this.camera.getWorldDirection(this.cameraDirection));
    }

    shootRay = () => {
        this.setCurrentActivity && this.setCurrentActivity(undefined);
        this.intersectGroup(this.raycaster, this.activityGroup, (intersection: THREE.Intersection<THREE.Object3D<THREE.Event>>) => {
            const object = intersection.object;

            object.traverse(child => {
                if (child instanceof THREE.Mesh && child.parent instanceof THREE.Group) {
                    const activityId = this.object3DIdToWorldObjectId.get(child.parent.uuid);
                    if (activityId && this.idToObject.has(activityId)) {
                        this.setCurrentActivity && this.setCurrentActivity(this.idToObject.get(activityId));
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

    teleportPlayerIfOob = (capsule: Capsule, height: number, radius: number, velocity: THREE.Vector3) => {
        // overwritten in JSX element
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

    removeTransition = (transitionId: string) => {
        // overwritten in JSX element
    }

    shoot = (position: THREE.Vector3, direction: THREE.Vector3, quaternion: THREE.Quaternion) => {
        // overwritten in JSX element
    }

    setOctreeFromGroup = (group: THREE.Group) => {
        const octree = new Octree();
        octree.fromGraphNode(group);
        this.octree = octree;
    }

    resetOctree = () => {
        this.octree = new Octree();
    }

    collisions = (capsule: Capsule, velocity: THREE.Vector3) => {
        const result = this.octree.capsuleIntersect(capsule);
        this.onFloor = false;
        if (result) {
            this.onFloor = result.normal.y > 0;
            if (!this.onFloor) {
                velocity.addScaledVector(result.normal, -result.normal.dot(velocity));
            }
            capsule.translate(result.normal.multiplyScalar(result.depth));
        }
    }
}