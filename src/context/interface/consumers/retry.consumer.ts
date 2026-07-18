import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { KAFKA_RETRY_QUEUE } from "~context/infrastructure/queues";
import { KafkaUtils, KAFKA_SERVICE } from "~infrastructure/kafka";
import { KafkaTopic } from "~context/enums";

const RETRY_TOPICS: KafkaTopic[] = [];

const DEAD_TOPIC_MAP: Partial<Record<string, string>> = {};

@Controller()
export class RetryConsumer implements OnModuleInit {
    public constructor(
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
        @Inject(KAFKA_RETRY_QUEUE)
        private readonly kafkaRetryQueue: Queues.KafkaRetry.Contract,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(RETRY_TOPICS)
    public async handle(@Payload() message: Consumers.DLQ.Message, @Ctx() context: KafkaContext): Promise<void> {
        const retryCount = KafkaUtils.extractRetryCount(context);

        if (retryCount >= this.kafkaRetryQueue.maxRetryCount) {
            await this.moveToDeadLetter(message);
        } else {
            await this.kafkaRetryQueue.schedule(message, retryCount);
        }
    }

    private async moveToDeadLetter(message: Consumers.DLQ.Message): Promise<void> {
        const deadTopic = DEAD_TOPIC_MAP[message.originalTopic];
        if (deadTopic) {
            await lastValueFrom(this.kafkaClient.emit(deadTopic, message));
        }
    }
}
