export function createEntrenador({ nombre }) {
  if (!nombre || nombre.trim().length === 0) {
    throw new Error('El nombre es un campo requerido para el entrenador.');
  }

  return {
    nombre: nombre.trim(),
  };
}