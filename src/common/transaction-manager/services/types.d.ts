import { KafkaTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
        namespace Service {
            interface PublicContract {
                run<T extends ORM.AnyEntity | ORM.AnyEntity[]>(props: Run.ResultProps<T>): Promise<T>;
                run(props: Run.VoidProps): Promise<void>;
            }

            interface InternalContract {
                buildAuditLogArchiveOutbox(props: BuildAuditLogArchiveOutbox.Props): BuildAuditLogArchiveOutbox.Result;
                persistOutboxEvents<T extends ORM.AnyEntity | ORM.AnyEntity[]>(
                    props: PersistOutboxEvents.Props<T>,
                ): PersistOutboxEvents.Result;
                executeWithEffects<T extends ORM.AnyEntity | ORM.AnyEntity[]>(
                    props: ExecuteWithEffects.Props<T>,
                ): ExecuteWithEffects.Result<T>;
            }

            interface Contract extends PublicContract, InternalContract {}

            type OutboxConfig<T> = {
                payloadMapper?(result: T): ORM.AnyEntity | ORM.AnyEntity[];
                destinationTopic: KafkaTopic;
                metadata?: UnknownObject;
                actionType: string;
            };

            namespace Run {
                type ResultProps<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                    execute(transaction: ORM.EntityManager): Promise<T> | T;
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    outbox?: OutboxConfig<T> | OutboxConfig<T>[];
                    changeLog?: boolean;
                    resource?: string;
                };

                type VoidProps = {
                    execute(transaction: ORM.EntityManager): Promise<void> | void;
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    changeLog?: never;
                    resource?: string;
                    outbox?: never;
                };

                type Props<T extends ORM.AnyEntity | ORM.AnyEntity[]> = ResultProps<T> | VoidProps;

                type Result<T> = Promise<T | void>;
            }

            namespace ExecuteWithEffects {
                type Props<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: ORM.EntityManager;
                };

                type Result<T> = Promise<T | void>;
            }

            namespace PersistOutboxEvents {
                type Props<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: ORM.EntityManager;
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
