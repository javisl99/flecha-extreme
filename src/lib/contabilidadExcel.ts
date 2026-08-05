import { MovimientoContable } from '@/shared/types';
import {
  accountLabel,
  accountingTypeLabel,
  paymentMethodLabel,
} from './contabilidad';

export interface ExportContabilidadFilters {
  fechaInicio?: string;
  fechaFin?: string;
  tipo?: string;
  cuenta?: string;
  origen?: string;
  busqueda?: string;
}

const getOrigenLabel = (movimiento: MovimientoContable) => {
  if (movimiento.es_devolucion) return 'Devolución';
  if (movimiento.tipo === 'traspaso_entrada' || movimiento.tipo === 'traspaso_salida') {
    return 'Traspaso';
  }
  if (movimiento.id_pago) return 'Pago sync';
  return 'Manual';
};

const EURO_COLUMNS = new Set([
  'Importe total',
  'Base imponible',
  'Total impuesto',
]);

const formatEuroValue = (value: unknown) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const getDisplayValue = (key: string, value: unknown) => {
  if (EURO_COLUMNS.has(key)) return formatEuroValue(value);
  if (typeof value === 'number') return String(value);
  if (value === null || value === undefined) return '';
  return String(value);
};

const autoSizeColumns = (rows: Array<Record<string, unknown>>) => {
  const headers = Object.keys(rows[0] || {});

  return headers.map((header) => {
    const maxLength = rows.reduce((currentMax, row) => {
      const displayValue = getDisplayValue(header, row[header]);
      return Math.max(currentMax, displayValue.length);
    }, header.length);

    return {
      wch: Math.min(Math.max(maxLength + 2, header.length + 2), 48),
    };
  });
};

export async function exportContabilidadMovimientosToXlsx({
  movimientos,
  filters,
  fileName = 'movimientos-contables.xlsx',
}: {
  movimientos: MovimientoContable[];
  filters: ExportContabilidadFilters;
  fileName?: string;
}) {
  const XLSX = await import('xlsx-js-style');

  const headerStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: '4B5563' } },
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'D1D5DB' } },
      bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
      left: { style: 'thin', color: { rgb: 'D1D5DB' } },
      right: { style: 'thin', color: { rgb: 'D1D5DB' } },
    },
  } as const;

  const evenRowStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  } as const;

  const oddRowStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  } as const;

  const styleSheet = (sheet: Record<string, unknown>, rows: Array<Record<string, unknown>>) => {
    const ref = sheet['!ref'];
    if (typeof ref !== 'string') return;

    const range = XLSX.utils.decode_range(ref);
    const headers = Object.keys(rows[0] || {});

    for (let row = range.s.r; row <= range.e.r; row += 1) {
      for (let col = range.s.c; col <= range.e.c; col += 1) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        if (!cell || typeof cell !== 'object') continue;

        const cellStyle = cell as { s?: unknown };

        if (row === range.s.r) {
          cellStyle.s = headerStyle;
          continue;
        }

        const rowStyle = row % 2 === 0 ? evenRowStyle : oddRowStyle;
        cellStyle.s = rowStyle;

        const header = headers[col];
        if (header && EURO_COLUMNS.has(header)) {
          cellStyle.s = {
            ...rowStyle,
            alignment: { horizontal: 'right', vertical: 'center' },
            numFmt: '€ #,##0.00',
          };
        }
      }
    }

    const rowStyles = (sheet['!rows'] as Array<{ hpt?: number } | undefined> | undefined) || [];
    rowStyles[range.s.r] = { hpt: 22 };
    sheet['!rows'] = rowStyles;
    sheet['!cols'] = autoSizeColumns(rows);
  };

  const filtrosRows = [
    { Filtro: 'Fecha inicio', Valor: filters.fechaInicio || '-' },
    { Filtro: 'Fecha fin', Valor: filters.fechaFin || '-' },
    {
      Filtro: 'Tipo',
      Valor: filters.tipo ? accountingTypeLabel(filters.tipo as MovimientoContable['tipo']) : 'Todos',
    },
    { Filtro: 'Cuenta', Valor: filters.cuenta || 'Todas' },
    { Filtro: 'Origen', Valor: filters.origen || 'Todos' },
    { Filtro: 'Búsqueda', Valor: filters.busqueda || '-' },
  ];

  const movimientosRows = movimientos.map((movimiento) => ({
    Fecha: movimiento.fecha_operacion,
    Tipo: accountingTypeLabel(movimiento.tipo),
    Estado: movimiento.estado,
    Cuenta: accountLabel(movimiento.cuenta, movimiento.caja),
    Banco: movimiento.cuenta?.banco?.nombre || '-',
    Método: paymentMethodLabel(
      movimiento.metodo_pago,
      movimiento.metodo_pago?.codigo || movimiento.metodo || null
    ),
    Concepto: movimiento.concepto,
    Comentario: movimiento.comentario || '',
    Origen: getOrigenLabel(movimiento),
    'Importe total': Number(movimiento.importe_total || 0),
    'Base imponible': Number(movimiento.base_imponible || 0),
    'IVA %': Number(movimiento.iva_pct || 0),
    'Total impuesto': Number(movimiento.iva_importe || 0),
    Proveedor: movimiento.gasto?.proveedor || '',
    'Nº factura': movimiento.gasto?.num_factura || '',
    'Fecha factura': movimiento.gasto?.fecha_factura || '',
    'Tipo gasto': movimiento.gasto?.tipo_gasto || '',
    Deducible: movimiento.gasto ? (movimiento.gasto.deducible ? 'Sí' : 'No') : '',
    Empleado: movimiento.empleado
      ? `${movimiento.empleado.nombre} ${movimiento.empleado.apellidos}`
      : '',
  }));

  const workbook = XLSX.utils.book_new();
  const filtrosSheet = XLSX.utils.json_to_sheet(filtrosRows);
  const movimientosSheet = XLSX.utils.json_to_sheet(movimientosRows);

  styleSheet(filtrosSheet, filtrosRows);
  styleSheet(movimientosSheet, movimientosRows);

  XLSX.utils.book_append_sheet(workbook, filtrosSheet, 'Filtros');
  XLSX.utils.book_append_sheet(workbook, movimientosSheet, 'Movimientos');

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
