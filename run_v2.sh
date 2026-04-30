#!/bin/bash
sed -i 's/^\xEF\xBB\xBF//' /tmp/migration_v2.sql
docker exec -i postgres psql -U sofitul_admin -d sofitul_onetrade < /tmp/migration_v2.sql