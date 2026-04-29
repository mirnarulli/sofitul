/**
 * DocBarcode — renderiza un código de barras Code128 usando jsbarcode + SVG.
 * Se puede usar en cualquier documento imprimible (Liquidación, Pagaré, etc.)
 */
import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface DocBarcodeProps {
  value:        string;     // texto a codificar, ej: "OP-26-01001"
  width?:       number;     // ancho de barras (px), default 1.5
  height?:      number;     // alto del barcode (px), default 40
  fontSize?:    number;     // tamaño del texto debajo, default 11
  displayValue?: boolean;   // mostrar el texto, default true
  className?:   string;
}

export default function DocBarcode({
  value,
  width = 1.5,
  height = 40,
  fontSize = 10,
  displayValue = true,
  className = '',
}: DocBarcodeProps) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format:       'CODE128',
        width,
        height,
        fontSize,
        displayValue,
        margin:       4,
        background:   '#ffffff',
        lineColor:    '#000000',
        fontOptions:  'bold',
        font:         'Courier, monospace',
      });
    } catch {
      // valor inválido para CODE128 — ignorar
    }
  }, [value, width, height, fontSize, displayValue]);

  if (!value) return null;
  return <svg ref={ref} className={className} />;
}
