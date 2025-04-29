import React from 'react';
import CeldaVisual from './CeldaVisual';

/**
 * Componente para mostrar visualmente el tablero de Buscaminas
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.tema - Clases CSS del tema
 * @param {Object} props.tablero - Instancia del tablero de juego
 * @param {Object} props.celdaActual - Celda actualmente seleccionada
 * @param {Object} props.ultimaAccion - Última acción realizada por el sistema
 */
const TableroVisual = ({ tema, tablero, celdaActual, ultimaAccion }) => {
  // Si no hay tablero, no renderizar nada
  if (!tablero) return null;
  
  // Calcular tamaño de celda basado en dimensiones del tablero
  const calcularTamañoCelda = () => {
    const max = Math.max(tablero.filas, tablero.columnas);
    
    if (max <= 8) return 'w-12 h-12';
    if (max <= 10) return 'w-10 h-10';
    if (max <= 12) return 'w-9 h-9';
    if (max <= 15) return 'w-8 h-8';
    return 'w-6 h-6'; // Para tableros muy grandes
  };
  
  const tamañoCelda = calcularTamañoCelda();
  
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="mb-4 flex justify-center">
        <div className="flex flex-col items-center">
          {/* Numeración superior de columnas */}
          <div 
            className="flex mb-1 ml-8"
            style={{ width: `calc(${tamañoCelda.split(' ')[0].slice(2)}rem * ${tablero.columnas})` }}
          >
            {Array.from({ length: tablero.columnas }, (_, idx) => (
              <div 
                key={`col-${idx}`} 
                className={`font-semibold text-center ${tamañoCelda.split(' ')[0]}`}
              >
                {idx + 1}
              </div>
            ))}
          </div>
          
          <div className="flex">
            {/* Numeración lateral de filas */}
            <div className="flex flex-col mr-2">
              {Array.from({ length: tablero.filas }, (_, idx) => (
                <div 
                  key={`row-${idx}`}
                  className={`font-semibold flex items-center justify-center ${tamañoCelda.split(' ')[1]}`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
            
            {/* Tablero */}
            <div 
              className="grid gap-px bg-gray-300 dark:bg-gray-700 p-px border-4 border-gray-400 dark:border-gray-600 rounded-md"
              style={{
                gridTemplateColumns: `repeat(${tablero.columnas}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${tablero.filas}, minmax(0, 1fr))`
              }}
            >
              {Array.from({ length: tablero.filas }).map((_, fila) => (
                Array.from({ length: tablero.columnas }).map((_, columna) => {
                  const celda = tablero.obtenerCelda(fila, columna);
                  if (!celda) return null;
                  
                  const esUltimaSeleccion = 
                    ultimaAccion.tipo === 'seleccion' && 
                    ultimaAccion.celda && 
                    ultimaAccion.celda.fila === fila && 
                    ultimaAccion.celda.columna === columna;
                    
                  const esUltimaRespuesta = 
                    ultimaAccion.tipo === 'respuesta' && 
                    ultimaAccion.celda && 
                    ultimaAccion.celda.fila === fila && 
                    ultimaAccion.celda.columna === columna;
                  
                  const esCeldaActual = 
                    celdaActual && 
                    celdaActual.fila === fila && 
                    celdaActual.columna === columna;
                  
                  const esUltimaBandera =
                    ultimaAccion.tipo === 'banderas' &&
                    ultimaAccion.banderas &&
                    ultimaAccion.banderas.some(b => b.fila === fila && b.columna === columna);
                  
                  const animacion = 
                    esUltimaSeleccion ? 'animate-pulse' :
                    esUltimaRespuesta ? 'animate-fadeIn' :
                    esUltimaBandera ? 'animate-bounce' : '';
                  
                  return (
                    <CeldaVisual
                      key={`${fila}-${columna}`}
                      celda={celda}
                      tema={tema}
                      tamañoCelda={tamañoCelda}
                      esCeldaActual={esCeldaActual}
                      animacion={animacion}
                    />
                  );
                })
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Leyenda */}
      <div className="flex flex-wrap justify-center gap-3 mt-2 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 mr-1"></div>
          <span>Sin descubrir</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-800 border border-blue-300 dark:border-blue-600 mr-1"></div>
          <span>Numérica</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-800 border border-yellow-300 dark:border-yellow-600 mr-1"></div>
          <span>Seleccionada</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-800 border border-red-300 dark:border-red-600 mr-1"></div>
          <span>Mina</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 mr-1">
            <span className="text-xs">🚩</span>
          </div>
          <span>Bandera</span>
        </div>
      </div>
    </div>
  );
};

export default TableroVisual;