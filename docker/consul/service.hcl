service {
    name    = "template-service"
    id      = "template-service"
    address = "template-service-connect"
    port    = 5003

    connect {
        sidecar_service {
            address = "template-service-connect"
            port    = 21004

            proxy {
                local_service_address = "127.0.0.1"
                local_service_port    = 5003

                config {
                    bind_address = "0.0.0.0"
                    bind_port    = 21004
                }

                upstreams = [
                    {
                        destination_name   = "access-control-service"
                        local_bind_address = "127.0.0.1"
                        local_bind_port    = 15051
                    }
                ]
            }
        }
    }
}
