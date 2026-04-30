#!/bin/bash
docker exec postgres psql -U sofitul_admin -d sofitul_onetrade -c "SELECT id, numero_doc, primer_nombre, primer_apellido FROM contactos_pf ORDER BY numero_doc"