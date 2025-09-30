export function createCliente({ nombre, email, telefono }) {
  if (!nombre || !email || !telefono) {
    throw new Error('Nombre, email y teléfono son campos requeridos.');
  }

  return {
    nombre: nombre.trim(),
    email: email.toLowerCase(),
    telefono,
    fechaRegistro: new Date(),
    activo: true, // Todos los clientes nuevos son activos por defecto
  };
}

export function updateCliente(clienteExistente, nuevosDatos) {
  if (!clienteExistente || !nuevosDatos) {
    throw new Error('Se requieren tanto el cliente existente como los nuevos datos.');
  }

  return {
    ...clienteExistente,
    nombre: nuevosDatos.nombre || clienteExistente.nombre,
    email: nuevosDatos.email || clienteExistente.email,
    telefono: nuevosDatos.telefono || clienteExistente.telefono,
    activo: nuevosDatos.activo !== undefined ? nuevosDatos.activo : clienteExistente.activo,
  };
}