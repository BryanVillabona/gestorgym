import { ObjectId } from 'mongodb';

export const clienteSchema = {
  $jsonSchema: {
    bsonType: "object",
    title: "Esquema de Cliente",
    required: ["nombre", "email", "telefono", "fechaRegistro", "activo"],
    properties: {
      nombre: { bsonType: "string", description: "Nombre completo del cliente." },
      email: { bsonType: "string", pattern: "^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$", description: "Correo electrónico único del cliente." },
      telefono: { bsonType: "string", pattern: "^\\d{10}$", description: "Teléfono de contacto (10 dígitos)." },
      fechaRegistro: { bsonType: "date", description: "Fecha de alta del cliente." },
      activo: { bsonType: "bool", description: "Indica si el cliente está activo." }
    }
  }
};

export const planEntrenamientoSchema = {
  $jsonSchema: {
    bsonType: "object",
    title: "Esquema de Plan de Entrenamiento",
    required: ["nombre", "duracion_dias", "metas", "nivel", "precio_sugerido"],
    properties: {
      nombre: { bsonType: "string", description: "Nombre del plan (ej. 'Hipertrofia Total')." },
      duracion_dias: { bsonType: "int", minimum: 1, description: "Duración del plan en días." },
      metas: { bsonType: "string", description: "Objetivos físicos del plan." },
      nivel: { bsonType: "string", enum: ["principiante", "intermedio", "avanzado"], description: "Nivel de dificultad del plan." },
      precio_sugerido: { bsonType: ["double", "int"], minimum: 0, description: "Precio base o recomendado para este plan." }
    }
  }
};

export const contratoSchema = {
  $jsonSchema: {
    bsonType: "object",
    title: "Esquema de Contrato",
    required: ["clienteId", "planId", "fechaInicio", "fechaFin", "precio", "estado"],
    properties: {
      clienteId: { bsonType: "objectId", description: "Referencia al cliente." },
      planId: { bsonType: "objectId", description: "Referencia al plan de entrenamiento." },
      fechaInicio: { bsonType: "date", description: "Fecha de inicio del contrato." },
      fechaFin: { bsonType: "date", description: "Fecha de finalización del contrato." },
      precio: { bsonType: ["double", "int"], minimum: 0, description: "Precio del contrato." },
      estado: { bsonType: "string", enum: ["activo", "cancelado", "finalizado", "renovado"], description: "Estado actual del contrato." },
      renuevaContratoId: { bsonType: ["objectId", "null"], description: "Si este contrato es una renovación, aquí se guarda el ID del contrato anterior." }
    }
  }
};

export const seguimientoFisicoSchema = {
  $jsonSchema: {
    bsonType: "object",
    title: "Esquema de Seguimiento Físico",
    required: ["contratoId", "fecha", "peso_kg", "estado"],
    properties: {
      contratoId: { bsonType: "objectId", description: "Referencia al contrato vigente." },
      fecha: { bsonType: "date", description: "Fecha de la medición." },
      peso_kg: { bsonType: ["double", "int"], minimum: 0, description: "Peso en kilogramos." },
      grasa_corporal_porcentaje: { bsonType: ["double", "int"], minimum: 0, description: "Porcentaje de grasa corporal." },
      medidas: {
        bsonType: "object",
        properties: {
          pecho: { bsonType: ["double", "int"], minimum: 0 },
          brazo: { bsonType: ["double", "int"], minimum: 0 },
          cintura: { bsonType: ["double", "int"], minimum: 0 },
          pierna: { bsonType: ["double", "int"], minimum: 0 },
        }
      },
      fotos_urls: { bsonType: "array", items: { bsonType: "string", pattern: "^https?://.+$", description: "Debe ser una URL válida." } },
      comentarios: { bsonType: "string", description: "Comentarios del entrenador o del cliente." },
      estado: { bsonType: "string", enum: ["valido", "cancelado"], description: "Indica si el registro es válido o ha sido cancelado." }
    }
  }
};

export const planNutricionalSchema = {
  $jsonSchema: {
    bsonType: 'object',
    title: 'Esquema de Plan Nutricional',
    required: ['nombre', 'descripcion','comidas'],
    properties: {
      nombre: {
        bsonType: 'string',
        description: 'Nombre del plan (ej. \'Dieta de Volumen Limpio\').'
      },
      descripcion: {
        bsonType: 'string',
        description: 'Instrucciones generales del plan nutricional.'
      },
      comidas: {
        bsonType: "array",
        description: "Lista de comidas. Debe contener al menos una comida.",
        minItems: 1,
        items: {
          bsonType: "object",
          required: ["nombre", "descripcion"],
          properties: {
            nombre: { bsonType: "string", enum: ["desayuno", "almuerzo", "cena"], description: "Tipo de comida." },
            descripcion: { bsonType: "string", description: "Alimentos y cantidades." },
            caloriasEstimadas: { bsonType: "int", minimum: 0, description: "Estimación de calorías." }
          }
        }
      },
      fechaRegistro: { bsonType: "date", description: "Fecha de creación del plan." }
    }
  }
};

export const transaccionFinancieraSchema = {
  $jsonSchema: {
    bsonType: "object",
    title: "Esquema de Transacción Financiera",
    required: ["tipo", "monto", "descripcion", "fecha"],
    properties: {
      contratoId: { bsonType: ["objectId", "null"], description: "Referencia al contrato (opcional)." },
      clienteId: { bsonType: ["objectId", "null"], description: "Referencia al cliente (opcional)." },
      tipo: { bsonType: "string", enum: ["ingreso", "egreso"], description: "Tipo de transacción." },
      monto: { bsonType: ["double", "int"], minimum: 0, description: "Monto de la transacción." },
      descripcion: { bsonType: "string", description: "Descripción de la transacción." },
      fecha: { bsonType: "date", description: "Fecha de la transacción." }
    }
  }
};