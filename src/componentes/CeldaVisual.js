import React from 'react';

/**
 * Componente para visualizar una celda individual del tablero
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.celda - Instancia de la celda a mostrar
 * @param {Object} props.tema - Clases CSS del tema
 * @param {string} props.tamañoCelda - Tamaño de la celda (clases CSS)
 * @param {boolean} props.esCeldaActual - Si es la celda actualmente seleccionada
 * @param {string} props.animacion - Clase de animación a aplicar
 */
const CeldaVisual = ({ celda, tema, tamañoCelda, esCeldaActual, animacion }) => {
  // Determinar estilo base según estado
  let estiloBase = `${tamañoCelda} flex items-center justify-center font-bold border transition-all duration-200 aspect-square `;
  
  // Determinar color de fondo según estado
  if (esCeldaActual) {
    estiloBase += 'bg-yellow-200 dark:bg-yellow-700 border-yellow-400 dark:border-yellow-600 ';
  } else if (celda.tieneBandera) {
    estiloBase += 'bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700 ';
  } else if (celda.descubierta) {
    if (celda.valor === 'M') {
      estiloBase += 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 ';
    } else {
      estiloBase += 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800 ';
    }
  } else {
    estiloBase += 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 ';
  }
  
  // Añadir animación si existe
  if (animacion) {
    estiloBase += animacion + ' ';
  }
  
  // Determinar el contenido de la celda
  const obtenerContenidoCelda = () => {
    if (celda.tieneBandera) {
      return <span>🚩</span>;
    }
    
    if (!celda.descubierta) {
      return null;
    }
    
    if (celda.valor === 'M') {
      return <span>💣</span>;
    }
    
    if (celda.valor === '') {
      return null;
    }
    
    // Determinar color del número según su valor
    const colorNumero = obtenerColorNumero(celda.valor);
    
    return (
      <span className={colorNumero}>
        {celda.valor}
      </span>
    );
  };
  
  // Obtener color del número según su valor
  const obtenerColorNumero = (valor) => {
    switch (valor) {
      case '1': return 'text-blue-600 dark:text-blue-300';
      case '2': return 'text-green-600 dark:text-green-300';
      case '3': return 'text-red-600 dark:text-red-300';
      case '4': return 'text-purple-600 dark:text-purple-300';
      case '5': return 'text-yellow-600 dark:text-yellow-300';
      case '6': return 'text-cyan-600 dark:text-cyan-300';
      case '7': return 'text-black dark:text-white';
      case '8': return 'text-gray-500 dark:text-gray-300';
      case '0': return 'text-gray-400 dark:text-gray-500';
      default: return '';
    }
  };
  
  return (
    <div 
      className={estiloBase}
      data-testid={`celda-${celda.fila}-${celda.columna}`}
      data-fila={celda.fila}
      data-columna={celda.columna}
      data-value={celda.valor}
    >
      {obtenerContenidoCelda()}
    </div>
  );
};

export default CeldaVisual;