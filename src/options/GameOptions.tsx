import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WorldName } from '../world/WorldLoader';
import { Utils } from '../Utils';
import { Engine } from '../game/Engine';
import { Workflow, WorldObject } from '../Types';
import { Network } from '../game/Network';

interface HudProps {
    engine: Engine;
}

export const Hud = (props: HudProps): JSX.Element => {
    const { engine } = props;
    [ engine.currentActivity, engine.setCurrentActivity ] = useState<WorldObject>();
    [ engine.workflows, engine.setWorkflows ] = useState<Workflow[]>([]);
    const workflowsPre = useRef<HTMLPreElement>(null);
    const rockPre = useRef<HTMLPreElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (rockPre.current) {
            rockPre.current.innerHTML = engine.currentActivity ? JSON.stringify(engine.currentActivity.data, undefined, 2) : '';
        }
    }, [rockPre, engine.currentActivity]);

    useEffect(() => {
        if (workflowsPre.current) {
            workflowsPre.current.innerHTML = engine.workflows ? JSON.stringify(engine.workflows, undefined, 2) : '';
        }
        bottomRef.current && bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [workflowsPre, engine.workflows]);

    return (
        <div id='hud'>
            <div className={'hudData workflowData'}>
                Workflows:
                <div>
                    <pre ref={workflowsPre} />
                </div>
                <div ref={bottomRef} />
            </div>
            <div className='hudData'>
                Activity:
                <pre ref={rockPre} />
            </div>
        </div>
    )
}

export const Controls = (): JSX.Element => {
    return (
        <div id='controls' className='transparent'>
            <div className='hudData'>
                Controls<br/>
                W - accelerate<br/>
                S - brake<br/>
                A - strafe left<br/>
                D - strafe right<br/>
                T - switch from first to third person<br/>
                Mouse - look around and control direction<br/>
                Mouse Button 1 - fire laser<br/>
                I - enable/disable controls<br/>
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
    const timeout = useRef<HTMLInputElement>(null);

    const startGame = useCallback(() => {
        if (webSocketUrl.current && timeout.current && webSocketUrl.current.value) {
            network.timeout = parseInt(timeout.current.value) || 20;
            network.setClient && network.setClient(new WebSocket(webSocketUrl.current.value));
        }
    }, [network, timeout, webSocketUrl]);

    useEffect(() => {
        if (network.client) {
            network.setupClient(setGameStarted);
        }
    }, [network, network.client, setGameStarted]);

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
            <div>Timeout (in seconds): <input type='number' min='5' max='60' ref={timeout} defaultValue={20} /></div>
            <button onClick={startGame}>
                Click to start
            </button>
        </div>
    )
}