import { ConfigService } from "@nestjs/config";
import { KafkaContext } from "@nestjs/microservices";
import { readFileSync } from "fs";
import { KafkaConfig } from "kafkajs";

export abstract class KafkaUtils {
    private constructor() {}

    public static buildClientConfig(config: ConfigService, options: { withClientId?: boolean } = {}): KafkaConfig {
        const broker = config.getOrThrow<string>("KAFKA_BROKER");
        const clientId = config.getOrThrow<string>("SERVICE_NAME");
        const password = readFileSync(config.getOrThrow<string>("KAFKA_SASL_PASSWORD_FILE"), "utf8").trim();

        return {
            ...(options.withClientId ? { clientId } : {}),
            brokers: [broker],
            ssl: {
                rejectUnauthorized: this.toBoolean(config.getOrThrow("KAFKA_SSL_REJECT_UNAUTHORIZED")),
                servername: broker.split(":")[0],
                ca: [readFileSync(config.getOrThrow<string>("KAFKA_SSL_CA_FILE"), "utf8")],
                cert: readFileSync(config.getOrThrow<string>("KAFKA_SSL_CERT_FILE"), "utf8"),
                key: readFileSync(config.getOrThrow<string>("KAFKA_SSL_KEY_FILE"), "utf8"),
            },
            sasl: {
                mechanism: "scram-sha-512",
                username: config.getOrThrow<string>("KAFKA_SASL_USERNAME"),
                password,
            },
        };
    }

    public static extractRetryCount(context: KafkaContext): number {
        const raw = context.getMessage().headers?.["x-retry-count"];
        return Number(Buffer.isBuffer(raw) ? raw.toString() : (raw ?? 0));
    }

    private static toBoolean(value: unknown): boolean {
        return value === true || value === "true";
    }
}
