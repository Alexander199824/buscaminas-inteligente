/**
 * Clase Celda - Representa una celda individual del tablero de Buscaminas
 */
class Celda {
    /**
     * Constructor de la celda
     * @param {number} fila - Coordenada fila
     * @param {number} columna - Coordenada columna
     */
    constructor(fila, columna) {
      // Coordenadas
      this.fila = fila;
      this.columna = columna;
      
      // Estados básicos
      this.descubierta = false;    // Si la celda ha sido descubierta
      this.tieneBandera = false;   // Si tiene una bandera colocada
      this.valor = null;           // Valor de la celda ('', '0', '1'...'8', 'M')
      
      // Restricciones numéricas que afectan a esta celda
      this.restricciones = [];
      
      // Mapa mental del sistema
      this.probabilidades = {
        probabilidadMina: 0.5,     // Probabilidad de contener mina (0-1)
        probabilidadSegura: 0.5,   // Probabilidad de ser segura (0-1)
        confianza: 0,              // Nivel de confianza (0-1)
        origen: 'inicial',         // Origen del cálculo de probabilidad
        calculosAnteriores: []     // Historial de cálculos para aprendizaje
      };
      
      // Datos de análisis
      this.analizada = false;      // Si la celda ha sido analizada en esta iteración
      this.iteracionAnalisis = 0;  // Número de veces que ha sido analizada
      this.esEsquina = false;      // Si es una celda de esquina
      this.esBorde = false;        // Si es una celda de borde
      this.distanciaBorde = 0;     // Distancia al borde más cercano
    }
  
    /**
     * Actualiza el valor de la celda al ser descubierta
     * @param {string} valor - Valor de la celda ('', '0', '1'...'8', 'M')
     */
    establecerValor(valor) {
      this.valor = valor;
      this.descubierta = true;
      
      // Actualizar probabilidades
      if (valor === 'M') {
        this.probabilidades.probabilidadMina = 1;
        this.probabilidades.probabilidadSegura = 0;
      } else {
        this.probabilidades.probabilidadMina = 0;
        this.probabilidades.probabilidadSegura = 1;
      }
      this.probabilidades.confianza = 1;
      this.probabilidades.origen = 'revelada';
    }
  
    /**
     * Coloca o quita una bandera
     * @param {boolean} tieneBandera - Si debe tener bandera o no
     */
    establecerBandera(tieneBandera) {
      this.tieneBandera = tieneBandera;
      
      // Actualizar probabilidades
      if (tieneBandera) {
        this.probabilidades.probabilidadMina = 1;
        this.probabilidades.probabilidadSegura = 0;
      }
      this.probabilidades.confianza = tieneBandera ? 1 : this.probabilidades.confianza;
      this.probabilidades.origen = tieneBandera ? 'bandera' : this.probabilidades.origen;
    }
  
    /**
     * Agrega una restricción numérica a la celda
     * @param {Object} restriccion - Objeto con la restricción
     */
    agregarRestriccion(restriccion) {
      // Evitar duplicados
      const existeRestriccion = this.restricciones.some(r => 
        r.celdaOrigen.fila === restriccion.celdaOrigen.fila && 
        r.celdaOrigen.columna === restriccion.celdaOrigen.columna
      );
      
      if (!existeRestriccion) {
        this.restricciones.push(restriccion);
      }
    }
  
    /**
     * Actualiza las probabilidades de la celda
     * @param {number} probMina - Probabilidad de mina (0-1)
     * @param {number} confianza - Nivel de confianza (0-1)
     * @param {string} origen - Origen del cálculo
     */
    actualizarProbabilidades(probMina, confianza, origen) {
      // Solo actualizar si la nueva confianza es mayor o es una fuente más fiable
      if (confianza > this.probabilidades.confianza || 
         (confianza === this.probabilidades.confianza && esOrigenMasConfiable(origen, this.probabilidades.origen))) {
        
        // Guardar cálculo anterior para aprendizaje
        this.probabilidades.calculosAnteriores.push({
          probabilidadMina: this.probabilidades.probabilidadMina,
          probabilidadSegura: this.probabilidades.probabilidadSegura,
          confianza: this.probabilidades.confianza,
          origen: this.probabilidades.origen
        });
        
        // Limitar historial a 5 entradas
        if (this.probabilidades.calculosAnteriores.length > 5) {
          this.probabilidades.calculosAnteriores.shift();
        }
        
        // Actualizar probabilidades
        this.probabilidades.probabilidadMina = probMina;
        this.probabilidades.probabilidadSegura = 1 - probMina;
        this.probabilidades.confianza = confianza;
        this.probabilidades.origen = origen;
      }
    }
  
    /**
     * Verifica si la celda tiene valor numérico
     * @returns {boolean} - true si tiene un valor numérico
     */
    tieneValorNumerico() {
      return this.descubierta && this.valor !== null && this.valor !== '' && 
             this.valor !== 'M' && !isNaN(this.valor);
    }
  
    /**
     * Obtiene el valor numérico de la celda
     * @returns {number|null} - Valor numérico o null si no aplica
     */
    obtenerValorNumerico() {
      if (this.valor === '') return 0;
      if (this.valor === '0') return 0;
      if (this.tieneValorNumerico()) return parseInt(this.valor);
      return null;
    }
  
    /**
     * Verifica si la celda es segura con 100% de certeza
     * @returns {boolean} - true si es 100% segura
     */
    es100PorCientoSegura() {
      return this.probabilidades.probabilidadSegura === 1 && this.probabilidades.confianza === 1;
    }
  
    /**
     * Verifica si la celda tiene mina con 100% de certeza
     * @returns {boolean} - true si tiene mina con 100% de certeza
     */
    es100PorCientoMina() {
      return this.probabilidades.probabilidadMina === 1 && this.probabilidades.confianza === 1;
    }
  
    /**
     * Obtiene una representación de texto de la celda para depuración
     * @returns {string} - Representación de texto
     */
    toString() {
      if (this.tieneBandera) return 'F';
      if (!this.descubierta) return '?';
      if (this.valor === 'M') return 'M';
      if (this.valor === '') return ' ';
      return this.valor;
    }
  }
  
  /**
   * Determina si un origen de probabilidad es más confiable que otro
   * @param {string} origenNuevo - Nuevo origen
   * @param {string} origenActual - Origen actual
   * @returns {boolean} - true si el nuevo origen es más confiable
   */
  function esOrigenMasConfiable(origenNuevo, origenActual) {
    const jerarquia = {
      'revelada': 10,      // Celda revelada (certeza absoluta)
      'bandera': 9,        // Celda con bandera (certeza alta)
      'analisis100': 8,    // Análisis con 100% de certeza
      'restricciones': 7,  // Análisis de restricciones
      'patron': 6,         // Patrón reconocido (1-2-1, etc.)
      'subconjunto': 5,    // Análisis de subconjuntos
      'probabilidad': 4,   // Cálculo de probabilidad
      'memoria': 3,        // Basado en memoria histórica
      'estrategia': 2,     // Estrategia general
      'inicial': 1         // Valor inicial
    };
  
    return (jerarquia[origenNuevo] || 0) > (jerarquia[origenActual] || 0);
  }
  
  export default Celda;