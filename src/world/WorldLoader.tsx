import React, { Suspense } from "react"
import { Engine } from "../game/Engine";
import { SpaceWorld } from "./SpaceWorld";
import { FPSWorld } from "./FPSWorld";

export enum WorldName {
    Space = 'Space',
    FPS = 'FPS'
}

export interface WorldProps {
    engine: Engine;
}

interface WorldLoaderProps {
    engine: Engine;
    worldName: WorldName;
}

export const WorldLoader = (props: WorldLoaderProps): JSX.Element => {
    const { engine, worldName } = props;

    return (
        <Suspense>
            { worldName === WorldName.Space && <SpaceWorld engine={engine} /> }
            { worldName === WorldName.FPS && <FPSWorld engine={engine} /> }
        </Suspense>
    )
}