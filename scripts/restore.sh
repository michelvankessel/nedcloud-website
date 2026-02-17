#!/usr/bin/env sh
set -e

# Database and backup paths
BACKUP_DIR="/backups"
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log_info() {
echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
    exit 1
}

log_warn() {
echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

main() {
    if [ $# -ne 1 ]; then
        log_error "Usage: restore.sh <backup_file>"
        echo "Example: restore.sh nedcloud_20230101_120000.sql.gz"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file $BACKUP_FILE not found"
        exit 1
    fi

    DATABASE_NAME=$(echo "$BACKUP_FILE" | grep -o '[^_]*_')
    DATABASE_NAME=${DATABASE_NAME%_}

    # Validate backup integrity
    log_info "Validating backup integrity..."
    if ! gzip -t "$BACKUP_FILE" > /dev/null 2>&1; then
log_error "Backup integrity check failed"
    exit 1

    fi
    log_info "Backup integrity verified."

    # Check for existing database and drop if present
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -lqt | cut -d \| -f1 | grep -qw "${DATABASE_NAME}"; then
        log_info "Dropping existing database '${DATABASE_NAME}'...";
        if ! dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DATABASE_NAME}"; then
            log_error "Failed to drop existing database"
            exit 1
        fi
    fi

    # Create new database
    log_info "Creating database '${DATABASE_NAME}'...";
    if ! createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DATABASE_NAME}"; then
        log_error "Failed to create database"
        exit 1
    fi

    # Restore database from backup
    log_info "Restoring database from backup...";
    if ! pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DATABASE_NAME}" "$BACKUP_FILE"; then
        log_error "Restore failed"
        exit 1
    fi

    log_info "Database restored successfully from $BACKUP_FILE"
}

main "$@"