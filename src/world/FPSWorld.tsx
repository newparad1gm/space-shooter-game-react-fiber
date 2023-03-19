import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule';
import { useFrame } from '@react-three/fiber';
import { useCubeTexture } from '@react-three/drei';
import { WorldProps } from './WorldLoader';
import { Sparks } from '../objects/Sparks';
import { Explosion, JsonResponse, Platform, Timeout, WorldObject } from '../Types';
import { FPS } from '../player/FPS';
import { Platforms } from '../objects/Platforms';

type SparkTimeout = Timeout & {
    helper: THREE.Mesh;
}

export const FPSWorld = (props: WorldProps): JSX.Element => {
	const { engine } = props;
	const skybox = useCubeTexture(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'], { path: '/textures/skybox/' });

    const sparkData: SparkTimeout = useMemo(() => {
        const data = {
            count: 0,
            helper: new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 10),
                new THREE.MeshNormalMaterial()
            )
        };
        data.helper.visible = false;
        return data;
    }, []);
    const startingPlatform: Platform = useMemo(() => { return {
        guid: '1',
        data: { stage: { name: 'Start' } },
        scale: new THREE.Vector3(1, 1, 1),
        position: new THREE.Vector3(0, 0, 0)
    }; }, []);

    [ engine.activities, engine.setActivities ] = useState<WorldObject[]>([]);
    [ engine.transitions, engine.setTransitions ] = useState<Platform[]>([startingPlatform]);
    [ engine.currentTransition, engine.setCurrentTransition ] = useState<Platform | undefined>(startingPlatform);
    const [ transitionToPrevPlatform, setTransitionToPrevPlatform ] = useState<Map<string, Platform>>(new Map());
    const [ sparks, setSparks ] = useState<Explosion[]>([]);
    const [ loaded, setLoaded ] = useState<boolean>(false);
    const [ controlsLoaded, setControlsLoaded ] = useState<boolean>(false);

    const cameraGroup = useRef<THREE.Group>(null);
    const platforms = useRef<THREE.Group>(null);

    useEffect(() => {
        skybox.encoding = THREE.sRGBEncoding;
        engine.scene.background = skybox;
    }, [engine, skybox]);

    useEffect(() => {
        engine.removeTransition = (transitionId: string) => {
            if (transitionToPrevPlatform.has(transitionId)) {
                const prevPlatform = transitionToPrevPlatform.get(transitionId)!;
                prevPlatform.setOpening && prevPlatform.setOpening(true);
            }
        };
    }, [engine, transitionToPrevPlatform]);

    useEffect(() => {
        engine.start.set(0, 10, 0);
    }, [engine]);

    useEffect(() => {
        engine.addActivity = (activity: JsonResponse) => {
            const object: WorldObject = {
                guid: activity.id,
                data: activity,
                scale: new THREE.Vector3(0.5, 0.5, 0.5),
                position: new THREE.Vector3((-1 + Math.random() * 2) * 6, (-1 + Math.random() * 2) * 1.5, -0.3)
            }
            engine.idToObject.set(object.guid, object);
            engine.setActivities && engine.setActivities([...engine.activities, object]);
        };

        engine.addTransition = (transition: JsonResponse) => {
            const transitionCount = engine.transitions.length;
            const platform: Platform = {
                guid: transition.id,
                data: transition,
                scale: new THREE.Vector3(1, 1, 1),
                position: new THREE.Vector3(0, (-1 + Math.random() * 2) * 2, transitionCount * 10)
            }
            engine.idToObject.set(platform.guid, platform);
            engine.objectCount++;
            const lastTransition = engine.transitions[transitionCount - 1] as Platform;
            lastTransition.setNextPlatform && lastTransition.setNextPlatform(platform);
            setTransitionToPrevPlatform(map => map.set(platform.guid, lastTransition));
            engine.setTransitions && engine.setTransitions(transitions => [...transitions, platform]);
        };

        engine.shoot = (position: THREE.Vector3, direction: THREE.Vector3, quaternion: THREE.Quaternion) => {
            if (platforms.current) {
                engine.intersectGroup(engine.raycaster, platforms.current, (intersection: THREE.Intersection<THREE.Object3D<THREE.Event>>) => {
                    const object = intersection.object;

                    object.traverse(child => {
                        if (child instanceof THREE.Mesh) {
                            const normal = intersection.face?.normal.clone();
                            const point = intersection.point;
                            sparkData.helper.position.copy(point);
                            const orientation = new THREE.Euler();
                            if (normal) {
                                normal.transformDirection(child.matrixWorld);
                                normal.multiplyScalar(10);
                                normal.add(point);
                                sparkData.helper.lookAt(normal);
                                orientation.copy(sparkData.helper.rotation);
                            }
                            const now = Date.now();
                            clearTimeout(sparkData.timeout);
                            sparkData.timeout = setTimeout(() => setSparks(sparks => sparks.filter(({ time }) => Date.now() - time <= 500)), 500);
                            setSparks(sparks => [...sparks.filter(({ time }) => now - time <= 500), { guid: (sparkData.count++).toString(), position: point, scale: 1, time: now, orientation: orientation }]);

                            if (engine.currentActivity) {
                                engine.currentActivity.rotation = orientation;
                                engine.network.sendId(engine.currentActivity.guid);
                                //engine.removeActivity(engine.currentActivity.guid);
                            }
                        }
                    });
                });
            }
        };

        engine.teleportPlayerIfOob = (capsule: Capsule, height: number, radius: number, velocity: THREE.Vector3) => {
            if (capsule.end.y <= - 25) {
                console.log(`Teleporting to engine.start: ${engine.start.x} ${engine.start.y} ${engine.start.z}`);
                capsule.start.set(engine.start.x, engine.start.y, engine.start.z);
                capsule.end.set(engine.start.x, engine.start.y + height, engine.start.z);
                capsule.radius = radius;
                velocity.set(0, 0, 0);
            }
        }

        setControlsLoaded(true);
    }, [engine, sparkData, setTransitionToPrevPlatform]);

    useEffect(() => {
        engine.renderer.setClearColor(new THREE.Color('#020209'));
    }, [engine.renderer]);

    useEffect(() => {
        if (platforms.current) {
            engine.transitionGroup = platforms.current;
        }
    }, [engine, platforms]);

    /*useEffect(() => {
        if (controlsLoaded) {
            if (engine.activities.length === 0) {
                const testTarget = {"id":"453be010-a8f1-11ed-b0e3-579384e6ae03","activity":{"name":"TT1A1 Create policy","className":"CreatePolicy","eventName":"CreatePolicy","maxRetryAttempts":null,"retryIntervalSecs":null},"activityId":"63e5b6e7ff668aa80bfe2982","time":1530457220529,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
                engine.addActivity(testTarget);
                engine.network.addActivity(testTarget);
            }
            if (engine.activities.length === 1) {
                const testTarget1 = {"id":"47997f20-a8f1-11ed-b0e3-579384e6ae03","activity":{"name":"TT1A2 Create billing very long activity name, it is so long its very long","className":"CreateBilling","eventName":"CreateBilling","maxRetryAttempts":null,"retryIntervalSecs":null},"activityId":"63e5b6e7ff668aa80bfe2983","time":1530457224498,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
                engine.addActivity(testTarget1);
                engine.network.addActivity(testTarget1);
            }
        }
    }, [controlsLoaded, engine, engine.activities]);

    useEffect(() => {
        if (controlsLoaded) {
            if (engine.transitions.length === 1) {
                const testPlatform = {"id":"390cfa90-a8f1-11ed-b0e3-579384e6ae03","stage":{"name":"TT1 Policy Setup","state":"Policy Setup"},"stageId":"63e5b6e7ff668aa80bfe2981","time":1530457200086,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
                engine.addTransition(testPlatform);
                engine.network.transitionStage(testPlatform);
            }
        }
    }, [controlsLoaded, engine, engine.transitions]);*/

    useFrame(() => {
        // maintain group with same distance to camera
        if (cameraGroup.current) {
            cameraGroup.current.position.copy(engine.playerPosition);
        }
    });

    useEffect(() => {
        if (platforms.current && engine.transitions.length > 0) {
            engine.setOctreeFromGroup(platforms.current);
            setLoaded(true);
        }
    }, [engine, engine.transitions, platforms]);

	return (
		<group {...props} dispose={null}>
            <fog attach="fog" args={['#070710', 100, 700]} />
            <ambientLight intensity={0.25} />
            <Platforms group={platforms} engine={engine} />
            <Sparks sparks={sparks} />
            <group ref={cameraGroup}>
                <mesh position={[-500, 300, -450]}>
                    <spotLight distance={6100} intensity={1} />
                </mesh>
            </group>
            <FPS engine={engine} start={engine.start} loaded={loaded} />
		</group>
	)
}
