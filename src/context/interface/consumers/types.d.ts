import { KafkaContext } from "@nestjs/microservices";

declare global {
    namespace Consumers {
        namespace AccessCache {
            interface Contract {
                handle(message: Message, ctx: KafkaContext): Promise<void>;
            }

            type Message = Topics.AccessCache.Message;
        }

        namespace Blacklist {
            interface Contract {
                handle(message: Message): Promise<void>;
            }

            type Message = Topics.Blacklist.Message;
        }

        namespace Reauthentication {
            interface Contract {
                handle(message: Message): Promise<void>;
            }

            type Message = Topics.Reauthentication.Message;
        }
    }
}
