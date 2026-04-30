# SOFITUL - Reglas de Desarrollo para Claude Code

## Proyecto

- **Backend**: NestJS, puerto 3002, PM2 proceso `sofitul-backend`
- **Frontend**: React + Vite, puerto 5174 (dev) / Nginx (prod)
- **Base de datos**: PostgreSQL en Docker, puerto 5433, base `sofitul_onetrade`, user `sofitul_admin`
- **Dominio prod**: `sofitul.onetradesa.pro`
- **Código local**: `C:\Users\rulli\proyectos\sofitul\`
- **Código en servidor**: `/opt/sofitul/`

---

## Principios generales

- Mantener el estilo actual del proyecto.
- Hacer cambios pequeños, claros y verificables.
- No borrar ni revertir cambios locales del usuario sin permiso.
- No hardcodear secretos, passwords, tokens, claves SMTP, JWT_SECRET ni credenciales de base de datos.
- No subir ni modificar artefactos ZIP, dist, logs o carpetas temporales salvo que se indique explícitamente.
- Antes de cambios grandes, revisar la estructura existente y seguir los patrones actuales del repo.
- Si hay cambios locales no relacionados, no revertirlos ni pisarlos.

---

## Deploy

El proceso de deploy es siempre desde local hacia el servidor vía SSH.

**SSH key**: `C:\Users\rulli\.ssh\gestides_key`
**Servidor**: `root@sofitul.onetradesa.pro`

### Pasos completos

```powershell
# 1. Build backend
cd C:\Users\rulli\proyectos\sofitul\backend
npm run build

# 2. Build frontend
cd C:\Users\rulli\proyectos\sofitul\frontend
npm run build

# 3. Empaquetar
Compress-Archive -Path .\backend\dist\* -DestinationPath .\backend-dist.zip -Force
Compress-Archive -Path .\frontend\dist\* -DestinationPath .\frontend-dist.zip -Force

# 4. Subir
scp -i C:\Users\rulli\.ssh\gestides_key backend-dist.zip frontend-dist.zip root@sofitul.onetradesa.pro:/tmp/

# 5. Desplegar en servidor (vía SSH)
# Backend:
unzip -o /tmp/backend-dist.zip -d /tmp/backend-new
rm -rf /opt/sofitul/backend/dist
cp -r /tmp/backend-new /opt/sofitul/backend/dist
rm -rf /tmp/backend-new /tmp/backend-dist.zip

# Frontend:
unzip -o /tmp/frontend-dist.zip -d /tmp/frontend-new
rm -rf /opt/sofitul/frontend/dist
cp -r /tmp/frontend-new /opt/sofitul/frontend/dist
rm -rf /tmp/frontend-new /tmp/frontend-dist.zip

# 6. Reiniciar
pm2 restart sofitul-backend
pm2 show sofitul-backend   # verificar status: online
```

### Reglas de deploy

- Nunca editar archivos directamente en producción. **Local es la fuente de verdad.**
- Nada llega a producción sin haber compilado sin errores localmente.
- Verificar `pm2 show sofitul-backend | grep status` después de cada deploy.
- Los warnings de build (chunk size, dynamic import) son aceptables; los errores de TypeScript no.

---

## Base de datos

### synchronize según entorno

`app.module.ts` usa:
```ts
synchronize: process.env.NODE_ENV !== 'production',
```

- **Development** (`NODE_ENV` no seteado o `development`): synchronize activo — agregar entidades y reiniciar PM2 crea tablas/columnas automáticamente.
- **Production** (`NODE_ENV=production`): synchronize desactivado — los cambios de esquema requieren migraciones controladas.

**No hacer cambios destructivos de esquema** (renombrar o eliminar columnas) sin respaldo previo.

### Convenciones de entidades

- Nombres de tabla: `snake_case` (decorator `@Entity('nombre_tabla')`)
- Nombres de columna: `snake_case` (decorator `@Column({ name: 'nombre_columna' })`)
- Propiedades TypeScript: `camelCase`
- Siempre definir `@PrimaryGeneratedColumn('uuid')` o `'increment'` explícitamente
- Usar `@CreateDateColumn` y `@UpdateDateColumn` con `type: 'timestamptz'`

---

## Reglas de negocio SOFITUL

Estas reglas son específicas del dominio. Nunca violarlas.

### Estados de operación

```ts
// ✅ SIEMPRE así
import { ESTADO_OP, ESTADO_CUOTA } from '../common/constants/estado-operacion.constants';
await this.cambiarEstado(id, ESTADO_OP.COBRADO, nota);

// ❌ NUNCA así
await this.repo.update(id, { estado: 'COBRADO' });
```

- Usar `cambiarEstado()` siempre para cambiar el estado de una operación.
- Nunca `repo.update({ estado: '...' })` directo — bypasea la bitácora y la matriz de transiciones.
- Nunca strings hardcodeados de estado. Siempre `ESTADO_OP.*` o `ESTADO_CUOTA.*`.

### Panel Global — consumo de tablas

Donde el formulario tenga:
- Campo `país` → consumir tabla `paises` (solo activos)
- Campo `moneda` → tabla `monedas` (solo activas)
- Campo `banco/caja` → tabla `cajas` o `bancos` (solo activos)
- Campo `departamento/ciudad` → tablas `departamentos` / `ciudades` (geo, encadenados)

**Nunca valores hardcodeados en el frontend. Siempre desde las tablas del Panel Global.**

Los selects de departamento/ciudad almacenan el **texto** (`nombre`), no el ID. Esto es intencional para compatibilidad con datos históricos.

### Feriados y días hábiles

Al crear una operación de tipo `DESCUENTO_CHEQUE`:
- Cada cheque debe pasar por `FeriadosService.ajustarFecha(fechaVencimiento)`.
- Si la fecha cae en fin de semana o feriado, se corre al próximo día hábil.
- Los días extra se suman al cálculo de interés del cheque.
- Los totales de la operación se recalculan automáticamente.

Para cualquier cálculo de días hábiles en el sistema, usar `FeriadosService` (no calcular manualmente).

### Matriz de transiciones

- El sistema valida transiciones de estado via `EstadoTransicion` (tabla `estado_transiciones`).
- Si no hay transiciones definidas para un estado → modo libre (permite cualquier cambio).
- La matriz se configura desde Panel Global → Estados de Operación.

### Frontend — estado de operaciones

```ts
// ✅ SIEMPRE importar desde utils
import { ESTADOS_VIGENTES, ESTADOS_TERMINALES } from '../../utils/estados';

// ❌ NUNCA redefinir el array localmente en un componente
const ESTADOS_VIGENTES = ['EN_ANALISIS', 'APROBADO', ...];
```

---

## Seguridad

### Variables de entorno

- Los archivos `.env` reales no deben versionarse.
- Usar `.env.example` sin valores sensibles.
- Toda credencial debe venir desde variables de entorno o secret manager.
- Nunca escribir secretos reales en `deploy.sh`, código fuente, Dockerfile, docker-compose o frontend.
- Si se encuentra un secreto ya versionado, avisar y recomendar rotarlo.
- No imprimir secretos en logs.
- No usar valores fallback inseguros para secretos críticos como `JWT_SECRET` en producción.

### Backend como autoridad

- El frontend puede ocultar pantallas, pero no define seguridad.
- Toda regla de permisos debe aplicarse en backend.
- Todo endpoint sensible debe usar `JwtAuthGuard` y además `RolesGuard` o `PermissionsGuard`.
- No confiar en `localStorage` para autorizar acciones críticas.
- Validar siempre el usuario autenticado desde el token JWT en backend.
- No aceptar `usuarioId`, `rolId` u otros campos sensibles desde el cliente cuando deben salir del JWT o de reglas internas.

### Endpoints sensibles

Proteger especialmente:

- usuarios
- roles
- configuracion
- tesoreria
- dashboards/paneles administrativos
- clientes-vetados
- bancos
- cuentas-transferencia
- productos-financieros
- tipos-documento
- feriados
- operaciones críticas
- documentos de contacto
- reportes, informes o exportaciones

---

## DTOs y validación

- No usar `@Body() body: any` en endpoints nuevos.
- Reemplazar gradualmente los `body: any` existentes por DTOs.
- Crear DTOs con `class-validator` y `class-transformer`.
- Usar DTOs separados para crear y actualizar cuando las reglas sean distintas.
- Los DTOs deben definir explícitamente qué campos acepta el backend.
- No permitir asignación masiva de campos internos o sensibles.
- Validar parámetros de ruta y query params cuando correspondan.
- Usar tipos concretos en servicios y controllers siempre que sea razonable.

Usar `ValidationPipe` global en `main.ts`:

```ts
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### Ejemplo de DTO

```ts
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateRolDto {
  @IsString()
  codigo: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsObject()
  permisos?: Record<string, unknown>;
}
```

Para updates usar `PartialType`:

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateRolDto } from './create-rol.dto';

export class UpdateRolDto extends PartialType(CreateRolDto) {}
```

### Campos que no deben aceptarse desde requests comunes

No permitir que el cliente envíe libremente:

- `passwordHash`, `tokenInvitacion`, `tokenInvitacionExpira`
- `activadoAt`, `emailVerificado`, `esSistema`
- `createdAt`, `updatedAt`, campos de auditoría
- Permisos críticos sin autorización especial
- IDs de usuario autenticado cuando deben salir del JWT
- Importes, estados o flags críticos si la transición debe calcularse en backend

---

## Roles y permisos

- Usar `JwtAuthGuard` para autenticación.
- Usar `RolesGuard` o `PermissionsGuard` para autorización.
- No alcanza con que el usuario esté logueado.
- Verificar también si puede hacer la acción solicitada.
- Aplicar autorización en backend aunque el frontend ya oculte la pantalla o botón.

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN')
@Post('roles')
createRol(@Body() body: CreateRolDto) {
  return this.usersService.createRol(body);
}
```

Roles del sistema:

- `SUPERADMIN`: administra usuarios, roles, configuración crítica y permisos.
- `ADMIN`: administra operación normal del sistema.
- `USUARIO`: accede solo a módulos permitidos.

Permisos granulares sugeridos: `usuarios:ver`, `usuarios:crear`, `tesoreria:ver`, `tesoreria:operar`, `configuracion:administrar`, etc.

---

## Frontend

- El token puede usarse para UX, pero no debe ser la única barrera de seguridad.
- Los permisos en `localStorage` son solo para mostrar/ocultar vistas.
- Cualquier acción crítica debe ser validada nuevamente por backend.
- No guardar secretos reales en variables `VITE_`. Todo `VITE_*` queda visible en el navegador.
- **Mantener todas las llamadas API centralizadas** en `contactosApi.ts` y `operacionesApi.ts`. No hacer `fetch`/`axios` directo en componentes.
- Manejar errores 401/403 de forma clara para el usuario.
- No redefinir constantes que ya existen en `utils/` (estados, formatters, etc.).

### StatusBadge — colores dinámicos

`StatusBadge` consume `EstadosContext` (carga `estados_operacion` una sola vez al montar la app).

- Si el estado tiene `color` configurado en DB → inline style con ese hex
- Si no → fallback al mapa Tailwind hardcodeado en `COLORS`
- El texto mostrado: `label prop` > `nombre del DB` > `codigo.replace(/_/g, ' ')`

Cuando se cree un estado nuevo en Panel Global → asignarle un color hex. No requiere tocar código.

### Agregar una página al Panel Global

1. Crear `frontend/src/pages/panel/MiPagina.tsx` siguiendo el patrón de `Bancos.tsx`
2. Agregar el ítem en `Layout.tsx` dentro del módulo `panel` en `MODULES`
3. Agregar la ruta en `App.tsx` como `<Route path="/panel/mi-pagina" element={<MiPagina />} />`
4. Agregar las llamadas API en `panelGlobalApi` dentro de `contactosApi.ts`

---

## Manejo de errores

- No dejar bloques `catch` vacíos. Mínimo: `console.error` o `alert(err.response?.data?.message)`.
- En el backend, usar `NotFoundException`, `BadRequestException`, etc. de `@nestjs/common`. No `throw new Error('...')` genérico.
- Los errores de validación de transición de estado deben usar `BadRequestException` con mensaje descriptivo.

```ts
// ✅
} catch (err: any) {
  alert(err.response?.data?.message ?? 'Error al guardar.');
}

// ❌
} catch (_) {}
```

---

## Uploads

- Validar extensión y MIME type.
- Mantener límite de tamaño.
- Usar nombres no adivinables.
- No confiar solamente en `file.originalname`.
- Si el archivo es sensible, no exponerlo públicamente sin autorización backend.
- Evitar que documentos privados queden accesibles sin token.

---

## Git y archivos que no deben subirse

No subir:

- `.env`, `.env.production`, `.env.local`
- `dist/`, `build/`, `node_modules/`
- Logs, ZIPs de deploy, backups de base de datos
- Archivos temporales, claves privadas
- PDFs/documentos sensibles, dumps SQL con datos reales

Mantener ejemplos seguros: `.env.example`, `backend/.env.example`, `frontend/.env.example`

Si un archivo sensible ya está trackeado:

```bash
git rm --cached ruta/del/archivo
# luego rotar cualquier secreto expuesto
```

---

## Verificación post-cambio

Después de cambios importantes:

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

- Revisar que no se agregaron secretos al Git (`git status`, `git diff`).
- Verificar que el backend arrancó sin errores (`pm2 logs sofitul-backend --lines 20`).
- Reportar: archivos modificados, riesgos resueltos, pendientes.

Si hay tests disponibles, ejecutarlos. Si no, explicar por qué.

---

## Forma de trabajo

- Primero leer el código existente.
- Después proponer o aplicar cambios pequeños.
- No hacer refactors grandes sin necesidad.
- No cambiar nombres de rutas o contratos de API sin revisar frontend/backend juntos.
- No borrar cambios locales del usuario.
- Si hay dudas sobre una regla de negocio, preguntar antes de asumir.
- Al finalizar, entregar un resumen breve con cambios, verificación y pendientes.
