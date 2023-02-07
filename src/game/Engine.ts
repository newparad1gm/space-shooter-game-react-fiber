import * as THREE from 'three';
import { Explosion, JsonResponse, Rock } from '../Types';

export class Engine {
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;

    raycaster: THREE.Raycaster;

    explosions: Explosion[];
    setExplosions?: React.Dispatch<React.SetStateAction<Explosion[]>>;
    explosionTimeout: NodeJS.Timeout | undefined;

    meshIdToRockId: Map<string, string>;
    idToRock: Map<string, Rock>;
    rocks: Rock[];
    setRocks?: React.Dispatch<React.SetStateAction<Rock[]>>;
    rockCount: number = 0;
    rockGroup: THREE.Group;

    currentRock?: Rock;
    setCurrentRock?: React.Dispatch<React.SetStateAction<Rock | undefined>>;

    firstPerson: boolean;
    setFirstPerson?: React.Dispatch<React.SetStateAction<boolean>>;

    constructor() {
        this.camera = new THREE.PerspectiveCamera();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();

        this.explosions = [];
        this.rocks = [];
        this.idToRock = new Map();
        this.meshIdToRockId = new Map();
        this.rockGroup = new THREE.Group();

        this.firstPerson = false;
        this.raycaster = new THREE.Raycaster();
    }

    setRay = () => {
        this.raycaster.set(this.camera.getWorldPosition(new THREE.Vector3()), this.camera.getWorldDirection(new THREE.Vector3()));
    }

    shootRay = () => {
        const intersects: THREE.Intersection<THREE.Object3D<THREE.Event>>[] = [];
        this.raycaster.layers.set(1);
        this.raycaster.intersectObject(this.rockGroup, true, intersects);
        this.setCurrentRock && this.setCurrentRock(undefined);
        if (intersects.length) {
            const intersection = intersects[0];
            const object = intersection.object;

            object.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    const rockId = this.meshIdToRockId.get(child.uuid);
                    if (rockId && this.idToRock.has(rockId)) {
                        this.setCurrentRock && this.setCurrentRock(this.idToRock.get(rockId));
                    }
                }
            });
        }
    }

    destroyRock = (rockId: string) => {
        if (this.idToRock.has(rockId)) {
            const rock = this.idToRock.get(rockId)!;
            rock.mesh && this.addExplosion(rock.position, rock.mesh);
            this.setRocks && this.setRocks(this.rocks.filter(r => r.guid !== rock.guid));
            this.idToRock.delete(rock.guid);
            rock.mesh && this.meshIdToRockId.delete(rock.mesh.uuid);
            this.setCurrentRock && this.setCurrentRock(undefined);
        }
    }

    addExplosion = (position: THREE.Vector3, object: THREE.Object3D) => {
        if (this.setExplosions) {
            const now = Date.now();
            this.setExplosions([...this.explosions, { guid: object.id, position: position, scale: 1, time: now }]);
            clearTimeout(this.explosionTimeout);
            this.explosionTimeout = setTimeout(() => this.setExplosions!(this.explosions.filter(({ time }) => Date.now() - time <= 1000)), 1000);
        }
    }

    addRock = (rockData: JsonResponse) => {
        let zPos = 25 + this.rockCount * 10;
        const rock: Rock = {
            guid: rockData.id,
            position: new THREE.Vector3((-1 + Math.random() * 2) * 20, (-1 + Math.random() * 2) * 20, zPos),
            data: rockData
        }
        this.idToRock.set(rock.guid, rock);
        this.setRocks && this.setRocks([...this.rocks, rock]);
        this.rockCount += 1;
    }
}