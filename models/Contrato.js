import dayjs from 'dayjs';

// Factory function para crear un objeto Contrato (DTO).
export function createContrato({ clienteId, planId, precio, duracion_dias, renuevaContratoId = null }) { 
  if (!clienteId || !planId || precio === undefined || !duracion_dias) {
    throw new Error('Cliente, Plan, Precio y Duración son requeridos.');
  }

  return {
    clienteId,
    planId,
    fechaInicio: new Date(),
    fechaFin: dayjs().add(duracion_dias, 'day').toDate(),
    precio: parseFloat(precio),
    estado: 'activo',
    renuevaContratoId: renuevaContratoId
  };
}