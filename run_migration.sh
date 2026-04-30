#!/bin/bash
# Remove BOM if present
sed -i 's/^\xEF\xBB\xBF//' /tmp/migration_onetbank.sql
docker exec -i postgres psql -U sofitul_admin -d sofitul_onetrade < /tmp/migration_onetbank.sql