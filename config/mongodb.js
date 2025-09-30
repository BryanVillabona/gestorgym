// importación de librerias 
import { MongoClient } from "mongodb";
import 'dotenv/config';

// Configuración para la conexión remota a ATLAS 
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_CLUSTER = process.env.DB_CLUSTER;
const DB_NAME = process.env.DB_NAME;

// Construcción de la URI a ATLAS 
const URI = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_CLUSTER}/?retryWrites=true&w=majority&appName=Cluster0`;

// Clase Database (Patron de diseño usado: SINGLETON)
class Database {

    constructor() {

        // Se crea el MongoClient
        this.cliente = new MongoClient(URI);

        // Database por defecto: null
        this.db = null;
    }

    // método para realizar la colección
    async realizarConexion() {

        // Si la Database es null
        if (this.db === null) {

            // Intenta conectar
            try {
                await this.cliente.connect();
                this.db = this.cliente.db(DB_NAME);
                console.log("Conexión exitosa a la base de datos");

                // Si algo falla se encarga de que el valor de Database sea null para evitar errores
            } catch (error) {
                console.error("Error al conectar a la base de datos:", error);
                this.db = null; 
                throw error; 
            }
        }

        // Se retorna la Database
        return this.db;
    }

    // Método para obtener la colección necesaria para trabajar
    async getCollection(name) {
        // Asegurarse de que la conexión está hecha antes de devolver la colección
        if (this.db === null) {
            await this.realizarConexion();
        }
        // Se retorna la colección
        return this.db.collection(name);
    }

    // Método para desconectarse de la base de datos
    async desconectar() {
        if (this.db) {
            // Intenta cerrar la conexión
            try {
                await this.cliente.close();
                // Resetea el valor de la Database a null
                this.db = null;
                console.log("Desconectado de la base de datos.");
            } catch (error) {
                // En caso de error 
                console.error("Error al desconectar:", error);
                throw error;
            }
        }
    }

    getMongoClient() {
        return this.cliente;
    }
}

// Se crea una instacia 
const database = new Database();

// Exportación
export default database;