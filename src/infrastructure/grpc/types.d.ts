import { ListEffectivePrivilegesRequest, ListEffectivePrivilegesResponse } from "@monadiam/shared";
import { Observable } from "rxjs";

declare global {
    namespace GRPC {
        namespace AccessControl {
            interface Contract {
                listEffectivePrivileges(props: ListEffectivePrivileges.Props): ListEffectivePrivileges.Result;
            }

            namespace ListEffectivePrivileges {
                type Props = ListEffectivePrivilegesRequest;
                type Result = Promise<Record<string, string>>;
            }

            type Service = {
                listEffectivePrivileges(
                    request: ListEffectivePrivilegesRequest,
                ): Observable<ListEffectivePrivilegesResponse>;
            };
        }
    }
}
