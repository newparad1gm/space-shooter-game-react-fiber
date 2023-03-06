import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { GLTF } from 'three-stdlib';
import { WorldObject } from '../Types';
import { TextSprite } from './TextSprite';

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
                    scale={[80, 3, 1]}
                    color={'#ff0000'} 
                    font={'200px Georgia'} />
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
    const group = useRef<THREE.Group>(null);

    useEffect(() => {
        if (group.current) {
            activity.object = group.current;
            meshIdToRockId.set(group.current.uuid, activity.guid);
        }
    }, [activity, group, meshIdToRockId]);

	return (
		<group ref={group} position={activity.position}>
            <mesh 
                geometry={geometry} 
                material={material} 
                material-roughness={1} 
                material-metalness={0.5} 
                scale={activity.scale} 
            />
		</group>
	)
}
