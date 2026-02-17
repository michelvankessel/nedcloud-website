#!/usr/bin/env sh
set -e

BACKUP_DIR="/backups"
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-nedcloud}
DB_USER=${DB_USER:-nedcloud}
DB_PASSWORD=${DB_PASSWORD:-nedcloud_dev}
RETENTION_DAYS=7

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

required_configuration_provided() {
    if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
        log_error "Missing required database configuration. Please set DB_NAME, DB_USER, and DB_PASSWORD."
        exit 1
    fi
}

generate_timestamped_filename() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    echo "${DB_NAME}_${timestamp}.sql.gz"
}

wait_for_database_connection() {
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for PostgreSQL to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q; then
            log_info "PostgreSQL is ready."
            return 0
        fi
        
        log_warn "Database not ready yet. Attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "PostgreSQL did not become ready in time."
    return 1
}

create_compressed_dump() {
    local backup_file="$1"
    local backup_path="${BACKUP_DIR}/${backup_file}"
    
    log_info "Starting database backup..."
    log_info "Database: $DB_NAME"
    log_info "Host: $DB_HOST:$DB_PORT"
    log_info "Backup file: $backup_path"
    
    mkdir -p "$BACKUP_DIR"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v | gzip > "$backup_path.tmp"; then
        mv "$backup_path.tmp" "$backup_path"
        local file_size=$(du -h "$backup_path" | cut -f1)
        log_info "Backup completed successfully. Size: $file_size"
    else
        log_error "Backup failed."
        rm -f "$backup_path.tmp"
        return 1
    fi
}

remove_expired_backups() {
    local threshold_date=$(date -d "$RETENTION_DAYS days ago" '+%Y%m%d' 2>/dev/null || date -v-"${RETENTION_DAYS}d" '+%Y%m%d' 2>/dev/null || echo "$(($(date '+%Y%m%d') - RETENTION_DAYS))" 2>/dev/null)
    
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    for backup in "${BACKUP_DIR}"/*.sql.gz; do
        if [ -f "$backup" ]; then
            local filename=$(basename "$backup")
            local backup_date=$(echo "$filename" | grep -oE '[0-9]{8}' | head -1)
            
            if [ -n "$backup_date" ] && [ "$backup_date" -lt "$threshold_date" ]; then
                log_info "Removing old backup: $filename"
                rm -f "$backup"
                deleted_count=$((deleted_count + 1))
            fi
        fi
    done
    
    log_info "Cleanup completed. Removed $deleted_count old backup(s)."
}

test_gzip_integrity() {
    local backup_file="$1"
    local backup_path="${BACKUP_DIR}/${backup_file}"
    
    log_info "Verifying backup integrity..."
    
    if gzip -t "$backup_path" 2>/dev/null; then
        log_info "Backup integrity verified (gzip test passed)."
        return 0
    else
        log_error "Backup integrity check failed (gzip test failed)."
        rm -f "$backup_path"
        return 1
    fi
}

display_recent_backups() {
    log_info "Recent backups:"
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%TY-%Tm-%Td %TH:%TM  %s bytes  %p\n' 2>/dev/null | sort -r | head -10 || \
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -exec stat -c '%y %s bytes %n' {} \; 2>/dev/null | sort -r | head -10
}

main() {
    log_info "Starting backup process..."
    
    required_configuration_provided
    
    local backup_file=$(generate_timestamped_filename)
    
    if ! wait_for_database_connection; then
        log_error "Cannot connect to database. Exiting."
        exit 1
    fi
    
    if create_compressed_dump "$backup_file"; then
        if test_gzip_integrity "$backup_file"; then
            log_info "Backup verification passed."
        else
            log_error "Backup verification failed."
            exit 1
        fi
    else
        log_error "Backup creation failed."
        exit 1
    fi
    
    remove_expired_backups
    display_recent_backups
    
    log_info "Backup process completed successfully."
}

# Handle script termination
trap 'log_error "Backup process interrupted."; exit 1' INT TERM

main "$@"