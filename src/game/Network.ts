import { JsonResponse, Workflow } from "../Types";
import { Engine } from "./Engine";

export class Network {
    engine: Engine;

    client?: WebSocket;
    setClient?: React.Dispatch<React.SetStateAction<WebSocket | undefined>>;

    timeout: number = 20;

    workflows: Map<string, Workflow>;

    constructor(engine: Engine) {
        this.engine = engine;
        engine.network = this;
        this.workflows = new Map();
    }

    setupClient = (setGameStarted: React.Dispatch<React.SetStateAction<boolean>>) => {
        if (this.client) {
            this.client.onopen = () => {
                if (this.client) {
                    setGameStarted(true);
                    const timeoutMs = this.timeout * 1000 || 20000;
                    this.client.send(JSON.stringify({
                        timeout: timeoutMs
                    }));
                    console.log('Connected');
                }
            };

            this.client.onmessage = (message) => {
                let messageData;
                try {
                    messageData = JSON.parse(message.data as string);
                } catch (e) {
                    messageData = JSON.parse(JSON.stringify(message.data));
                }
                if (messageData.activity) {
                    this.engine.addRock(messageData.activity);
                    this.addActivity(messageData.activity);
                } else if (messageData.activityStarted) {
                    this.engine.destroyRock(messageData.activityStarted.id);
                } else if (messageData.stage) {
                    this.engine.addRing(messageData.stage);
                    this.transitionStage(messageData.stage);
                } else if (messageData.stageEntered) {
                    this.engine.destroyRing(messageData.stageEntered.id);
                }
            };
        }
    }

    getWorkflow = (workflow: JsonResponse): Workflow | undefined => {
        if (workflow?.id) {
            if (!this.workflows.has(workflow.id)) {
                this.workflows.set(workflow.id, {
                    name: workflow.name,
                    id: workflow.id,
                    activities: [],
                });
            }
            return this.workflows.get(workflow.id);
        }
    }

    addActivity = (activity: JsonResponse) => {
        if (activity.workflow) {
            const workflow = this.getWorkflow(activity.workflow);
            if (workflow) {
                workflow.activities.push({
                    name: activity.activity.name,
                    id: activity.activityId,
                    executionTime: new Date(activity.time)
                });
                this.engine.setWorkflows && this.engine.setWorkflows(Array.from(this.workflows.values()));
            }
        }
    }

    transitionStage = (stage: JsonResponse) => {
        if (stage.workflow) {
            const workflow = this.getWorkflow(stage.workflow);
            if (workflow) {
                workflow.currentStage = {
                    name: stage.stage.name,
                    id: stage.stageId,
                    enteredTime: new Date(stage.time)
                };
                this.engine.setWorkflows && this.engine.setWorkflows(Array.from(this.workflows.values()));
            }
        }
    }

    sendId = (guid: string) => {
        this.client && this.client.send(JSON.stringify({
            id: guid
        }));
    }
}