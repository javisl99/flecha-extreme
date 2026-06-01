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

export async function exportContabilidadMovimientosToXlsx({
  movimientos,
  filters,
  fileName = 'movimientos-contables.xlsx',
}: {
  movimientos: MovimientoContable[];
  filters: ExportContabilidadFilters;
  fileName?: string;
}) {
  const XLSX = await import('xlsx');

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
