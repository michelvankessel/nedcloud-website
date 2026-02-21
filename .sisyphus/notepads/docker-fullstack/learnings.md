# Docker Setup Learnings

## Dockerfile Development
- **Base Image:** `node:20-alpine` is efficient for lightweight Docker images.
- **Dependencies:** `libc6-compat` and `bash` are necessary for compatibility and shell access.
- **Layer Caching:** Copy `package.json` and `package-lock.json` first to leverage Docker layer caching.

## Turbopack Limitations
- **Turbopack Error:** Turbopack does not support running development servers within Docker containers due to `.next` directory handling issues.
- **Workaround:** Use local `npm run dev` for development and Docker for production deployment.

## Environment Variables
- **Security:** Use `--build-arg` for passing sensitive environment variables securely during the Docker build process.
- **Production:** Ensure environment variables like `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` are securely managed in production.

## Build Process
- **Production Build:** Use `npm run build` locally before deploying with Docker.
- **Local Development:** Use `npm run dev` for local development and debugging.

## Docker Compose Dev Stack Configuration

### Overview
Configured a development stack with three services: **postgres**, **app**, and **studio**. Each service is designed for hot-reloading, easy debugging, and seamless integration.

### Key Configuration Decisions

1. **Postgres Service Configuration**
   - **Image:** `postgres:16-alpine` for lightweight performance
   - **Container Name:** `nedcloud-dev-db` for clear identification
   - **Environment Variables:** Loaded from `.env.local` for security and flexibility
   - **Healthcheck:** Implemented `pg_isready` to ensure database readiness before app startup
   - **Volume:** `postgres_dev_data` for persistent data storage

2. **App Service Configuration**
   - **Build Context:** Uses `Dockerfile.dev` for development-specific optimizations
   - **Container Name:** `nedcloud-dev-app` for clarity
   - **Ports:** Exposed `3000:3000` for development server
   - **Volumes:** Mounted project root (`./:/app`) for hot-reloading of source code
   - **Environment Variables:** 
     - `DATABASE_URL` constructed dynamically using Docker network URL
     - `CHOKIDAR_USEPOLLING=true` and `WATCHPACK_POLLING=true` for reliable file watching in Docker
   - **Dependencies:** Waits for `postgres` to be healthy before starting
   - **Command:** Runs `npm run dev` for development server

3. **Studio Service Configuration**
   - **Build Context:** Uses `Dockerfile.dev` for development-specific optimizations
   - **Container Name:** `nedcloud-dev-studio` for clear identification
   - **Ports:** Exposed `5555:5555` for Prisma Studio
   - **Environment Variables:** 
     - `DATABASE_URL` constructed dynamically using Docker network URL
   - **Dependencies:** Waits for `postgres` to be healthy before starting
   - **Command:** Runs `npx prisma studio` with `--hostname 0.0.0.0` and `--port 5555`

### Learnings and Best Practices

- **Hot Reloading:** Mounting the project root (`./:/app`) ensures that source code changes are reflected immediately in the running container, enhancing developer productivity.

- **Dynamic Environment Variables:** Using `DATABASE_URL` with Docker network names (`postgres`) allows seamless communication between services without hardcoding IP addresses.

- **Polling for File Watching:** Setting `CHOKIDAR_USEPOLLING` and `WATCHPACK_POLLING` to `true` ensures reliable file watching in Docker, which can be problematic with default inotify limitations.

- **Health Checks:** Implementing health checks ensures that services start in the correct order and that dependent services are ready before starting their dependent containers.

- **Environment File Usage:** Using `.env.local` for environment variables ensures sensitive data is not hardcoded in the configuration files.

### Observations

- The `docker compose config` command validated the configuration without errors, confirming that the setup is syntactically correct.

- The `required: true` attribute was automatically added by Docker Compose for dependencies, ensuring robust error handling.

- The configuration leverages the existing `Dockerfile.dev` for the app and studio services, maintaining consistency with the development environment setup.

### Verification

The configuration has been validated using `docker compose -f docker-compose.dev.yml config`, and the output confirms that all services are correctly defined with the appropriate settings for hot-reloading, environment variables, and dependencies.

---