import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { InvalidationScope, KafkaTopic } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { ACCESS_CACHE_SERVICE } from "~context/infrastructure/services";
import { KafkaUtils, KAFKA_SERVICE } from "~infrastructure/kafka";
import { Exception } from "~common/exceptions";

@Controller()
export class AccessCacheConsumer implements Consumers.AccessCache.Contract, OnModuleInit {
    private readonly logger = new Logger(AccessCacheConsumer.name);

    public constructor(
        @Inject(ACCESS_CACHE_SERVICE)
        private readonly accessCacheService: InfrastructureServices.AccessCache.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.ACCESS_CACHE)
    public async handle(@Payload() message: Consumers.AccessCache.Message, @Ctx() context: KafkaContext): Promise<void> {
        try {
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
        } catch (error) {
            if (Exception.isRetryable(error)) {
                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.ACCESS_CACHE_RETRY, {
                        headers: {
                            "x-retry-count": String(KafkaUtils.extractRetryCount(context)),
                        },
                        value: {
                            originalTopic: KafkaTopic.ACCESS_CACHE,
                            payload: message.payload,
                            error: String(error),
                        },
                    }),
                );
            } else {
                this.logger.warn(`Non-retryable error in access cache invalidation consumer: ${String(error)}`);
                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.ACCESS_CACHE_DEAD, {
                        value: {
                            originalTopic: KafkaTopic.ACCESS_CACHE,
                            payload: message.payload,
                            error: String(error),
                        },
                    }),
                );
            }
        }
    }
}
