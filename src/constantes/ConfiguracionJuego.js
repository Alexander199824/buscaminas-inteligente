/**
 * Constantes y configuración para el juego de Buscaminas Inverso
 */

// Tamaños disponibles para el tablero
export const TAMAÑOS_TABLERO = [
    { nombre: "8×8", filas: 8, columnas: 8 },
    { nombre: "10×10", filas: 10, columnas: 10 },
    { nombre: "12×12", filas: 12, columnas: 12 },
    { nombre: "15×15", filas: 15, columnas: 15 },
    { nombre: "16×16", filas: 16, columnas: 16 },
    { nombre: "20×20", filas: 20, columnas: 20 },
];

// Tipos de celdas
export const TIPOS_CELDA = {
    VACIA: "vacia",
    NUMERO: "numero",
    MINA: "mina",
    BANDERA: "bandera"
};

// Tipos de acciones del sistema
export const TIPOS_ACCION = {
    INICIAL: "inicial",
    SELECCION: "seleccion",
    RESPUESTA: "respuesta",
    BANDERAS: "banderas",
    VICTORIA: "victoria",
    DERROTA: "derrota",
    ERROR: "error",
    REINICIO: "reinicio"
};

// Duración de animaciones (en ms)
export const DURACION_ANIMACION = 1500;

// Tiempos de espera entre acciones (en ms)
export const TIEMPOS_ESPERA = {
    ANIMACION_BANDERA: 1000,
    SIGUIENTE_MOVIMIENTO: 1500,
    MENSAJE_VICTORIA: 3000,
    MENSAJE_DERROTA: 3000
};

// Parámetros para la estrategia de juego
export const PARAMETROS_ESTRATEGIA = {
    // Umbral para considerar una celda segura por probabilidad
    UMBRAL_SEGURIDAD: 0.1,
    
    // Umbral para considerar una celda con mina por probabilidad
    UMBRAL_MINA: 0.9,
    
    // Niveles de riesgo para selección de celdas
    NIVELES_RIESGO: {
        MUY_SEGURA: 0.1,
        SEGURA: 0.2,
        BAJO_RIESGO: 0.3,
        RIESGO_MODERADO: 0.5,
        ALTO_RIESGO: 1.0
    },
    
    // Nivel de confianza para considerar una certeza
    CONFIANZA_CERTEZA: 0.95
};

// Parámetros para la memoria
export const PARAMETROS_MEMORIA = {
    // Número máximo de partidas a recordar
    MAX_PARTIDAS: 50,
    
    // Número máximo de secuencias a recordar
    MAX_SECUENCIAS: 100,
    
    // Número de contradicciones para detectar cambio de tablero
    UMBRAL_CAMBIO_TABLERO: 3
};

// Estilos CSS para los distintos temas
export const TEMAS = {
    CLARO: {
        principal: 'bg-white text-gray-800',
        tarjeta: 'bg-gray-50 shadow-sm border border-gray-200',
        cabecera: 'bg-gray-100 text-gray-800 border-b border-gray-200',
        botonPrimario: 'bg-blue-600 hover:bg-blue-700 text-white',
        botonSecundario: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
        botonSeleccionado: 'bg-blue-500 text-white',
        panel: 'bg-white border-gray-200',
        victoria: 'bg-green-100 text-green-800',
        derrota: 'bg-red-100 text-red-800'
    },
    OSCURO: {
        principal: 'bg-gray-900 text-white',
        tarjeta: 'bg-gray-800 shadow-xl',
        cabecera: 'bg-indigo-800 text-white',
        botonPrimario: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        botonSecundario: 'bg-gray-700 hover:bg-gray-600 text-white',
        botonSeleccionado: 'bg-indigo-500 text-white',
        panel: 'bg-gray-700 border-gray-600',
        victoria: 'bg-green-700 text-white',
        derrota: 'bg-red-800 text-white'
    }
};