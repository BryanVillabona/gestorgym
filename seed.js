/*

SCRIPT DE SIEMBRA DE DATOS DE PRUEBA ROBUSTOS PARA DESARROLLO Y PRUEBAS NECESARIAS

*/

import database from './config/mongodb.js';
import {
  clienteSchema,
  planEntrenamientoSchema,
  contratoSchema,
  seguimientoFisicoSchema,
  planNutricionalSchema,
  transaccionFinancieraSchema
} from './models/schemas/schemas.js';
import dayjs from 'dayjs';
import dotenv from 'dotenv';

dotenv.config();

const coleccionesConEsquema = {
  clientes: clienteSchema,
  planes_entrenamiento: planEntrenamientoSchema,
  contratos: contratoSchema,
  seguimiento_fisico: seguimientoFisicoSchema,
  planes_nutricionales: planNutricionalSchema,
  transacciones_financieras: transaccionFinancieraSchema
};

async function aplicarValidaciones(db) {
  console.log('Aplicando validaciones de esquema...');
  for (const [nombreColeccion, esquema] of Object.entries(coleccionesConEsquema)) {
    try {
      await db.createCollection(nombreColeccion, { validator: esquema });
      console.log(`- Colección '${nombreColeccion}' creada con validación.`);
    } catch (error) {
      if (error.code === 48) { // NamespaceExists
        await db.command({
          collMod: nombreColeccion,
          validator: esquema
        });
        console.log(`- Validación actualizada en colección existente '${nombreColeccion}'.`);
      } else {
        console.error(`Error al aplicar validación a '${nombreColeccion}':`, error);
      }
    }
  }
}

async function seedDatabase() {
  const HOY = dayjs("2025-09-26T10:00:00-05:00"); // Fecha fija para consistencia
  
  try {
    console.log("Iniciando script de siembra con datos de prueba robustos...");
    const db = await database.realizarConexion();

    await aplicarValidaciones(db);

    console.log('\nLimpiando todas las colecciones existentes...');
    for (const nombreColeccion of Object.keys(coleccionesConEsquema)) {
      await db.collection(nombreColeccion).deleteMany({});
    }

    console.log('\nInsertando datos de prueba...');

    // 1. Clientes
    const clientesResult = await db.collection('clientes').insertMany([
      { nombre: 'Juan Pérez', email: 'juan.perez@email.com', telefono: '3101234567', fechaRegistro: HOY.subtract(1, 'year').toDate(), activo: true },
      { nombre: 'María Rodríguez', email: 'maria.r@email.com', telefono: '3118765432', fechaRegistro: HOY.subtract(10, 'months').toDate(), activo: true },
      { nombre: 'Carlos Gómez', email: 'carlos.gomez@email.com', telefono: '3123456789', fechaRegistro: HOY.subtract(8, 'months').toDate(), activo: true },
      { nombre: 'Ana Martínez', email: 'ana.martinez@email.com', telefono: '3139876543', fechaRegistro: HOY.subtract(6, 'months').toDate(), activo: true },
      { nombre: 'Pedro Sánchez', email: 'pedro.s@email.com', telefono: '3145678901', fechaRegistro: HOY.subtract(4, 'months').toDate(), activo: true },
      { nombre: 'Laura Jiménez', email: 'laura.j@email.com', telefono: '3152345678', fechaRegistro: HOY.subtract(3, 'months').toDate(), activo: true },
      { nombre: 'Andrés Castro', email: 'andres.castro@email.com', telefono: '3168765432', fechaRegistro: HOY.subtract(2, 'months').toDate(), activo: true },
      { nombre: 'Sofía Vargas', email: 'sofia.v@email.com', telefono: '3173456789', fechaRegistro: HOY.subtract(1, 'month').toDate(), activo: true },
      { nombre: 'David Ortiz', email: 'david.ortiz@email.com', telefono: '3189876543', fechaRegistro: HOY.subtract(15, 'days').toDate(), activo: true },
      { nombre: 'Valentina Mora', email: 'valentina.mora@email.com', telefono: '3195678901', fechaRegistro: HOY.subtract(5, 'days').toDate(), activo: false },
    ]);
    const clientesIds = Object.values(clientesResult.insertedIds);
    console.log(`- ${clientesIds.length} Clientes insertados.`);

    // 2. Planes de Entrenamiento
    const planesData = [
      { nombre: 'Fuerza y Potencia', duracion_dias: 90, metas: 'Incrementar fuerza máxima', nivel: 'avanzado', precio_sugerido: 250000 },
      { nombre: 'Hipertrofia Muscular', duracion_dias: 60, metas: 'Ganancia de masa muscular', nivel: 'intermedio', precio_sugerido: 180000 },
      { nombre: 'Pérdida de Peso', duracion_dias: 30, metas: 'Reducir grasa corporal', nivel: 'principiante', precio_sugerido: 120000 },
      { nombre: 'Acondicionamiento Funcional', duracion_dias: 45, metas: 'Mejorar movilidad y resistencia', nivel: 'intermedio', precio_sugerido: 150000 },
      { nombre: 'Preparación Competencia', duracion_dias: 120, metas: 'Puesta a punto para tarima', nivel: 'avanzado', precio_sugerido: 400000 },
    ];
    const planesResult = await db.collection('planes_entrenamiento').insertMany(planesData);
    const planesIds = Object.values(planesResult.insertedIds);
    planesData.forEach((plan, i) => plan._id = planesIds[i]);
    console.log(`- ${planesIds.length} Planes de entrenamiento insertados.`);
    
    // 3. Contratos
    const contratosData = [
      // Activos
      { clienteId: clientesIds[0], planId: planesIds[0], fechaInicio: HOY.subtract(20, 'days').toDate(), fechaFin: HOY.add(70, 'days').toDate(), precio: 250000, estado: 'activo' }, // Contrato con plan nutricional
      { clienteId: clientesIds[1], planId: planesIds[1], fechaInicio: HOY.subtract(10, 'days').toDate(), fechaFin: HOY.add(50, 'days').toDate(), precio: 175000, estado: 'activo' }, // Contrato sin plan nutricional
      // Vencido pero activo (para probar 'Finalizar')
      { clienteId: clientesIds[2], planId: planesIds[2], fechaInicio: HOY.subtract(40, 'days').toDate(), fechaFin: HOY.subtract(10, 'days').toDate(), precio: 120000, estado: 'activo' },
      // Finalizados
      { clienteId: clientesIds[3], planId: planesIds[3], fechaInicio: HOY.subtract(3, 'months').toDate(), fechaFin: HOY.subtract(48, 'days').toDate(), precio: 150000, estado: 'finalizado' },
      { clienteId: clientesIds[0], planId: planesIds[2], fechaInicio: HOY.subtract(6, 'months').toDate(), fechaFin: HOY.subtract(5, 'months').toDate(), precio: 110000, estado: 'finalizado' },
      // Cancelados
      { clienteId: clientesIds[4], planId: planesIds[0], fechaInicio: HOY.subtract(5, 'months').toDate(), fechaFin: HOY.subtract(2, 'months').toDate(), precio: 240000, estado: 'cancelado' }, // Cancelado con reembolso
      { clienteId: clientesIds[5], planId: planesIds[1], fechaInicio: HOY.subtract(50, 'days').toDate(), fechaFin: HOY.add(10, 'days').toDate(), precio: 180000, estado: 'cancelado' }, // Cancelado sin reembolso
      // Renovación
      { clienteId: clientesIds[6], planId: planesIds[3], fechaInicio: HOY.subtract(80, 'days').toDate(), fechaFin: HOY.subtract(35, 'days').toDate(), precio: 150000, estado: 'renovado' }, // El antiguo
      { clienteId: clientesIds[6], planId: planesIds[3], fechaInicio: HOY.subtract(35, 'days').toDate(), fechaFin: HOY.add(10, 'days').toDate(), precio: 160000, estado: 'activo', renuevaContratoId: null }, // El nuevo (el ID se actualizará)
      // Otros activos para tener volumen
      { clienteId: clientesIds[7], planId: planesIds[2], fechaInicio: HOY.subtract(3, 'days').toDate(), fechaFin: HOY.add(27, 'days').toDate(), precio: 120000, estado: 'activo' },
      { clienteId: clientesIds[8], planId: planesIds[4], fechaInicio: HOY.subtract(15, 'days').toDate(), fechaFin: HOY.add(105, 'days').toDate(), precio: 400000, estado: 'activo' },
      { clienteId: clientesIds[1], planId: planesIds[3], fechaInicio: HOY.subtract(5, 'months').toDate(), fechaFin: HOY.subtract(4, 'months' - 15, 'days').toDate(), precio: 135000, estado: 'finalizado' },
    ];
    const contratosResult = await db.collection('contratos').insertMany(contratosData);
    const contratosIds = Object.values(contratosResult.insertedIds);
    // Actualizamos el ID de renovación
    await db.collection('contratos').updateOne({ _id: contratosIds[8] }, { $set: { renuevaContratoId: contratosIds[7] } });
    console.log(`- ${contratosIds.length} Contratos insertados.`);

    // Transacciones por Contratos
    const transaccionesIngresoContratos = contratosData.map((contrato, i) => ({
      contratoId: contratosIds[i], clienteId: contrato.clienteId, tipo: 'ingreso', monto: contrato.precio,
      descripcion: `Pago inicial - ${planesData.find(p => p._id.equals(contrato.planId)).nombre}`, fecha: contrato.fechaInicio
    }));
    await db.collection('transacciones_financieras').insertMany(transaccionesIngresoContratos);
    console.log(`- ${transaccionesIngresoContratos.length} Transacciones de ingreso por contrato insertadas.`);
    
    // 4. Seguimiento Físico
    const seguimientoData = [
        { contratoId: contratosIds[0], fecha: HOY.subtract(13, 'days').toDate(), peso_kg: 85, grasa_corporal_porcentaje: 15.5, medidas: { pecho: 110, brazo: 39, cintura: 85, pierna: 60 }, fotos_urls: ["https://placehold.co/600x400"], comentarios: "Inicio del plan.", estado: "valido" },
        { contratoId: contratosIds[0], fecha: HOY.subtract(6, 'days').toDate(), peso_kg: 84.5, grasa_corporal_porcentaje: 15.1, medidas: { pecho: 110.5, brazo: 39.5, cintura: 84, pierna: 60.5 }, fotos_urls: [], comentarios: "Buena adaptación.", estado: "valido" },
        { contratoId: contratosIds[0], fecha: HOY.subtract(2, 'days').toDate(), peso_kg: 99, estado: "cancelado", fotos_urls: [] }, // Cancelado
        { contratoId: contratosIds[1], fecha: HOY.subtract(3, 'days').toDate(), peso_kg: 62, grasa_corporal_porcentaje: 22, medidas: { cintura: 65 }, fotos_urls: [], comentarios: "Cliente motivada.", estado: "valido" }
    ];
    await db.collection('seguimiento_fisico').insertMany(seguimientoData);
    console.log(`- ${seguimientoData.length} Registros de seguimiento insertados.`);

    // 5. Planes Nutricionales (Compatibles con el schema)
    const planesNutricionalesData = [
        { 
            contratoId: contratosIds[0], // Juan Pérez
            nombre: 'Dieta de Fuerza y Volumen', descripcion: 'Alta en proteínas y carbohidratos.', 
            comidas: [
                { nombre: 'desayuno', descripcion: 'Arepa con huevo y queso', caloriasEstimadas: 600 },
                { nombre: 'almuerzo', descripcion: 'Bandeja Paisa', caloriasEstimadas: 1200 },
                { nombre: 'cena', descripcion: 'Pechuga de pollo con arroz', caloriasEstimadas: 700 }
            ], 
            fechaRegistro: HOY.subtract(20, 'days').toDate() 
        },
        { 
            contratoId: contratosIds[8], // Andrés Castro (contrato renovado)
            nombre: 'Dieta de Acondicionamiento', descripcion: 'Balanceada para resistencia.', 
            comidas: [ { nombre: 'almuerzo', descripcion: 'Pasta integral con vegetales', caloriasEstimadas: 800 } ], 
            fechaRegistro: HOY.subtract(30, 'days').toDate() 
        }
    ];
    await db.collection('planes_nutricionales').insertMany(planesNutricionalesData);
    console.log(`- ${planesNutricionalesData.length} Planes nutricionales insertados.`);

    // 6. Transacciones Varias
    const transaccionesVariasData = [
      { tipo: 'egreso', monto: 350000, descripcion: 'Pago de arriendo del local', fecha: HOY.subtract(20, 'days').toDate(), clienteId: null, contratoId: null },
      { tipo: 'egreso', monto: 150000, descripcion: 'Compra de suplementos', fecha: HOY.subtract(10, 'days').toDate(), clienteId: null, contratoId: null },
      { tipo: 'ingreso', monto: 7000, descripcion: 'Venta de botella de agua', fecha: HOY.subtract(5, 'days').toDate(), clienteId: clientesIds[4], contratoId: null },
      { tipo: 'ingreso', monto: 25000, descripcion: 'Pase de un día', fecha: HOY.subtract(2, 'days').toDate(), clienteId: null, contratoId: null },
      { tipo: 'egreso', monto: 240000, descripcion: 'Reembolso por cancelación - Fuerza y Potencia', fecha: HOY.subtract(4, 'months').toDate(), clienteId: clientesIds[4], contratoId: contratosIds[4]},
    ];
    await db.collection('transacciones_financieras').insertMany(transaccionesVariasData);
    console.log(`- ${transaccionesVariasData.length} Transacciones varias insertadas.`);

    console.log('\n✅ Base de datos configurada y poblada exitosamente con datos realistas.');

  } catch (error) {
    console.error("❌ Error en el script de siembra:", error);
  } finally {
    await database.desconectar();
  }
}

seedDatabase();