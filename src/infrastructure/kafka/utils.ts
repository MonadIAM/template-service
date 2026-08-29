import { ConfigService } from "@nestjs/config";
import { KafkaContext } from "@nestjs/microservices";
import { readFileSync } from "fs";
import { KafkaConfig } from "kafkajs";

export abstract class KafkaUtils {
    private constructor() {}

    public static buildClientConfig(config: ConfigService, options: { withClientId?: boolean } = {}): KafkaConfig {
        const broker = config.getOrThrow<string>("KAFKA_BROKER");
        const clientId = config.getOrThrow<string>("SERVICE_NAME");

        return {
            ...(options.withClientId ? { clientId } : {}),
            brokers: [broker],
            ...this.buildSslConfig(config, broker),
            ...this.buildSaslConfig(config),
        };
    }

    private static buildSslConfig(config: ConfigService, broker: string): Pick<KafkaConfig, "ssl"> {
        if (this.toBoolean(config.getOrThrow("KAFKA_SSL_ENABLED"))) {
            return {
                ssl: {
                    rejectUnauthorized: this.toBoolean(config.getOrThrow("KAFKA_SSL_REJECT_UNAUTHORIZED")),
                    servername: broker.split(":")[0],
                    ca: [readFileSync(config.getOrThrow<string>("KAFKA_SSL_CA_FILE"), "utf8")],
                    cert: readFileSync(config.getOrThrow<string>("KAFKA_SSL_CERT_FILE"), "utf8"),
                    key: readFileSync(config.getOrThrow<string>("KAFKA_SSL_KEY_FILE"), "utf8"),
                },
            };
        } else {
            return {};
        }
    }

    private static buildSaslConfig(config: ConfigService): Pick<KafkaConfig, "sasl"> {
        if (this.toBoolean(config.getOrThrow("KAFKA_SASL_ENABLED"))) {
            const password = readFileSync(config.getOrThrow<string>("KAFKA_SASL_PASSWORD_FILE"), "utf8").trim();

            return {
                sasl: {
                    mechanism: "scram-sha-512",
                    username: config.getOrThrow<string>("KAFKA_SASL_USERNAME"),
                    password,
                },
            };
        } else {
            return {};
        }
    }

    public static extractRetryCount(context: KafkaContext): number {
        const raw = context.getMessage().headers?.["x-retry-count"];
        return Number(Buffer.isBuffer(raw) ? raw.toString() : (raw ?? 0));
    }

    private static toBoolean(value: unknown): boolean {
        return value === true || value === "true";
    }
}
