import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Usuario, Rol, Moneda, Caja, Configuracion, Pais, TipoDocumento, Frase, Canal, ProductoFinanciero, TipoDocumentoAdjunto, InformeRigor, OperacionInformeRigor, Banco, ClienteVetado, Departamento, Ciudad } from './entities';
import { ContactoPF } from './contactos/entities/contacto-pf.entity';
import { ContactoPJ } from './contactos/entities/contacto-pj.entity';
import { Operacion } from './operaciones/entities/operacion.entity';
import { ChequeDetalle } from './operaciones/entities/cheque-detalle.entity';
import { Cuota } from './operaciones/entities/cuota.entity';
import { EstadoOperacion } from './operaciones/entities/estado-operacion.entity';
import { EstadoTransicion } from './operaciones/entities/estado-transicion.entity';

import { BitacoraModule }          from './bitacora/bitacora.module';
import { AuthModule }              from './auth/auth.module';
import { UsersModule }             from './users/users.module';
import { MailModule }              from './mail/mail.module';
import { MonedasModule }           from './monedas/monedas.module';
import { CajasModule }             from './cajas/cajas.module';
import { PaisesModule }            from './paises/paises.module';
import { TiposDocumentoModule }    from './tipos-documento/tipos-documento.module';
import { ConfiguracionModule }     from './configuracion/configuracion.module';
import { FrasesModule }            from './frases/frases.module';
import { CanalesModule }               from './canales/canales.module';
import { ProductosFinancierosModule }  from './productos-financieros/productos-financieros.module';
import { ContactosModule }         from './contactos/contactos.module';
import { OperacionesModule }       from './operaciones/operaciones.module';
import { CobranzasModule }         from './cobranzas/cobranzas.module';
import { TesoreriaModule }         from './tesoreria/tesoreria.module';
import { InventarioCapitalModule } from './inventario-capital/inventario-capital.module';
import { DashboardsModule }        from './dashboards/dashboards.module';
import { DocumentosContactoModule } from './documentos-contacto/documentos-contacto.module';
import { DocumentoContacto }        from './documentos-contacto/documento-contacto.entity';
import { InformesRigorModule }             from './informes-rigor/informes-rigor.module';
import { OperacionInformesRigorModule }    from './operacion-informes-rigor/operacion-informes-rigor.module';
import { BancosModule }                   from './bancos/bancos.module';
import { ClientesVetadosModule }          from './clientes-vetados/clientes-vetados.module';
import { GeoModule }                      from './geo/geo.module';
import { CuentasTransferenciaModule }     from './cuentas-transferencia/cuentas-transferencia.module';
import { CuentaTransferencia }            from './cuentas-transferencia/cuenta-transferencia.entity';
import { FeriadosModule }                 from './feriados/feriados.module';
import { Feriado }                        from './feriados/feriado.entity';
import { ValidataModule }                 from './validata/validata.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type:     'postgres',
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER     ?? (() => { throw new Error('DB_USER no configurado'); })(),
      password: process.env.DB_PASSWORD ?? (() => { throw new Error('DB_PASSWORD no configurado'); })(),
      database: process.env.DB_NAME     ?? (() => { throw new Error('DB_NAME no configurado'); })(),
      entities: [
        Usuario, Rol, Moneda, Caja, Configuracion, Pais, TipoDocumento, Frase, Canal, ProductoFinanciero,
        TipoDocumentoAdjunto, DocumentoContacto, InformeRigor, OperacionInformeRigor,
        Banco, ClienteVetado, Departamento, Ciudad, CuentaTransferencia,
        ContactoPF, ContactoPJ,
        Operacion, ChequeDetalle, Cuota, EstadoOperacion, EstadoTransicion,
        Feriado,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    BitacoraModule,
    AuthModule,
    UsersModule,
    MailModule,
    MonedasModule,
    CajasModule,
    PaisesModule,
    TiposDocumentoModule,
    ConfiguracionModule,
    FrasesModule,
    CanalesModule,
    ProductosFinancierosModule,
    ContactosModule,
    OperacionesModule,
    CobranzasModule,
    TesoreriaModule,
    InventarioCapitalModule,
    DashboardsModule,
    DocumentosContactoModule,
    InformesRigorModule,
    OperacionInformesRigorModule,
    BancosModule,
    ClientesVetadosModule,
    GeoModule,
    CuentasTransferenciaModule,
    FeriadosModule,
    ValidataModule,
  ],
})
export class AppModule {}
