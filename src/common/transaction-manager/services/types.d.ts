import { AnyEntity, EntityManager } from "@mikro-orm/postgresql";

import { KafkaTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
        namespace Service {
            interface PublicContract {
                run<T extends AnyEntity | AnyEntity[]>(props: Run.ResultProps<T>): Promise<T>;
                run(props: Run.VoidProps): Promise<void>;
            }

            interface PrivateContract {
                buildAuditLogArchiveOutbox(props: BuildAuditLogArchiveOutbox.Props): BuildAuditLogArchiveOutbox.Result;
                persistOutboxEvents<T extends AnyEntity | AnyEntity[]>(
                    props: PersistOutboxEvents.Props<T>,
                ): PersistOutboxEvents.Result;
                executeWithEffects<T extends AnyEntity | AnyEntity[]>(
                    props: ExecuteWithEffects.Props<T>,
                ): ExecuteWithEffects.Result<T>;
            }

            interface Contract extends PublicContract, PrivateContract {}

            type OutboxConfig<T> = {
                payloadMapper?(result: T): AnyEntity | AnyEntity[];
                destinationTopic: KafkaTopic;
                metadata?: UnknownObject;
                actionType: string;
            };

            namespace Run {
                type ResultProps<T extends AnyEntity | AnyEntity[]> = {
                    execute(transaction: EntityManager): Promise<T> | T;
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    outbox?: OutboxConfig<T> | OutboxConfig<T>[];
                    changeLog?: boolean;
                    resource?: string;
                };

                type VoidProps = {
                    execute(transaction: EntityManager): Promise<void> | void;
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    changeLog?: never;
                    resource?: string;
                    outbox?: never;
                };

                type Props<T extends AnyEntity | AnyEntity[]> = ResultProps<T> | VoidProps;

                type Result<T> = Promise<T | void>;
            }

            namespace ExecuteWithEffects {
                type Props<T extends AnyEntity | AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: EntityManager;
                };

                type Result<T> = Promise<T | void>;
            }

            namespace PersistOutboxEvents {
                type Props<T extends AnyEntity | AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: EntityManager;
                    result: T;
                };

                type Result = void;
            }

            namespace BuildAuditLogArchiveOutbox {
                type Props = SystemEntities.AuditLog;

                type Result = SystemEntities.Outbox;
            }
        }
    }
}
