import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { InvalidationScope, KafkaTopic } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { KafkaTopicBuilder, KAFKA_RETRY_REGISTRY, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
import { KafkaMetricsRecorder } from "~observability/metrics/kafka.recorder";
import { ACCESS_CACHE_SERVICE } from "~context/infrastructure/services";
import { Exception } from "~common/exceptions";

@Controller()
export class AccessCacheConsumer implements Consumers.AccessCache.Contract, OnModuleInit {
    private readonly logger = new Logger(AccessCacheConsumer.name);

    public constructor(
        @Inject(ACCESS_CACHE_SERVICE)
        private readonly accessCacheService: InfrastructureServices.AccessCache.PublicContract,
        @Inject(KafkaMetricsRecorder)
        private readonly kafkaMetrics: Observability.Metrics.Kafka.PublicContract,
        @Inject(KAFKA_SCHEMA_REGISTRY)
        private readonly schemaRegistry: Kafka.SchemaRegistry.PublicContract,
        @Inject(KAFKA_RETRY_REGISTRY)
        private readonly retryRegistry: Kafka.RetryRegistry.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();

        this.retryRegistry.register({
            topic: KafkaTopic.ACCESS_CACHE,
            handler: this,
        });
    }

    @EventPattern(KafkaTopic.ACCESS_CACHE)
    public async handle(@Payload() message: Consumers.AccessCache.Message): Consumers.AccessCache.Handle.Result {
        try {
            await this.process({ message });
        } catch (error) {
            await this.reject({ message, error });
        }
    }

    public async process(props: Consumers.AccessCache.Process.Props): Consumers.AccessCache.Process.Result {
        const { message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.ACCESS_CACHE, value: message });
        for await (const item of message.payload.items) {
            switch (item.scope) {
                case InvalidationScope.ACCOUNT_REALM:
                    await this.accessCacheService.delete(item);
                    break;
                case InvalidationScope.ACCOUNT:
                    await this.accessCacheService.deleteAccount(item);
                    break;
                case InvalidationScope.REALM:
                    await this.accessCacheService.deleteRealm(item);
                    break;
                case InvalidationScope.GLOBAL:
                    await this.accessCacheService.deleteAll();
                    break;
            }
        }
    }

    public async reject(props: Consumers.AccessCache.Reject.Props): Consumers.AccessCache.Reject.Result {
        const { message, error } = props;
        const retryable = Exception.isRetryable(error);

        if (!retryable) {
            this.logger.warn(`Non-retryable error in access cache consumer: ${String(error)}`);
        }

        await lastValueFrom(
            this.kafkaClient.emit(
                retryable ? KafkaTopicBuilder.retry(KafkaTopic.ACCESS_CACHE) : KafkaTopic.ACCESS_CACHE_DEAD,
                {
                    value: {
                        originalTopic: KafkaTopic.ACCESS_CACHE,
                        error: String(error),
                        payload: message,
                    },
                },
            ),
        );

        if (retryable) {
            this.kafkaMetrics.recordRetry({ topic: KafkaTopic.ACCESS_CACHE, error });
        } else {
            this.kafkaMetrics.recordDead({ topic: KafkaTopic.ACCESS_CACHE, error });
        }
    }
}
