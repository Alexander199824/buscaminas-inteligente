import React from 'react';

/**
 * Componente para mostrar estadísticas de la partida actual
 * @param {Object} props - Propiedades del componente
 */
const PanelEstadisticas = ({ 
  tema, 
  tiempoJuego, 
  movimientosRealizados, 
  tablero,
  enCurso,
  juegoTerminado
}) => {
  /**
   * Formatea el tiempo de juego en formato MM:SS
   * @param {number} segundos - Tiempo en segundos
   * @returns {string} - Tiempo formateado
   */
  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };
  
  // Calcular estadísticas del tablero
  const calcularEstadisticas = () => {
    if (!tablero) return { celdasReveladas: 0, banderasColocadas: 0, totalCeldas: 0 };
    
    const celdasReveladas = tablero.contadorDescubiertas || 0;
    const banderasColocadas = tablero.contadorBanderas || 0;
    const totalCeldas = tablero.filas * tablero.columnas;
    
    return {
      celdasReveladas,
      banderasColocadas,
      totalCeldas,
      progreso: Math.round((celdasReveladas / totalCeldas) * 100)
    };
  };
  
  const estadisticas = calcularEstadisticas();
  
  // Determinar estado del juego
  const obtenerEstadoJuego = () => {
    if (!enCurso && !juegoTerminado) return 'No iniciado';
    if (juegoTerminado) return 'Finalizado';
    return 'En progreso';
  };
  
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Partida Actual</h2>
      
      <div className={`p-4 rounded border ${tema.panel}`}>
        {/* Estadísticas principales en grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium mb-1">Tiempo</div>
            <div className="text-xl font-mono flex items-center">
              <span className="mr-1">⏱️</span>
              {formatearTiempo(tiempoJuego)}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Estado</div>
            <div className="font-medium">
              {obtenerEstadoJuego()}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Movimientos</div>
            <div className="text-xl font-mono flex items-center">
              <span className="mr-1">🔍</span>
              {movimientosRealizados}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Banderas</div>
            <div className="text-xl font-mono flex items-center">
              <span className="mr-1">🚩</span>
              {estadisticas.banderasColocadas}
            </div>
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Progreso:</span>
            <span>{estadisticas.celdasReveladas} / {estadisticas.totalCeldas} celdas ({estadisticas.progreso}%)</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${estadisticas.progreso}%` }}
            ></div>
          </div>
        </div>
        
        {/* Leyenda de colores */}
        <div className="mt-4 text-xs text-center">
          <span className="text-gray-500 dark:text-gray-400">
            Leyenda: 
            <span className="ml-1 text-blue-600 dark:text-blue-400">1</span>
            <span className="ml-1 text-green-600 dark:text-green-400">2</span>
            <span className="ml-1 text-red-600 dark:text-red-400">3</span>
            <span className="ml-1 text-purple-600 dark:text-purple-400">4</span>
            <span className="ml-1 text-yellow-600 dark:text-yellow-400">5</span>
            <span className="ml-1 text-cyan-600 dark:text-cyan-400">6</span>
            <span className="ml-1">7</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">8</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default PanelEstadisticas;