export function createPlanEntrenamiento({ nombre, duracion_dias, metas, nivel, precio_sugerido }) {
  if (!nombre || !duracion_dias || !metas || !nivel || precio_sugerido === undefined) {
    throw new Error('Todos los campos son requeridos para crear el objeto Plan.');
  }

  return {
    nombre: nombre.trim(),
    duracion_dias: parseInt(duracion_dias, 10),
    metas: metas.trim(),
    nivel,
    precio_sugerido: parseFloat(precio_sugerido)
  };
}

export function updatePlanEntrenamiento(planExistente, nuevosDatos) {
  if (!planExistente || !nuevosDatos) {
    throw new Error('Se requieren tanto el plan existente como los nuevos datos.');
  }

  const duracionFinal = nuevosDatos.duracion_dias && !isNaN(parseInt(nuevosDatos.duracion_dias, 10))
    ? parseInt(nuevosDatos.duracion_dias, 10)
    : planExistente.duracion_dias;

  const precioFinal = nuevosDatos.precio_sugerido && !isNaN(parseFloat(nuevosDatos.precio_sugerido))
    ? parseFloat(nuevosDatos.precio_sugerido)
    : planExistente.precio_sugerido;

  // Combinamos los datos, dando prioridad a los nuevos si existen y usando los valores finales seguros.
  return {
    ...planExistente,
    nombre: nuevosDatos.nombre || planExistente.nombre,
    duracion_dias: duracionFinal,
    metas: nuevosDatos.metas || planExistente.metas,
    nivel: nuevosDatos.nivel || planExistente.nivel,
    precio_sugerido: precioFinal,
  };
}