import React, { Suspense } from "react"
import { Engine } from "../game/Engine";
import { SpaceWorld } from "./SpaceWorld";

export enum WorldName {
    Space = 'Space'
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
        </Suspense>
    )
}