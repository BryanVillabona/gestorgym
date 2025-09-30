export function createTransaccion({ contratoId, clienteId, monto, descripcion }) {
  // La validación ahora solo comprueba los campos que son verdaderamente obligatorios
  // para cualquier tipo de transacción. clienteId y contratoId son opcionales.
  if (monto === undefined || !descripcion) {
    throw new Error('Monto y Descripción son requeridos para crear una transacción.');
  }

  return {
    contratoId: contratoId || null,
    clienteId: clienteId || null,

    // Por defecto es 'ingreso', pero el comando de egreso lo sobrescribirá.
    tipo: 'ingreso',
    monto: parseFloat(monto),
    descripcion,
    fecha: new Date()
  };
}