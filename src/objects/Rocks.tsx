import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { GLTF } from 'three-stdlib';
import { SpaceObject as RockType } from '../Types';
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
    rocks: RockType[];
	meshIdToRockId: Map<string, string>;
    group: React.RefObject<THREE.Group>;
}

export const Rocks = (props: RocksProps): JSX.Element => {
	const { nodes, materials } = useGLTF('gltf/rock.gltf') as GLTFResult;
    const { rocks, meshIdToRockId, group } = props;

    return (
        <group>
            <group>
                { rocks.map(rock => <TextSprite 
                    key={rock.guid}
                    text={rock.data.activity.name} 
                    position={[rock.position.x, rock.position.y + (rock.scale.y / 2) + 2, rock.position.z]} 
                    color={'#ff0000'} 
                    font={'50px Georgia'} />
                )}
            </group>
            <group ref={group}>
                { rocks.map(rock => <Rock 
                    key={rock.guid} 
                    rock={rock} 
                    geometry={nodes.node_id4_Material_52_0.geometry} 
                    material={materials.Material_52} 
                    meshIdToRockId={meshIdToRockId} />
                )}
            </group>
        </group>
    );
}

useGLTF.preload('/rock.gltf');

interface RockProps {
    rock: RockType;
    geometry: THREE.BufferGeometry;
    material: THREE.Material; 
    meshIdToRockId: Map<string, string>;
}

export const Rock = (props: RockProps) => {
	const { rock, geometry, material, meshIdToRockId } = props;
    const mesh = useRef<THREE.Mesh>(null);

    useEffect(() => {
        if (mesh.current) {
            rock.mesh = mesh.current;
            meshIdToRockId.set(mesh.current.uuid, rock.guid);
        }
    }, [mesh, meshIdToRockId, rock]);

    /*useEffect(() => {
        if (mesh.current) {
            const positionAttribute = mesh.current.geometry.getAttribute('position');
            if (positionAttribute instanceof THREE.BufferAttribute || positionAttribute instanceof THREE.InterleavedBufferAttribute) {
                for (var vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex++)
                {       
                    const localVertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, vertexIndex).clone();
                    const globalVertex = localVertex.applyMatrix4(mesh.current.matrix);
                    const directionVector = globalVertex.sub(mesh.current.position);
                
                    rock.rays.push({ 
                        ray: new THREE.Raycaster(mesh.current.getWorldPosition(new THREE.Vector3()), directionVector.clone().normalize()), 
                        vector: directionVector 
                    });
                }
            }
        }
    }, [mesh]);*/

	return (
		<group position={rock.position}>
            <mesh ref={mesh} geometry={geometry} material={material} material-roughness={1} material-metalness={0.5} layers={1} scale={rock.scale} />
		</group>
	)
}
