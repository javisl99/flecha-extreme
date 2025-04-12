import { Documento } from '@/shared/types';

export const documentosMock: Documento[] = [
  {
    id: 'd1',
    nombre: 'Factura_001_2024.pdf',
    clienteId: 'c1',
    tipo: 'factura',
    fechaCreacion: '2024-04-20',
    url: '/documentos/facturas/factura_001_2024.pdf'
  },
  {
    id: 'd2',
    nombre: 'Contrato_Clase_Kitesurf.pdf',
    clienteId: 'c1',
    reservaId: 'r1',
    tipo: 'contrato',
    fechaCreacion: '2024-04-20',
    url: '/documentos/contratos/contrato_clase_kitesurf_001.pdf'
  },
  {
    id: 'd3',
    nombre: 'Recibo_Pago_001.pdf',
    clienteId: 'c1',
    tipo: 'recibo',
    fechaCreacion: '2024-04-20',
    url: '/documentos/recibos/recibo_pago_001.pdf'
  },
  {
    id: 'd4',
    nombre: 'Factura_002_2024.pdf',
    clienteId: 'c3',
    tipo: 'factura',
    fechaCreacion: '2024-04-25',
    url: '/documentos/facturas/factura_002_2024.pdf'
  },
  {
    id: 'd5',
    nombre: 'Contrato_Tour_Paddleboard.pdf',
    clienteId: 'c3',
    reservaId: 'r3',
    tipo: 'contrato',
    fechaCreacion: '2024-04-25',
    url: '/documentos/contratos/contrato_tour_paddleboard_001.pdf'
  },
  {
    id: 'd6',
    nombre: 'Recibo_Pago_002.pdf',
    clienteId: 'c3',
    tipo: 'recibo',
    fechaCreacion: '2024-04-25',
    url: '/documentos/recibos/recibo_pago_002.pdf'
  },
  {
    id: 'd7',
    nombre: 'Factura_003_2024.pdf',
    clienteId: 'c8',
    tipo: 'factura',
    fechaCreacion: '2024-05-01',
    url: '/documentos/facturas/factura_003_2024.pdf'
  },
  {
    id: 'd8',
    nombre: 'Contrato_Clase_Privada.pdf',
    clienteId: 'c8',
    reservaId: 'r8',
    tipo: 'contrato',
    fechaCreacion: '2024-05-01',
    url: '/documentos/contratos/contrato_clase_privada_001.pdf'
  },
  {
    id: 'd9',
    nombre: 'Manual_Instrucciones_Kite.pdf',
    tipo: 'otro',
    fechaCreacion: '2024-01-15',
    url: '/documentos/manuales/manual_instrucciones_kite.pdf'
  },
  {
    id: 'd10',
    nombre: 'Protocolo_Seguridad.pdf',
    tipo: 'otro',
    fechaCreacion: '2024-01-10',
    url: '/documentos/protocolos/protocolo_seguridad.pdf'
  }
]; 