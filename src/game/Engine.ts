import * as THREE from 'three';
import { Explosion, JsonResponse, Laser, SpaceObject, Workflow } from '../Types';
import { Network } from './Network';

export class Engine {
    clock: THREE.Clock;

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;

    raycaster: THREE.Raycaster;
    cameraPosition: THREE.Vector3;
    cameraDirection: THREE.Vector3;

    playerPosition: THREE.Vector3;

    lasers: Laser[];
    setLasers?: React.Dispatch<React.SetStateAction<Laser[]>>;
    laserTimeout: NodeJS.Timeout | undefined;
    laserCount: number = 0;

    explosions: Explosion[];
    setExplosions?: React.Dispatch<React.SetStateAction<Explosion[]>>;
    explosionTimeout: NodeJS.Timeout | undefined;

    objectCount: number = 0;

    rocks: SpaceObject[];
    setRocks?: React.Dispatch<React.SetStateAction<SpaceObject[]>>;
    rockGroup: THREE.Group;

    currentRock?: SpaceObject;
    setCurrentRock?: React.Dispatch<React.SetStateAction<SpaceObject | undefined>>;

    rings: SpaceObject[];
    setRings?: React.Dispatch<React.SetStateAction<SpaceObject[]>>;
    ringGroup: THREE.Group;

    meshIdToObjectId: Map<string, string>;
    idToObject: Map<string, SpaceObject>;

    firstPerson: boolean;
    setFirstPerson?: React.Dispatch<React.SetStateAction<boolean>>;

    network: Network;

    workflows: Workflow[];
    setWorkflows?: React.Dispatch<React.SetStateAction<Workflow[]>>;

    constructor() {
        this.clock = new THREE.Clock(false);

        this.camera = new THREE.PerspectiveCamera();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.cameraPosition = new THREE.Vector3();
        this.cameraDirection = new THREE.Vector3();
        this.playerPosition = new THREE.Vector3()

        this.lasers = [];
        this.explosions = [];
        this.rocks = [];
        this.idToObject = new Map();
        this.meshIdToObjectId = new Map();
        this.rockGroup = new THREE.Group();
        this.ringGroup = new THREE.Group();
        this.rings = [];

        this.firstPerson = false;
        this.raycaster = new THREE.Raycaster();
        this.network = new Network(this);
        this.workflows = [];
    }

    setRay = () => {
        this.raycaster.set(this.camera.getWorldPosition(this.cameraPosition), this.camera.getWorldDirection(this.cameraDirection));
    }

    shootRay = () => {
        this.raycaster.layers.set(1);
        this.setCurrentRock && this.setCurrentRock(undefined);
        this.intersectGroup(this.raycaster, this.rockGroup, (intersection: THREE.Intersection<THREE.Object3D<THREE.Event>>) => {
            const object = intersection.object;

            object.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    const rockId = this.meshIdToObjectId.get(child.uuid);
                    if (rockId && this.idToObject.has(rockId)) {
                        this.setCurrentRock && this.setCurrentRock(this.idToObject.get(rockId));
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

    getZPos = () => {
        return 30 + this.objectCount * 30;
    }

    addRock = (rockData: JsonResponse) => {
        let zPos = this.getZPos();
        const rock: SpaceObject = {
            guid: rockData.id,
            position: new THREE.Vector3((-1 + Math.random() * 2) * 15, (-1 + Math.random() * 2) * 15, zPos),
            data: rockData
        }
        this.idToObject.set(rock.guid, rock);
        this.setRocks && this.setRocks([...this.rocks, rock]);
        this.objectCount += 1;
    }

    destroyRock = (rockId: string) => {
        if (this.idToObject.has(rockId)) {
            const rock = this.idToObject.get(rockId)!;
            rock.mesh && this.addExplosion(rock.position, rock.mesh);
            this.setRocks && this.setRocks(this.rocks.filter(r => r.guid !== rock.guid));
            this.idToObject.delete(rock.guid);
            rock.mesh && this.meshIdToObjectId.delete(rock.mesh.uuid);
            this.setCurrentRock && this.setCurrentRock(undefined);
        }
    }

    addExplosion = (position: THREE.Vector3, object: THREE.Object3D) => {
        if (this.setExplosions) {
            const now = Date.now();
            this.setExplosions([...this.explosions, { guid: object.uuid, position: position, scale: 1, time: now }]);
            clearTimeout(this.explosionTimeout);
            this.explosionTimeout = setTimeout(() => this.setExplosions!(this.explosions.filter(({ time }) => Date.now() - time <= 1000)), 1000);
        }
    }

    addRing = (ringData: JsonResponse) => {
        let zPos = this.getZPos();
        const ring: SpaceObject = {
            guid: ringData.id,
            position: new THREE.Vector3((-1 + Math.random() * 2) * 5, (-1 + Math.random() * 2) * 5, zPos),
            data: ringData
        }
        this.idToObject.set(ring.guid, ring);
        this.setRings && this.setRings([...this.rings, ring]);
        this.objectCount += 1;
    }

    destroyRing = (ringId: string) => {
        if (this.idToObject.has(ringId)) {
            const ring = this.idToObject.get(ringId)!;
            this.setRings && this.setRings(this.rings.filter(r => r.guid !== ring.guid));
            this.idToObject.delete(ring.guid);
            ring.mesh && this.meshIdToObjectId.delete(ring.mesh.uuid);
        }
    }

    shoot = (position: THREE.Vector3, direction: THREE.Vector3, quaternion: THREE.Quaternion) => {
        this.setLasers && this.setLasers([...this.lasers, { 
            guid: (this.laserCount++).toString(), 
            time: Date.now(), 
            position: position, 
            direction: direction, 
            quaternion: quaternion,
            raycaster: new THREE.Raycaster(position, direction.clone().negate())
        }]);
        clearTimeout(this.laserTimeout);
        this.laserTimeout = setTimeout(() => this.setLasers!(this.lasers.filter(({ time }) => Date.now() - time <= 1000)), 1000);
    }
}