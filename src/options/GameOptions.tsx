import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WorldName } from '../world/WorldLoader';
import { Utils } from '../Utils';
import { Engine } from '../game/Engine';
import { Rock } from '../Types';
import { Network } from '../game/Network';

interface HudProps {
    engine: Engine;
}

export const Hud = (props: HudProps): JSX.Element => {
    const { engine } = props;
    [ engine.currentRock, engine.setCurrentRock ] = useState<Rock>();
    const preRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        if (preRef.current) {
            preRef.current.innerHTML = engine.currentRock ? JSON.stringify(engine.currentRock.data, undefined, 2) : '';
        }
    }, [preRef, engine.currentRock])

    return (
        <div id='hud'>
            <div id='rockData' >
                <pre ref={preRef}/>
            </div>
        </div>
    )
}

interface GameStartOptionsProps {
    worldName: WorldName;
    setWorldName: React.Dispatch<React.SetStateAction<WorldName>>;
    setGameStarted: React.Dispatch<React.SetStateAction<boolean>>;
    network: Network;
}

export const GameStartOptions = (props: GameStartOptionsProps): JSX.Element => {
    const { worldName, setWorldName, setGameStarted, network } = props;
    const webSocketUrl = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<HTMLInputElement>(null);

    const startGame = useCallback(() => {
        if (webSocketUrl.current && timeoutRef.current && webSocketUrl.current.value) {
            network.timeout = parseInt(timeoutRef.current.value) || 20;
            network.setClient && network.setClient(new WebSocket(webSocketUrl.current.value));
        }
    }, [webSocketUrl, timeoutRef, network]);

    useEffect(() => {
        if (network.client) {
            network.setupClient(setGameStarted);
        }
    }, [network.client]);

    return (
        <div>
            Select World<br/>
            <select value={worldName} onChange={e => setWorldName(WorldName[e.target.value as keyof typeof WorldName])}>
                { Utils.getEnumKeys(WorldName).map((key, i) => (
                    <option key={i} value={WorldName[key]}>
                        {key}
                    </option>
                )) }
            </select>
            <div>WebSocket: <input type='text' ref={webSocketUrl} defaultValue={process.env.REACT_APP_WEBSOCKET_CONNECTION || window.location.origin.replace(/^http/, 'ws')} /></div>
            <div>Timeout (in seconds): <input type='number' min='5' max='60' ref={timeoutRef} defaultValue={20} /></div>
            <button onClick={startGame}>
                Click to start
            </button>
        </div>
    )
}