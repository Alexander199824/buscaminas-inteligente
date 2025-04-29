import React, { useState } from 'react';

/**
 * Componente para que el usuario indique qué hay en una celda
 * @param {Object} props - Propiedades del componente
 */
const PanelRespuesta = ({ tema, celdaActual, manejarRespuesta }) => {
  // Estado para la respuesta seleccionada
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);
  
  /**
   * Maneja el clic en un botón de respuesta
   * @param {string} respuesta - Respuesta seleccionada
   */
  const seleccionarRespuesta = (respuesta) => {
    setRespuestaSeleccionada(respuesta);
  };
  
  /**
   * Confirma la respuesta seleccionada
   */
  const confirmarRespuesta = () => {
    if (respuestaSeleccionada !== null) {
      manejarRespuesta(respuestaSeleccionada);
      setRespuestaSeleccionada(null);
    }
  };
  
  return (
    <div className="w-full mb-6 py-4 px-5 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-inner animate-pulse">
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold">
          ¿Qué hay en la casilla ({celdaActual.fila + 1}, {celdaActual.columna + 1})?
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Selecciona el contenido de esta celda
        </p>
      </div>
      
      {/* Opciones de respuesta */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {/* Opción Vacío */}
        <button
          className={`px-4 py-2 rounded border font-medium ${
            respuestaSeleccionada === 'vacío' ? tema.botonSeleccionado : tema.botonSecundario
          }`}
          onClick={() => seleccionarRespuesta('vacío')}
        >
          Vacío
        </button>
        
        {/* Opción 0 */}
        <button
          className={`px-4 py-2 rounded border font-medium ${
            respuestaSeleccionada === '0' ? tema.botonSeleccionado : tema.botonSecundario
          }`}
          onClick={() => seleccionarRespuesta('0')}
        >
          0
        </button>
        
        {/* Números del 1 al 8 */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
          <button
            key={num}
            className={`w-12 h-12 flex items-center justify-center rounded border font-medium ${
              respuestaSeleccionada === num.toString() ? tema.botonSeleccionado : tema.botonSecundario
            }`}
            onClick={() => seleccionarRespuesta(num.toString())}
          >
            {num}
          </button>
        ))}
        
        {/* Opción Mina */}
        <button
          className={`px-4 py-2 rounded border font-medium ${
            respuestaSeleccionada === 'mina' ? tema.botonSeleccionado : tema.botonSecundario
          }`}
          onClick={() => seleccionarRespuesta('mina')}
        >
          Mina 💣
        </button>
      </div>
      
      {/* Botón de confirmación */}
      <div className="text-center">
        <button
          className={`px-6 py-2 rounded font-medium ${
            respuestaSeleccionada !== null ? tema.botonPrimario : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
          }`}
          onClick={confirmarRespuesta}
          disabled={respuestaSeleccionada === null}
        >
          Confirmar
        </button>
        
        <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
          Selecciona "Vacío" o "0" para celdas sin minas adyacentes. 
          "Vacío" equivale visualmente a una casilla en blanco.
        </p>
      </div>
    </div>
  );
};

export default PanelRespuesta;