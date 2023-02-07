import { Engine } from "./Engine";

export class Network {
    engine: Engine;

    client?: WebSocket;
    setClient?: React.Dispatch<React.SetStateAction<WebSocket | undefined>>;

    timeout: number = 20;

    constructor(engine: Engine) {
        this.engine = engine;
        engine.network = this;
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
                if (messageData.new) {
                    this.engine.addRock(messageData.new);
                } else if (messageData.started) {
                    this.engine.destroyRock(messageData.started.id);
                }
            };
        }
    }

    sendRock = (guid: string) => {
        this.client && this.client.send(JSON.stringify({
            id: guid
        }));
    }
}