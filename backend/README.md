# HR backend

Spring Boot service for the HR module. See the repository [README.md](../README.md) for setup, API access, shared PostgreSQL schema, environment variables, and integration rules.

This service uses `ddl-auto: validate`: it requires the existing team-owned PMS schema and never creates or changes tables.
