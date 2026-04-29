/**
 * DocHeader — encabezado reutilizable para todos los documentos imprimibles.
 * Muestra logo (si existe en configuración) + datos de la empresa.
 */
import { useLogos } from '../context/LogosContext';

interface DocHeaderProps {
  /** Subtítulo debajo del nombre de la empresa */
  subtitle?: string;
  /** Si se muestra centrado (pagaré) o lado a lado con logo */
  centered?: boolean;
}

export function DocHeader({ subtitle, centered = false }: DocHeaderProps) {
  const { logos } = useLogos();
  const logoUrl   = logos?.logo_barra_menu_claro ?? logos?.logo_iso ?? null;

  if (centered) {
    return (
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        {logoUrl && (
          <img src={logoUrl} alt="Logo" style={{ maxHeight: '48px', maxWidth: '200px', objectFit: 'contain', marginBottom: '6px', display: 'block', margin: '0 auto 6px auto' }} />
        )}
        {!logoUrl && (
          <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '2px', marginBottom: '4px' }}>ONE TRADE S.A.</div>
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
          : <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px' }}>ONE TRADE S.A.</div>
        }
      </div>
      {/* Datos empresa derecha */}
      <div style={{ textAlign: 'right', fontSize: '10px', color: '#555', lineHeight: '1.5' }}>
        <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#111' }}>ONE TRADE S.A.</div>
        <div>RUC: 80085524-8</div>
        <div>Asunción, Paraguay</div>
        {subtitle && <div style={{ marginTop: '2px', color: '#888' }}>{subtitle}</div>}
      </div>
    </div>
  );
}

/**
 * DocFooter — pie de página reutilizable con línea divisoria, datos empresa y fecha de emisión.
 */
interface DocFooterProps {
  nroDoc?: string;
  label?:  string;  // ej: "Liquidación N°", "Pagaré N°"
}

export function DocFooter({ nroDoc, label = 'Documento N°' }: DocFooterProps) {
  return (
    <div style={{ borderTop: '1px solid #ccc', marginTop: '24px', paddingTop: '8px', fontSize: '9px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
      <span>ONE TRADE S.A. · RUC 80085524-8 · Asunción, Paraguay</span>
      <span>{nroDoc ? `${label} ${nroDoc}` : ''}</span>
      <span>Emitido: {new Date().toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
}
