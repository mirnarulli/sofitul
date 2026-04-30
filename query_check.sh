#!/bin/bash
docker exec postgres psql -U sofitul_admin -d sofitul_onetrade -c "SELECT codigo, nombre FROM estados_operacion ORDER BY orden" 
docker exec postgres psql -U sofitul_admin -d sofitul_onetrade -c "SELECT id, nombre FROM productos_financieros WHERE activo = true ORDER BY nombre"
docker exec postgres psql -U sofitul_admin -d sofitul_onetrade -c "SELECT id, nombre FROM cajas WHERE activo = true ORDER BY nombre"