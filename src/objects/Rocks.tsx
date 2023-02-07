import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { GLTF } from 'three-stdlib';
import { Rock as RockType } from '../Types';

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
        <group ref={group}>
            { rocks.map(rock => <Rock key={rock.guid} rock={rock} geometry={nodes.node_id4_Material_52_0.geometry} material={materials.Material_52} meshIdToRockId={meshIdToRockId} />) }
        </group>
    );
}

useGLTF.preload('/rock.gltf');

const randomScale = () => {
    return (Math.random() + 0.5) * 10
}

interface RockProps {
    rock: RockType;
    geometry: THREE.BufferGeometry;
    material: THREE.Material; 
    meshIdToRockId: Map<string, string>;
}

export const Rock = (props: RockProps) => {
	const { rock, geometry, material, meshIdToRockId } = props;
    const mesh = useRef<THREE.Mesh>(null);
    const scale = useMemo(() => new THREE.Vector3(randomScale(), randomScale(), randomScale()), []);
    const textMaterial = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.font = '50px Georgia';
            ctx.fillStyle = '#ff0000';
            ctx.textBaseline = 'middle'
            ctx.textAlign = 'center';
            ctx.fillText(rock.data.activity.name, canvas.width / 2, canvas.height / 2);

            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            const material = new THREE.SpriteMaterial({ map: texture });
            material.depthWrite = false;
            return material;
        }
    }, [rock]);

    useEffect(() => {
        if (mesh.current) {
            rock.mesh = mesh.current;
            meshIdToRockId.set(mesh.current.uuid, rock.guid);
        }
    }, [mesh, meshIdToRockId, rock]);

	return (
		<group position={rock.position}>
			<sprite position={[0, (scale.y / 2) + 2, 0]} material={textMaterial} scale={[30, 3, 1]} />
            <mesh ref={mesh} geometry={geometry} material={material} material-roughness={1} material-metalness={0.5} layers={1} scale={scale} />
		</group>
	)
}
