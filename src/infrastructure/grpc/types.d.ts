import { ListEffectivePrivilegesRequest, ListEffectivePrivilegesResponse } from "@monadiam/shared";
import { Observable } from "rxjs";

declare global {
    namespace GRPC {
        namespace AccessControl {
            interface Contract {
                listEffectivePrivileges: ListEffectivePrivileges.Signature;
            }

            namespace ListEffectivePrivileges {
                type Props = ListEffectivePrivilegesRequest;

                type Result = Promise<Record<string, string>>;

                type Signature = (props: Props) => Result;
            }

            namespace Service {
                interface Contract {
                    listEffectivePrivileges: ListEffectivePrivileges.Signature;
                }

                namespace ListEffectivePrivileges {
                    type Props = ListEffectivePrivilegesRequest;

                    type Result = Observable<ListEffectivePrivilegesResponse>;

                    type Signature = (props: Props) => Result;
                }
            }
        }
    }
}
