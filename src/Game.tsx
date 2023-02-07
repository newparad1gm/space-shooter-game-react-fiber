import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Ship } from './player/Ship';
import { Engine } from './game/Engine';
import { Crosshair } from './objects/Crosshair';
import { WorldLoader } from './world/WorldLoader';
import { Hud, GameStartOptions } from './options/GameOptions';
import { WorldName } from './world/WorldLoader';
import './Game.css';

export const Game = (): JSX.Element => {
    const engine = useMemo(() => new Engine(), []);
    [ engine.network.client, engine.network.setClient ] = useState<WebSocket>();
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
                <EffectComposer>
                    <Bloom luminanceThreshold={1} luminanceSmoothing={0.9} height={300} />
                </EffectComposer>
            </Canvas> }
            { gameStarted && <Hud engine={engine} /> }
            { !gameStarted && <GameStartOptions worldName={worldName} setWorldName={setWorldName} setGameStarted={setGameStarted} network={engine.network} /> }
        </div>
    )
}