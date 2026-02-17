# Backup and Restore Procedure for Nedcloud Solutions

## Overview
This document outlines the procedure for restoring a PostgreSQL database from a backup file using the provided restore script. This process is essential for disaster recovery and database migration.

---

## Prerequisites
- PostgreSQL database server running
- Backup files stored in `/backups` directory
- Appropriate permissions to execute PostgreSQL commands
- Environment variables configured for database connection
- Docker environment setup for development/testing (if applicable)
- `pg_dump` and `pg_restore` extensions available in the PostgreSQL environment

---

## Environment Variables
The restore script uses the following environment variables for database configuration:

| Variable | Description | Default Value |
|----------|-------------|--------------|
| `DB_HOST` | Database host | `postgres` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database username | `nedcloud` |
| `DB_PASSWORD` | Database password | `nedcloud_dev` |

**Note:**
For Docker environments, ensure these variables are set correctly within the container.

---

## Step-by-Step Restoration Process

### 1. Locate Backup Files
Ensure backup files are stored in `/backups` directory. They are named as:
```
nedcloud_YYYYMMDD_HHMMSS.sql.gz
```

### 2. Set Environment Variables
Set the necessary environment variables before running the restore script:
```bash
export DB_HOST=your_database_host
export DB_PORT=your_database_port
export DB_USER=your_database_user
export DB_PASSWORD=your_database_password
```

### 3. Run the Restore Script
Execute the restore script with the backup file as an argument:

```bash
./scripts/restore.sh /backups/backup_file.sql.gz
```

### 3.1 Example for Docker
If using Docker, ensure the environment variables are passed to the container:
```bash
docker exec -e DB_HOST=nedcloud-db -e DB_PASSWORD=your_password container_name ./scripts/restore.sh /backups/backup_file.sql.gz
```

### 4. Script Execution Flow
The script performs the following steps:

1. **Argument Validation:**
   - Checks if exactly one backup file is provided.
   - Verifies the backup file exists.

2. **Database Name Extraction:**
   - Extracts the database name from the backup filename.

3. **Backup Integrity Check:**
   - Validates the integrity of the backup file using `gzip -t`.

4. **Existing Database Check:**
   - Checks if a database with the same name already exists.
   - If it exists, attempts to drop it.

5. **Database Creation:**
   - Creates a new database with the extracted name.

6. **Database Restore:**
   - Uses `pg_restore` to restore the database schema and data from the backup file.

7. **Completion Message:**
   - Logs success message upon completion.

---

## Recovery Time Objective (RTO)
The estimated recovery time objective (RTO) for restoring a database from backup using this procedure is:

| Scenario | Estimated RTO |
|----------|---------------|
| Small database (< 1GB) | 2-5 minutes |
| Medium database (1-5GB) | 5-15 minutes |
| Large database (> 5GB) | 15-30 minutes |

**Note:**
- RTO may vary based on server performance, network conditions, and the environment (e.g., Docker vs. local).
- Backup file size directly impacts restore time.

---

## Testing the Restoration Process
To ensure the restoration process works correctly, follow these steps:

### 1. Create a Test Backup
Run the backup script to create a test backup:
```bash
./scripts/backup.sh
```

### 2. Restore to a Staging Environment
Execute the restore script on a staging environment with environment variables:
```bash
export DB_HOST=staging_host
export DB_PORT=5432
export DB_USER=staging_user
export DB_PASSWORD=staging_password
./scripts/restore.sh /backups/backup_file.sql.gz
```

### 3. Verify Database Integrity
After restoration, verify the database integrity by:
- Connecting to the restored database:
  ```bash
docker exec -it container_name psql -U your_user -d your_database -c "\dt;"
```
- Running queries to check data consistency.
- Comparing table schemas and data records with the original database.

---

## Troubleshooting

### Error: Backup File Not Found
Ensure the backup file is in the correct directory and the script has read permissions.

### Error: Database Already Exists
The script attempts to drop the existing database. If this fails:
- Manually drop the database before running the script again:
  ```bash
dropdb -h DB_HOST -p DB_PORT -U DB_USER your_database_name
```

### Error: Database Creation Failed
Check if the database user has sufficient permissions to create databases.
Ensure PostgreSQL is running and accessible.

### Error: Restore Failed
- Ensure the backup file is not corrupted.
- Verify the database user and host settings are correct.
- Check PostgreSQL logs for additional error details.
- Ensure `pg_restore` extension is available in your PostgreSQL environment.

### Docker-Specific Issues
- **Environment Variables:** Ensure environment variables are set correctly within Docker containers.
- **Permissions:** Ensure the user inside the container has the necessary permissions to execute PostgreSQL commands.

---

## Best Practices
- **Regular Backups:** Schedule regular backups to ensure data is not lost.
- **Retention Policy:** Follow the retention policy of 7 days for backups.
- **Environment Consistency:** Ensure the restore environment closely matches the production environment.
- **Documentation:** Keep this documentation updated with any changes to the restore process and environment specifics.

---

## Docker-Specific Setup
To set up the restore process in a Docker environment:
1. Ensure PostgreSQL image includes `pg_dump` and `pg_restore` capabilities.
2. Set environment variables correctly:
   ```bash
export DB_HOST=your_postgres_container
```
3. Run the restore script inside the container:
   ```bash
docker exec -e DB_HOST=your_postgres_container -e DB_PASSWORD=your_password your_container_name ./scripts/restore.sh /backups/backup_file.sql.gz
```

---

## Contact
For further assistance, contact the Nedcloud Solutions team at: support@nedcloudsolutions.nl