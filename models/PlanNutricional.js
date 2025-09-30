export function createPlanNutricional({ contratoId, nombre, descripcion, comidas = [] }) {
  if (!contratoId || !nombre) {
    throw new Error('El ID del contrato y el nombre del plan son requeridos.');
  }

  return {
    contratoId,
    nombre: nombre.trim(),
    descripcion: descripcion ? descripcion.trim() : '',
    comidas: comidas,
    fechaRegistro: new Date() // <-- AÑADIDO: Se añade la fecha de creación automáticamente.
  };
}