import { KafkaContext } from "@nestjs/microservices";

declare global {
    namespace Consumers {
        namespace AccessCache {
            type Message = Topics.AccessCache.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, ctx: KafkaContext) => Result;
            }
        }

        namespace Blacklist {
            type Message = Topics.Blacklist.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message) => Result;
            }
        }

        namespace Reauthentication {
            type Message = Topics.Reauthentication.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message) => Result;
            }
        }

        namespace Retry {
            type Message = Consumers.DLQ.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, ctx: KafkaContext) => Result;
            }
        }
    }
}
