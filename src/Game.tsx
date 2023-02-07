import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Ship } from './player/Ship';
import { Engine } from './game/Engine';
import { Crosshair } from './objects/Crosshair';
import { WorldLoader } from './world/WorldLoader';
import { Hud, GameStartOptions } from './options/GameOptions';
import { WorldName } from './world/WorldLoader';
import { Network } from './game/Network';
import './Game.css';

export const Game = (): JSX.Element => {
    const engine = useMemo(() => new Engine(), []);
    const network = useMemo(() => new Network(engine), []);
    [ network.client, network.setClient ] = useState<WebSocket>();
    const [ gameStarted, setGameStarted ] = useState<boolean>(true);
    const [ worldName, setWorldName ] = useState<WorldName>(WorldName.Space);

    return (
        <div style={{width: '100%', height: '100vh'}} >
            { gameStarted && <Canvas
                gl={{ antialias: false }}
                camera={{ near: 0.01, far: 10000, fov: 70 }}
                onCreated={({gl, scene, camera}) => {
                    engine.renderer = gl;
                    engine.scene = scene;
                    engine.camera = camera as THREE.PerspectiveCamera;
                    engine.camera.layers.enable(1);
                }}
            >
                <Crosshair engine={engine} />
                <WorldLoader engine={engine} worldName={worldName} />
                <Ship engine={engine} />
            </Canvas> }
            { gameStarted && <Hud engine={engine} /> }
            { !gameStarted && <GameStartOptions worldName={worldName} setWorldName={setWorldName} setGameStarted={setGameStarted} network={network} /> }
        </div>
    )
}