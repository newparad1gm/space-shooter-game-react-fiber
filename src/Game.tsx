import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Engine } from './game/Engine';
import { Crosshair } from './objects/Crosshair';
import { WorldLoader } from './world/WorldLoader';
import { Controls, Hud, GameStartOptions } from './options/GameOptions';
import { WorldName } from './world/WorldLoader';
import './Game.css';

export const Game = (): JSX.Element => {
    const engine = useMemo(() => new Engine(), []);
    [ engine.network.client, engine.network.setClient ] = useState<WebSocket>();
    const [ gameStarted, setGameStarted ] = useState<boolean>(false);
    const [ worldName, setWorldName ] = useState<WorldName>(WorldName.Space);
    const [ controls, setControls ] = useState<boolean>(true);

    const onWindowResize = useCallback(() => {
        const camera = engine.camera;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }, [engine.camera]);

    const handleMouseDown = useCallback(() => {
        document.body.requestPointerLock();
    }, []);

    useEffect(() => {
        if (gameStarted) {
            window.addEventListener('resize', onWindowResize);
            document.body.addEventListener('mousedown', handleMouseDown);
        }
    }, [gameStarted, handleMouseDown, onWindowResize]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        engine.keyStates.add(event.code);
        if (event.code === 'KeyI') {
            setControls(c => !c);
        }
    }, [engine]);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        engine.keyStates.delete(event.code);
    }, [engine]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup',handleKeyUp);
    }, [engine, handleKeyDown, handleKeyUp]);

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
                    engine.clock.start();
                }}
            >
                <Crosshair engine={engine} />
                <WorldLoader engine={engine} worldName={worldName} />
                <EffectComposer>
                    <Bloom luminanceThreshold={1} luminanceSmoothing={0.9} height={300} />
                </EffectComposer>
                <Stats />
            </Canvas> }
            { gameStarted && controls && <Controls /> }
            { gameStarted && <Hud engine={engine} /> }
            { !gameStarted && <GameStartOptions worldName={worldName} setWorldName={setWorldName} setGameStarted={setGameStarted} network={engine.network} /> }
        </div>
    )
}