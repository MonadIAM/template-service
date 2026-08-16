CREATE ROLE template_service_readonly NOLOGIN;

GRANT CONNECT ON DATABASE "template-service" TO template_service_readonly;
GRANT USAGE ON SCHEMA public TO template_service_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO template_service_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO template_service_readonly;
