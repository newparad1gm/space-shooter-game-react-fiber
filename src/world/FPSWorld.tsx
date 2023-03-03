import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import { WorldProps } from './WorldLoader';
import { Explosions } from '../objects/Explosions';
import { Explosion, Floor, JsonResponse, WorldObject } from '../Types';
import { FPS } from '../player/FPS';
import { Targets } from '../objects/Targets';
import { Platforms } from '../objects/Platforms';

export const FPSWorld = (props: WorldProps): JSX.Element => {
	const { engine } = props;

    [ engine.activities, engine.setActivities ] = useState<WorldObject[]>([]);
    [ engine.transitions, engine.setTransitions ] = useState<WorldObject[]>([{
        guid: '1',
        data: { stage: { name: 'Start' } },
        scale: new THREE.Vector3(1, 1, 1),
        position: new THREE.Vector3(0, 0, 0)
    }]);
    const [ explosions, setExplosions ] = useState<Explosion[]>([]);
    const [ loaded, setLoaded ] = useState<boolean>(false);
    const [ controlsLoaded, setControlsLoaded ] = useState<boolean>(false);

    const cameraGroup = useRef<THREE.Group>(null);
    const platforms = useRef<THREE.Group>(null);

    useEffect(() => {
        engine.addActivity = (activity: JsonResponse) => {
            const object: WorldObject = {
                guid: activity.id,
                data: activity,
                scale: new THREE.Vector3(0.5, 0.5, 0.5),
                position: new THREE.Vector3((-1 + Math.random() * 2) * 10, (Math.random() + 2), -0.2)
            }
            engine.idToObject.set(object.guid, object);
            engine.setActivities && engine.setActivities([...engine.activities, object]);
        };

        engine.removeActivity = (activityId: string) => {
            if (engine.idToObject.has(activityId)) {
                const rock = engine.idToObject.get(activityId)!;
                //rock.mesh && addExplosion(rock.mesh.getWorldPosition(new THREE.Vector3()), rock.mesh);
                engine.setActivities && engine.setActivities(engine.activities.filter(r => r.guid !== rock.guid));
                engine.idToObject.delete(rock.guid);
                rock.mesh && engine.meshIdToObjectId.delete(rock.mesh.uuid);
                engine.setCurrentActivity && engine.setCurrentActivity(undefined);
            }
        };

        engine.addTransition = (transition: JsonResponse) => {
            const transitionCount = engine.transitions.length;
            const object: WorldObject = {
                guid: transition.id,
                data: transition,
                scale: new THREE.Vector3(1, 1, 1),
                position: new THREE.Vector3(0, (-1 + Math.random() * 2) * 2, transitionCount * 5)
            }
            engine.idToObject.set(object.guid, object);
            engine.objectCount++;
            const lastTransition = engine.transitions[transitionCount - 1];
            lastTransition.data.nextStage = object.data.stage.name;
            engine.setTransitions && engine.setTransitions([...engine.transitions, object]);
        };

        engine.removeTransition = (transitionId: string) => {
            if (engine.idToObject.has(transitionId)) {
                const ring = engine.idToObject.get(transitionId)!;
                engine.setTransitions && engine.setTransitions(engine.transitions.filter(r => r.guid !== ring.guid));
                engine.idToObject.delete(ring.guid);
                ring.mesh && engine.meshIdToObjectId.delete(ring.mesh.uuid);
            }
        };

        engine.shoot = (position: THREE.Vector3, direction: THREE.Vector3, quaternion: THREE.Quaternion) => {
        };

        setControlsLoaded(true);
    }, [engine, setControlsLoaded]);

    useEffect(() => {
        engine.renderer.setClearColor(new THREE.Color('#020209'));
    }, [engine.renderer]);

    useEffect(() => {
        if (platforms.current) {
            engine.transitionGroup = platforms.current;
        }
    }, [engine, platforms]);

    useEffect(() => {
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
    }, [controlsLoaded, engine, engine.transitions]);

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
            <Explosions explosions={explosions} />
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
