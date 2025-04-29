import Celda from './Celda';

/**
 * Clase Tablero - Representa el tablero completo del juego de Buscaminas
 */
class Tablero {
  /**
   * Constructor del tablero
   * @param {number} filas - Número de filas
   * @param {number} columnas - Número de columnas
   */
  constructor(filas, columnas) {
    this.filas = filas;
    this.columnas = columnas;
    this.celdas = this.inicializarTablero();
    this.contadorDescubiertas = 0;
    this.contadorBanderas = 0;
    this.restriccionesActualizadas = false;
    this.ultimoCambio = {
      tipo: 'inicial',
      fila: null,
      columna: null,
      valor: null
    };
  }

  /**
   * Inicializa el tablero con celdas vacías
   * @returns {Array} - Matriz 2D de celdas
   */
  inicializarTablero() {
    const tablero = [];
    for (let fila = 0; fila < this.filas; fila++) {
      const filaCeldas = [];
      for (let columna = 0; columna < this.columnas; columna++) {
        filaCeldas.push(new Celda(fila, columna));
      }
      tablero.push(filaCeldas);
    }
    
    // Marcar celdas especiales (esquinas y bordes)
    this.marcarCeldasEspeciales(tablero);
    
    return tablero;
  }

  /**
   * Marca celdas especiales (esquinas y bordes) para análisis
   * @param {Array} tablero - Matriz de celdas
   */
  marcarCeldasEspeciales(tablero) {
    for (let fila = 0; fila < this.filas; fila++) {
      for (let columna = 0; columna < this.columnas; columna++) {
        const celda = tablero[fila][columna];
        
        // Determinar si es esquina
        celda.esEsquina = (fila === 0 || fila === this.filas - 1) && 
                          (columna === 0 || columna === this.columnas - 1);
        
        // Determinar si es borde
        celda.esBorde = fila === 0 || fila === this.filas - 1 || 
                        columna === 0 || columna === this.columnas - 1;
        
        // Calcular distancia al borde más cercano
        celda.distanciaBorde = Math.min(
          fila,                    // Distancia al borde superior
          this.filas - 1 - fila,   // Distancia al borde inferior
          columna,                 // Distancia al borde izquierdo
          this.columnas - 1 - columna // Distancia al borde derecho
        );
      }
    }
  }

  /**
   * Reinicia el tablero a su estado inicial
   */
  reiniciar() {
    this.celdas = this.inicializarTablero();
    this.contadorDescubiertas = 0;
    this.contadorBanderas = 0;
    this.restriccionesActualizadas = false;
    this.ultimoCambio = {
      tipo: 'inicial',
      fila: null,
      columna: null,
      valor: null
    };
  }

  /**
   * Obtiene una celda específica
   * @param {number} fila - Fila
   * @param {number} columna - Columna
   * @returns {Celda|null} - La celda o null si está fuera de límites
   */
  obtenerCelda(fila, columna) {
    if (this.esPosicionValida(fila, columna)) {
      return this.celdas[fila][columna];
    }
    return null;
  }

  /**
   * Verifica si una posición está dentro de los límites del tablero
   * @param {number} fila - Fila
   * @param {number} columna - Columna
   * @returns {boolean} - true si la posición es válida
   */
  esPosicionValida(fila, columna) {
    return fila >= 0 && fila < this.filas && columna >= 0 && columna < this.columnas;
  }

  /**
   * Establece el valor de una celda
   * @param {number} fila - Fila
   * @param {number} columna - Columna
   * @param {string} valor - Valor ('', '0', '1'...'8', 'M')
   * @returns {boolean} - true si se cambió el valor
   */
  establecerValorCelda(fila, columna, valor) {
    const celda = this.obtenerCelda(fila, columna);
    if (celda && !celda.descubierta) {
      celda.establecerValor(valor);
      this.contadorDescubiertas++;
      
      // Registrar el cambio
      this.ultimoCambio = {
        tipo: 'descubierta',
        fila,
        columna,
        valor
      };
      
      // Indicar que hay que actualizar restricciones
      this.restriccionesActualizadas = false;
      
      return true;
    }
    return false;
  }

  /**
   * Coloca o quita una bandera en una celda
   * @param {number} fila - Fila
   * @param {number} columna - Columna
   * @param {boolean} tieneBandera - Si debe tener bandera o no
   * @returns {boolean} - true si se cambió la bandera
   */
  establecerBandera(fila, columna, tieneBandera) {
    const celda = this.obtenerCelda(fila, columna);
    if (celda && !celda.descubierta) {
      // Si el estado está cambiando
      if (celda.tieneBandera !== tieneBandera) {
        celda.establecerBandera(tieneBandera);
        this.contadorBanderas += tieneBandera ? 1 : -1;
        
        // Registrar el cambio
        this.ultimoCambio = {
          tipo: 'bandera',
          fila,
          columna,
          valor: tieneBandera
        };
        
        // Indicar que hay que actualizar restricciones
        this.restriccionesActualizadas = false;
        
        return true;
      }
    }
    return false;
  }

  /**
   * Obtiene todas las celdas adyacentes a una posición
   * @param {number} fila - Fila
   * @param {number} columna - Columna
   * @returns {Array} - Array de objetos Celda adyacentes
   */
  obtenerCeldasAdyacentes(fila, columna) {
    const celdasAdyacentes = [];
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        // Saltar la celda central
        if (i === 0 && j === 0) continue;
        
        const nuevaFila = fila + i;
        const nuevaColumna = columna + j;
        
        const celda = this.obtenerCelda(nuevaFila, nuevaColumna);
        if (celda) {
          celdasAdyacentes.push(celda);
        }
      }
    }
    
    return celdasAdyacentes;
  }

  /**
   * Actualiza las restricciones numéricas en todo el tablero
   */
  actualizarRestricciones() {
    // Si ya están actualizadas, no hacer nada
    if (this.restriccionesActualizadas) return;
    
    // Limpiar todas las restricciones existentes
    for (let fila = 0; fila < this.filas; fila++) {
      for (let columna = 0; columna < this.columnas; columna++) {
        this.celdas[fila][columna].restricciones = [];
      }
    }
    
    // Recalcular restricciones basadas en celdas numéricas
    for (let fila = 0; fila < this.filas; fila++) {
      for (let columna = 0; columna < this.columnas; columna++) {
        const celda = this.celdas[fila][columna];
        
        // Si es una celda numérica revelada
        if (celda.tieneValorNumerico()) {
          const valor = celda.obtenerValorNumerico();
          const celdasAdyacentes = this.obtenerCeldasAdyacentes(fila, columna);
          
          // Celdas sin revelar que están afectadas por esta restricción
          const celdasSinRevolar = celdasAdyacentes.filter(c => !c.descubierta);
          
          // Si hay celdas sin revelar, crear restricción
          if (celdasSinRevolar.length > 0) {
            // Contar banderas ya colocadas
            const banderasColocadas = celdasAdyacentes.filter(c => c.tieneBandera).length;
            const minasRestantes = valor - banderasColocadas;
            
            // Agregar restricción a cada celda afectada
            celdasSinRevolar.forEach(celdaAfectada => {
              celdaAfectada.agregarRestriccion({
                celdaOrigen: { fila, columna },
                valor: valor,
                banderasColocadas: banderasColocadas,
                minasRestantes: minasRestantes,
                celdasAfectadas: celdasSinRevolar.map(c => ({ fila: c.fila, columna: c.columna }))
              });
            });
          }
        }
      }
    }
    
    this.restriccionesActualizadas = true;
  }

  /**
   * Obtiene todas las celdas sin revelar
   * @returns {Array} - Array de objetos Celda sin revelar
   */
  obtenerCeldasSinRevolar() {
    const celdasSinRevolar = [];
    for (let fila = 0; fila < this.filas; fila++) {
      for (let columna = 0; columna < this.columnas; columna++) {
        const celda = this.celdas[fila][columna];
        if (!celda.descubierta) {
          celdasSinRevolar.push(celda);
        }
      }
    }
    return celdasSinRevolar;
  }

  /**
   * Obtiene todas las celdas con banderas
   * @returns {Array} - Array de objetos Celda con banderas
   */
  obtenerCeldasConBandera() {
    const celdasConBandera = [];
    for (let fila = 0; fila < this.filas; fila++) {
      for (let columna = 0; columna < this.columnas; columna++) {
        const celda = this.celdas[fila][columna];
        if (celda.tieneBandera) {
          celdasConBandera.push(celda);
        }
      }
    }
    return celdasConBandera;
  }

  /**
   * Obtiene todas las celdas reveladas
   * @returns {Array} - Array de objetos Celda revelados
   */
  obtenerCeldasReveladas() {
    const celdasReveladas = [];
    for (let fila = 0; fila < this.filas; fila++) {
      for (let columna = 0; columna < this.columnas; columna++) {
        const celda = this.celdas[fila][columna];
        if (celda.descubierta) {
          celdasReveladas.push(celda);
        }
      }
    }
    return celdasReveladas;
  }

  /**
   * Obtiene todas las celdas numéricas
   * @returns {Array} - Array de objetos Celda con valores numéricos
   */
  obtenerCeldasNumericas() {
    const celdasNumericas = [];
    for (let fila = 0; fila < this.filas; fila++) {
      for (let columna = 0; columna < this.columnas; columna++) {
        const celda = this.celdas[fila][columna];
        if (celda.tieneValorNumerico()) {
          celdasNumericas.push(celda);
        }
      }
    }
    return celdasNumericas;
  }

  /**
   * Obtiene todas las celdas con certeza de tener mina
   * @returns {Array} - Array de celdas con 100% de certeza de tener mina
   */
  obtenerCeldasConCertezaDeMina() {
    const celdasConMina = [];
    for (let fila = 0; fila < this.filas; fila++) {
      for (let columna = 0; columna < this.columnas; columna++) {
        const celda = this.celdas[fila][columna];
        if (!celda.descubierta && !celda.tieneBandera && celda.es100PorCientoMina()) {
          celdasConMina.push(celda);
        }
      }
    }
    return celdasConMina;
  }

  /**
   * Obtiene todas las celdas con certeza de ser seguras
   * @returns {Array} - Array de celdas con 100% de certeza de ser seguras
   */
  obtenerCeldasConCertezaDeSeguridad() {
    const celdasSeguras = [];
    for (let fila = 0; fila < this.filas; fila++) {
      for (let columna = 0; columna < this.columnas; columna++) {
        const celda = this.celdas[fila][columna];
        if (!celda.descubierta && !celda.tieneBandera && celda.es100PorCientoSegura()) {
          celdasSeguras.push(celda);
        }
      }
    }
    return celdasSeguras;
  }

  /**
   * Imprime el tablero en la consola (para depuración)
   */
  imprimir() {
    let output = '';
    for (let fila = 0; fila < this.filas; fila++) {
      let filaString = '';
      for (let columna = 0; columna < this.columnas; columna++) {
        filaString += this.celdas[fila][columna].toString() + ' ';
      }
      output += filaString + '\n';
    }
    console.log(output);
  }

  /**
   * Devuelve la representación del estado del tablero para la memoria
   * @returns {Object} - Estado del tablero para la memoria
   */
  obtenerEstadoParaMemoria() {
    const estado = {
      filas: this.filas,
      columnas: this.columnas,
      contadorDescubiertas: this.contadorDescubiertas,
      contadorBanderas: this.contadorBanderas,
      celdasReveladas: [],
      celdasConBandera: [],
      timestamp: Date.now()
    };
    
    // Agregar celdas reveladas
    for (let fila = 0; fila < this.filas; fila++) {
      for (let columna = 0; columna < this.columnas; columna++) {
        const celda = this.celdas[fila][columna];
        if (celda.descubierta) {
          estado.celdasReveladas.push({
            fila: celda.fila,
            columna: celda.columna,
            valor: celda.valor
          });
        } else if (celda.tieneBandera) {
          estado.celdasConBandera.push({
            fila: celda.fila,
            columna: celda.columna
          });
        }
      }
    }
    
    return estado;
  }
}

export default Tablero;