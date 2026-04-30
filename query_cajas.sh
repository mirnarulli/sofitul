#!/bin/bash
docker exec postgres psql -U sofitul_admin -d sofitul_onetrade -c "SELECT id, nombre FROM cajas WHERE activa = true ORDER BY nombre"