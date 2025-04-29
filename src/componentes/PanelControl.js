import React from 'react';

/**
 * Componente para el panel de control del juego
 * Permite controlar el flujo del juego y cambiar configuraciones
 * @param {Object} props - Propiedades del componente
 */
const PanelControl = ({ 
  tema, 
  tamañosTablero, 
  tamañoSeleccionado, 
  enCurso, 
  juegoTerminado,
  victoria,
  cambiarTamañoTablero, 
  iniciarJuego,
  reiniciarJuego,
  reiniciarMemoria,
  estadisticas
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Panel de Control</h2>
      
      <div className={`p-4 rounded border ${tema.panel} mb-4`}>
        {/* Selector de tamaño */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Tamaño del tablero:</label>
          <select
            className={`w-full p-2 rounded ${tema.selector}`}
            value={tamañoSeleccionado.nombre}
            onChange={(e) => {
              const nuevoTamaño = tamañosTablero.find(t => t.nombre === e.target.value);
              cambiarTamañoTablero(nuevoTamaño);
            }}
            disabled={enCurso}
          >
            {tamañosTablero.map(tamaño => (
              <option key={tamaño.nombre} value={tamaño.nombre}>
                {tamaño.nombre}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            {`${tamañoSeleccionado.filas} × ${tamañoSeleccionado.columnas} = ${tamañoSeleccionado.filas * tamañoSeleccionado.columnas} celdas`}
          </p>
        </div>
        
        {/* Botón de acción principal */}
        <div className="mb-4">
          {!enCurso ? (
            <button
              className={`w-full py-3 rounded font-semibold ${tema.botonPrimario}`}
              onClick={iniciarJuego}
              disabled={juegoTerminado && !victoria}
            >
              Iniciar Juego
            </button>
          ) : (
            <button
              className={`w-full py-3 rounded font-semibold bg-red-600 hover:bg-red-700 text-white`}
              onClick={reiniciarJuego}
            >
              Reiniciar Juego
            </button>
          )}
        </div>
        
        {/* Estado actual */}
        {juegoTerminado && (
          <div className={`p-3 rounded mb-3 text-center ${victoria ? tema.victoria : tema.derrota}`}>
            {victoria ? '¡Victoria!' : '¡Derrota!'}
          </div>
        )}
        
        {/* Botón para reiniciar memoria */}
        <div className="mt-4">
          <button
            className={`w-full py-2 rounded font-medium ${tema.botonSecundario}`}
            onClick={reiniciarMemoria}
            disabled={enCurso}
          >
            Reiniciar Memoria del Sistema
          </button>
          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            Esto borrará todo el aprendizaje del sistema.
          </p>
        </div>
      </div>
      
      {/* Estadísticas del sistema */}
      {estadisticas && (
        <div className={`p-4 rounded border ${tema.panel} mb-4`}>
          <h3 className="font-semibold mb-2">Estadísticas del Sistema</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Partidas jugadas:</span>
              <span className="font-medium">{estadisticas.partidasJugadas}</span>
            </div>
            <div className="flex justify-between">
              <span>Victorias / Derrotas:</span>
              <span className="font-medium">{estadisticas.victorias} / {estadisticas.derrotas}</span>
            </div>
            <div className="flex justify-between">
              <span>% Victoria:</span>
              <span className="font-medium">
                {estadisticas.partidasJugadas > 0 
                  ? Math.round((estadisticas.victorias / estadisticas.partidasJugadas) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Minas descubiertas:</span>
              <span className="font-medium">{estadisticas.minasTotales}</span>
            </div>
            <div className="flex justify-between">
              <span>Patrones aprendidos:</span>
              <span className="font-medium">
                {estadisticas.patronesAprendidos 
                  ? Object.values(estadisticas.patronesAprendidos).reduce((sum, val) => sum + val, 0)
                  : 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelControl;