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
    [ engine.requirements, engine.setRequirements ] = useState<string[]>([]);
    const workflowsPre = useRef<HTMLPreElement>(null);
    const rockPre = useRef<HTMLPreElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const bottomReqRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        bottomReqRef.current && bottomReqRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [engine.requirements]);

    return (
        <div id='hud'>
            Workflows:
            <div className={'hudData workflowData'}>
                <div>
                    <pre ref={workflowsPre} />
                </div>
                <div ref={bottomRef} />
            </div>
            Requirements:
            <div className={'hudData requirements'}>
                { engine.requirements.map(req => (
                    <div>{ req }</div>
                ))}
                <div ref={bottomReqRef} />
            </div>
            Activity:
            <div className='hudData'>
                <pre ref={rockPre} />
            </div>
        </div>
    )
}
interface ControlsProps {
    worldName: WorldName;
}

export const Controls = (props: ControlsProps): JSX.Element => {
    const { worldName } = props;
    return (
        <div id='controls' className='transparent'>
            <div className='hudData'>
                Controls<br/>
                {worldName === WorldName.Space && <div>
                    W - accelerate<br/>
                    S - brake<br/>
                    A - strafe left<br/>
                    D - strafe right<br/>
                    T - switch from first to third person<br/>
                    Mouse - look around and control direction<br/>
                    Mouse Button 1 - fire laser<br/>
                    I - show controls<br/>
                </div>}
                {worldName === WorldName.FPS && <div>
                    W - forward<br/>
                    S - backward<br/>
                    A - strafe left<br/>
                    D - strafe right<br/>
                    E - use<br/>
                    Space - jump<br/>
                    Mouse - look around<br/>
                    Mouse Button 1 - fire gun<br/>
                    I - show controls<br/>
                </div>}
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
    const workflows = useRef<HTMLInputElement>(null);

    const [ included, setIncluded ] = useState<boolean>(false);

    const startGame = useCallback(() => {
        if (webSocketUrl.current && timeout.current && webSocketUrl.current.value) {
            network.timeout = parseInt(timeout.current.value) || 20;
            network.setClient && network.setClient(new WebSocket(webSocketUrl.current.value));
        }
    }, [network, timeout, webSocketUrl]);

    useEffect(() => {
        if (network.client) {
            network.setupClient(setGameStarted, workflows.current && workflows.current.value, included);
        }
    }, [included, network, network.client, setGameStarted, workflows]);

    return (
        <div>
            <div>
                Select World: 
                <select value={worldName} onChange={e => setWorldName(WorldName[e.target.value as keyof typeof WorldName])}>
                    { Utils.getEnumKeys(WorldName).map((key, i) => (
                        <option key={i} value={WorldName[key]}>
                            {key}
                        </option>
                    )) }
                </select>
            </div>
            <div>WebSocket: <input type='text' ref={webSocketUrl} defaultValue={process.env.REACT_APP_WEBSOCKET_CONNECTION || window.location.origin.replace(/^http/, 'ws')} /></div>
            <div>Timeout (in seconds): <input type='number' min='5' max='60' ref={timeout} defaultValue={20} /></div>
            <div>Workflows Included: <input type='checkbox' onChange={e => setIncluded(e.target.checked)} />  (comma delimited list of names): <input type='text' ref={workflows} /></div>
            <button onClick={startGame}>
                Click to start
            </button>
        </div>
    )
}