import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { GLTF } from 'three-stdlib';
import { JsonResponse, WorldObject } from '../Types';
import { TextSprite } from './TextSprite';
import { Engine } from '../game/Engine';

type GLTFResult = GLTF & {
	nodes: {
		node_id4_Material_52_0: THREE.Mesh;
	}
	materials: {
		Material_52: THREE.MeshStandardMaterial;
	}
}

interface RocksProps {
    activities: WorldObject[];
    meshIdToObjectId: Map<string, string>;
    group: React.RefObject<THREE.Group>;
}

export const Rocks = (props: RocksProps): JSX.Element => {
	const { nodes, materials } = useGLTF('gltf/rock.gltf') as GLTFResult;
    const { activities, meshIdToObjectId, group } = props;

    return (
        <group>
            <group>
                { activities.map(activity => <TextSprite 
                    key={activity.guid}
                    text={activity.data.activity.name} 
                    position={[activity.position.x, activity.position.y + (activity.scale.y / 2) + 2, activity.position.z]} 
                    color={'#ff0000'} 
                    font={'50px Georgia'} />
                )}
            </group>
            <group ref={group}>
                { activities.map(activity => <Rock 
                    key={activity.guid} 
                    activity={activity} 
                    geometry={nodes.node_id4_Material_52_0.geometry} 
                    material={materials.Material_52} 
                    meshIdToRockId={meshIdToObjectId} />
                )}
            </group>
        </group>
    );
}

useGLTF.preload('/rock.gltf');

interface RockProps {
    activity: WorldObject;
    geometry: THREE.BufferGeometry;
    material: THREE.Material; 
    meshIdToRockId: Map<string, string>;
}

export const Rock = (props: RockProps) => {
	const { activity, geometry, material, meshIdToRockId } = props;
    const mesh = useRef<THREE.Mesh>(null);

    useEffect(() => {
        if (mesh.current) {
            activity.mesh = mesh.current;
            meshIdToRockId.set(mesh.current.uuid, activity.guid);
        }
    }, [activity, mesh, meshIdToRockId]);

	return (
		<group position={activity.position}>
            <mesh 
                ref={mesh} 
                geometry={geometry} 
                material={material} 
                material-roughness={1} 
                material-metalness={0.5} 
                layers={1} 
                scale={activity.scale} 
            />
		</group>
	)
}
