#!/bin/bash
docker exec postgres psql -U sofitul_admin -d sofitul_onetrade -c "SELECT id, ruc, razon_social FROM contactos_pj ORDER BY created_at"