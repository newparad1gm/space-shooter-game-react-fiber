import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import { WorldProps } from './WorldLoader';
import { Sparks } from '../objects/Sparks';
import { Explosion, Floor, JsonResponse, Platform, Timeout, WorldObject } from '../Types';
import { FPS } from '../player/FPS';
import { Platforms } from '../objects/Platforms';

type SparkTimeout = Timeout & {
    helper: THREE.Mesh;
}

export const FPSWorld = (props: WorldProps): JSX.Element => {
	const { engine } = props;

    [ engine.activities, engine.setActivities ] = useState<WorldObject[]>([]);
    [ engine.transitions, engine.setTransitions ] = useState<Platform[]>([{
        guid: '1',
        data: { stage: { name: 'Start' } },
        scale: new THREE.Vector3(1, 1, 1),
        position: new THREE.Vector3(0, 0, 0),
        currentPlatform: true
    }]);
    const [ sparks, setSparks ] = useState<Explosion[]>([]);
    const [ loaded, setLoaded ] = useState<boolean>(false);
    const [ controlsLoaded, setControlsLoaded ] = useState<boolean>(false);

    const cameraGroup = useRef<THREE.Group>(null);
    const platforms = useRef<THREE.Group>(null);

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
                position: new THREE.Vector3(0, (-1 + Math.random() * 2) * 2, transitionCount * 10),
                currentPlatform: false
            }
            engine.idToObject.set(platform.guid, platform);
            engine.objectCount++;
            const lastTransition = engine.transitions[transitionCount - 1] as Platform;
            lastTransition.setNextPlatform && lastTransition.setNextPlatform(platform);
            engine.setTransitions && engine.setTransitions([...engine.transitions, platform]);
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

        setControlsLoaded(true);
    }, []);

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
                const testTarget1 = {"id":"47997f20-a8f1-11ed-b0e3-579384e6ae03","activity":{"name":"TT1A2 Create billing","className":"CreateBilling","eventName":"CreateBilling","maxRetryAttempts":null,"retryIntervalSecs":null},"activityId":"63e5b6e7ff668aa80bfe2983","time":1530457224498,"workflow":{"id":"63e5b6e7ff668aa80bfe2980","name":"Policy"}};
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
        engine.resetOctree();
        if (platforms.current && engine.transitions.length > 0) {
            engine.octree.fromGraphNode(platforms.current);
            setLoaded(true);
        }
    }, [engine.octree, engine.transitions, platforms]);

	return (
		<group {...props} dispose={null}>
            <fog attach="fog" args={['#070710', 100, 700]} />
            <ambientLight intensity={0.25} />
            <Platforms group={platforms} engine={engine} color={new THREE.Color('blue')} />
            <Sparks sparks={sparks} />
            <group ref={cameraGroup}>
                <mesh position={[-500, 400, 1000]}>
                    <sphereGeometry args={[10, 32, 32]} />
                    <meshStandardMaterial emissive='yellow' emissiveIntensity={3} toneMapped={false} />
                    <spotLight distance={6100} intensity={10} />
                </mesh>
            </group>
            <FPS engine={engine} start={new THREE.Vector3(0, 10, 0)} loaded={loaded} />
		</group>
	)
}
