/**
 * DocHeader — encabezado reutilizable para todos los documentos imprimibles.
 * Usa datos de empresa desde configuracion (Panel Global → Empresa).
 */
import { useLogos, useEmpresa } from '../context/LogosContext';

interface DocHeaderProps {
  subtitle?: string;
  centered?: boolean;
}

export function DocHeader({ subtitle, centered = false }: DocHeaderProps) {
  const { logos }  = useLogos();
  const empresa    = useEmpresa();
  const logoUrl    = logos?.logo_barra_menu_claro ?? logos?.logo_iso ?? null;
  const nombre     = empresa.empresa_nombre || 'SOFITUL';
  const ruc        = empresa.empresa_ruc;
  const direccion  = empresa.empresa_direccion;
  const ciudad     = empresa.empresa_ciudad;

  if (centered) {
    return (
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        {logoUrl && (
          <img src={logoUrl} alt="Logo" style={{ maxHeight: '48px', maxWidth: '200px', objectFit: 'contain', marginBottom: '6px', display: 'block', margin: '0 auto 6px auto' }} />
        )}
        {!logoUrl && (
          <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '2px', marginBottom: '4px' }}>{nombre}</div>
        )}
        {subtitle && <p style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{subtitle}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
      {/* Logo izquierda */}
      <div>
        {logoUrl
          ? <img src={logoUrl} alt="Logo" style={{ maxHeight: '52px', maxWidth: '180px', objectFit: 'contain' }} />
          : <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px' }}>{nombre}</div>
        }
      </div>
      {/* Datos empresa derecha */}
      <div style={{ textAlign: 'right', fontSize: '10px', color: '#555', lineHeight: '1.5' }}>
        <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#111' }}>{nombre}</div>
        {ruc       && <div>RUC: {ruc}</div>}
        {direccion && <div>{direccion}</div>}
        {ciudad    && <div>{ciudad}</div>}
        {subtitle && <div style={{ marginTop: '2px', color: '#888' }}>{subtitle}</div>}
      </div>
    </div>
  );
}

/**
 * DocFooter — pie de página reutilizable.
 */
interface DocFooterProps {
  nroDoc?: string;
  label?:  string;
}

export function DocFooter({ nroDoc, label = 'Documento N°' }: DocFooterProps) {
  const empresa  = useEmpresa();
  const nombre   = empresa.empresa_nombre || 'SOFITUL';
  const ruc      = empresa.empresa_ruc;
  const direccion = empresa.empresa_direccion;
  const ciudad   = empresa.empresa_ciudad;

  const datosEmpresa = [nombre, ruc ? `RUC ${ruc}` : null, direccion || ciudad].filter(Boolean).join(' · ');

  return (
    <div style={{ borderTop: '1px solid #ccc', marginTop: '24px', paddingTop: '8px', fontSize: '9px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
      <span>{datosEmpresa}</span>
      <span>{nroDoc ? `${label} ${nroDoc}` : ''}</span>
      <span>Emitido: {new Date().toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
}
