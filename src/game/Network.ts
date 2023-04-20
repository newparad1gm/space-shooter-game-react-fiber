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

    setupClient = (setGameStarted: React.Dispatch<React.SetStateAction<boolean>>, workflowNamesStr: string | null, included?: boolean) => {
        if (this.client) {
            this.client.onopen = () => {
                if (this.client) {
                    setGameStarted(true);
                    const timeoutMs = this.timeout * 1000 || 20000;
                    this.client.send(JSON.stringify({
                        timeout: timeoutMs,
                        included: included,
                        workflowNames: workflowNamesStr,
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
                    this.engine.addActivity(messageData.activity);
                    this.addActivity(messageData.activity);
                } else if (messageData.activityStarted) {
                    this.engine.removeActivity(messageData.activityStarted.id);
                } else if (messageData.stage) {
                    this.engine.addTransition(messageData.stage);
                    this.transitionStage(messageData.stage);
                } else if (messageData.stageEntered) {
                    this.engine.removeTransition(messageData.stageEntered.id);
                } else if (messageData.requirementsFulfilled) {
                    this.fulfillRequirements(messageData.requirementsFulfilled);
                }
            };
        }
    }

    getWorkflow = (workflow: JsonResponse): Workflow | undefined => {
        if (workflow?.id) {
            if (!this.workflows.has(workflow.id)) {
                this.workflows.set(workflow.id, {
                    name: workflow.name,
                    activities: [],
                    requirements: []
                });
            }
            return this.workflows.get(workflow.id);
        }
    }

    addActivity = (activity: JsonResponse) => {
        if (activity.workflow) {
            const workflow = this.getWorkflow(activity.workflow);
            if (workflow) {
                workflow.activities.push(
                    activity.activity.name
                );
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
                    enteredTime: new Date(stage.time)
                };
                this.engine.setWorkflows && this.engine.setWorkflows(Array.from(this.workflows.values()));
            }
        }
    }

    fulfillRequirements = (requirements: JsonResponse) => {
        if (requirements.workflow) {
            const workflow = this.getWorkflow(requirements.workflow);
            if (workflow) {
                workflow.requirements.push(
                    ...requirements.requirements
                );
                this.engine.setWorkflows && this.engine.setWorkflows(Array.from(this.workflows.values()));
            }
        }
        this.engine.setRequirements && this.engine.setRequirements(reqs => [...reqs, ...requirements.requirements]);
    }

    sendId = (guid: string) => {
        this.client && this.client.send(JSON.stringify({
            id: guid
        }));
    }
}