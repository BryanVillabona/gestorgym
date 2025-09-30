export function createSeguimiento(data) {
  const { contratoId, peso_kg, grasa_corporal_porcentaje, medidas, fotos_urls_str, comentarios } = data;

  if (!contratoId || !peso_kg) {
    throw new Error('El ID del contrato y el peso son campos requeridos.');
  }

  // Procesar las URLs de las fotos: convertir el string en un array limpio.
  const fotos_urls = fotos_urls_str 
    ? fotos_urls_str.split(',').map(url => url.trim()).filter(url => url) 
    : [];

  // Procesar las medidas: crear un objeto solo con las que se proporcionaron.
  const medidasFinales = {};
  if (medidas.pecho) medidasFinales.pecho = parseFloat(medidas.pecho);
  if (medidas.brazo) medidasFinales.brazo = parseFloat(medidas.brazo);
  if (medidas.cintura) medidasFinales.cintura = parseFloat(medidas.cintura);
  if (medidas.pierna) medidasFinales.pierna = parseFloat(medidas.pierna);
  
  return {
    contratoId,
    fecha: new Date(),
    peso_kg: parseFloat(peso_kg),
    grasa_corporal_porcentaje: grasa_corporal_porcentaje ? parseFloat(grasa_corporal_porcentaje) : undefined,
    medidas: medidasFinales,
    fotos_urls: fotos_urls,
    comentarios: comentarios || '',
    estado: 'valido'
  };
}