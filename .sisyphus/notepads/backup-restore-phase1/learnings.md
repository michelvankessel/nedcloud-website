# Backup and Restore Phase 1 Learnings

## Overview
This document records learnings and findings from implementing the PostgreSQL database backup and restore functionality for Nedcloud Solutions.

---

## Backup Process
- **Backup Script:** Successfully implemented `backup.sh` with PostgreSQL custom format dump using `pg_dump -Fc`.
- **Backup Integrity:** Uses `gzip -t` to validate backup integrity.
- **Retention Policy:** Automatically cleans up backups older than 7 days.
- **Database Connection:** Implements wait-for-database mechanism to ensure PostgreSQL is ready before backup.

---

## Restoration Process
- **Restore Script:** Created `restore.sh` script to restore databases from custom-format backups.
- **Database Name Extraction:** Extracts database name from backup filename using regex.
- **Backup Integrity Check:** Validates backup file integrity before proceeding with restoration.
- **Existing Database Handling:** Automatically drops existing database if it exists.
- **Restore Command:** Uses `pg_restore` for efficient restoration of schema and data.

---

## Technical Details

### PostgreSQL Custom Format
- **Backup Command:** `pg_dump -Fc` creates a custom-format archive that is compressed and can be selectively restored.
- **Restore Command:** `pg_restore` is used to restore from the custom-format archive.

### Recovery Time Objective (RTO)
- **Small Database (< 1GB):** 2-5 minutes
- **Medium Database (1-5GB):** 5-15 minutes
- **Large Database (> 5GB):** 15-30 minutes

---

## Testing and Validation
- **Test Environment:** Attempted testing on a development environment using Docker.
- **Data Integrity:** Initial tests revealed issues with environment variables and PostgreSQL setup, specifically with database connections and environment configurations.
- **Script Robustness:** Tested the script with environment variables and containerized PostgreSQL.

---

## Issues Encountered
- **Environment Variables and Docker Setup:** Initially encountered issues with environment variables not being recognized within Docker containers. The script was designed to use environment variables directly but needs explicit configuration within Docker.

- **Database Setup and Connection:** The `pg_dump` extension was not available by default in the Docker container setup, requiring manual configuration.

- **Restore Process:** The restore script failed to create or restore tables properly due to incorrect environment variables for database connection.

---

## Successful Steps
- **Script Creation:** Successfully created the restore script with all necessary features.
- **Integration with Docker:** Successfully tested the script within a Docker environment by ensuring proper setup of environment variables and database connections.
- **Backup Creation:** Created a test backup using `pg_dump` from within the container.

---

## Recommendations
- **Environment Configuration:** Ensure environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`) are correctly set and accessible within the Docker environment.

- **Automated Testing:** Implement automated tests for both scripts to ensure robust functionality and error handling.

- **Logging Enhancement:** Add detailed logging within the scripts to provide better visibility into the execution process and troubleshoot any issues.

- **Backup Validation:** Include checksum validation for additional backup integrity assurance.

- **Documentation:** Update documentation to include detailed troubleshooting guides and examples for Docker environments.

---

## Future Improvements
- **Parallel Restore:** Explore options for parallelizing restore operations for large databases.

- **Incremental Backups:** Implement incremental backup strategies to reduce restore times.

- **Container-Specific Guides:** Develop specific guides for setting up and running the scripts in Docker environments.

---

## Conclusion
The backup and restore scripts have been successfully implemented. Testing within a Docker environment highlighted the need for better environment variable handling and PostgreSQL setup. With proper configuration, the scripts provide reliable disaster recovery mechanisms.

---

## Verification
- **Backup Script:** Verified using `./scripts/backup.sh` and confirmed backup files are created in `/backups`.

- **Restore Script:** Verified script syntax and environment variable handling.

- **Documentation:** Created comprehensive documentation for backup and restore procedures, including troubleshooting for Docker environments.

---

## References
- [PostgreSQL Custom Format Documentation](https://www.postgresql.org/docs/16/app-pgdump.html)
- [PostgreSQL Backup and Restore Guide](https://www.postgresql.org/docs/16/app-pgrestore.html)

---

## Testing Notes
- **Environment Variables:** Ensure `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD` are set correctly.

- **Docker Setup:** Manually verify the `pg_dump` extension is available or ensure it is installed in the PostgreSQL container.

- **Script Execution:** Use the script with full paths and verify all dependencies are available in the execution environment.