/**
 * AnalizadorCeldas - Analiza el tablero y selecciona la mejor celda para la siguiente jugada
 */
class AnalizadorCeldas {
    /**
     * Constructor
     * @param {Object} tablero - Instancia del tablero de juego 
     * @param {Object} gestorBanderas - Gestor de banderas para colocar banderas seguras
     * @param {Object} motorProbabilidad - Motor de probabilidades para calcular riesgos
     * @param {Object} gestorMemoria - Gestor de memoria para aprendizaje
     */
    constructor(tablero, gestorBanderas, motorProbabilidad, gestorMemoria) {
      this.tablero = tablero;
      this.gestorBanderas = gestorBanderas;
      this.motorProbabilidad = motorProbabilidad;
      this.gestorMemoria = gestorMemoria;
      this.historialMovimientos = [];
      this.partidaIniciada = false;
      this.ultimoBordeAnalizado = -1;
    }
  
    /**
     * Selecciona la mejor celda para el siguiente movimiento
     * @param {boolean} esPrimerMovimiento - Si es el primer movimiento de la partida
     * @returns {Object} - Objeto con la celda seleccionada {fila, columna, razon}
     */
    seleccionarMejorCelda(esPrimerMovimiento = false) {
      // 1. Primer movimiento - Estrategia especial
      if (esPrimerMovimiento) {
        return this.seleccionarPrimeraCelda();
      }
  
      // 2. Verificar si hay banderas seguras para colocar
      const banderasSeguras = this.gestorBanderas.colocarBanderasSeguras();
      if (banderasSeguras.length > 0) {
        // Notificar que se han colocado banderas (sin retornar celda)
        return { 
          tipo: 'banderas',
          banderas: banderasSeguras,
          razon: `He identificado ${banderasSeguras.length} mina${banderasSeguras.length > 1 ? 's' : ''} con 100% de certeza`
        };
      }
  
      // 3. Actualizar mapa de probabilidades
      this.motorProbabilidad.calcularProbabilidades(this.gestorMemoria);
  
      // 4. Buscar celdas 100% seguras
      const celdasSeguras = this.tablero.obtenerCeldasConCertezaDeSeguridad();
      if (celdasSeguras.length > 0) {
        // Seleccionar la mejor celda segura (priorizar esquinas y bordes)
        const celdaElegida = this.elegirMejorCeldaSegura(celdasSeguras);
        return {
          fila: celdaElegida.fila,
          columna: celdaElegida.columna,
          tipo: 'segura',
          razon: 'Celda 100% segura'
        };
      }
  
      // 5. Segundo movimiento - Usar memoria si hay datos
      if (this.historialMovimientos.length === 1) {
        const mejorSegundoMovimiento = this.gestorMemoria.obtenerMejorSegundoMovimiento(
          this.historialMovimientos[0],
          this.tablero
        );
        
        if (mejorSegundoMovimiento && mejorSegundoMovimiento.confianza > 0.5 && mejorSegundoMovimiento.tasaExito > 0.6) {
          // Verificar que la celda no esté descubierta o con bandera
          const celda = this.tablero.obtenerCelda(mejorSegundoMovimiento.fila, mejorSegundoMovimiento.columna);
          if (celda && !celda.descubierta && !celda.tieneBandera) {
            return {
              fila: mejorSegundoMovimiento.fila,
              columna: mejorSegundoMovimiento.columna,
              tipo: 'memoria',
              razon: `Mejor segundo movimiento (${Math.round(mejorSegundoMovimiento.tasaExito * 100)}% éxito en partidas anteriores)`
            };
          }
        }
      }
  
      // 6. Seleccionar la celda más segura según probabilidades
      return this.seleccionarCeldaMasProbable();
    }
  
    /**
     * Selecciona la primera celda del juego - estrategia para el primer movimiento
     * @returns {Object} - Celda seleccionada {fila, columna, razon}
     */
    seleccionarPrimeraCelda() {
      this.partidaIniciada = true;
      
      // 1. Intentar usar memoria histórica si existe
      const mejorMovimientoInicial = this.gestorMemoria.obtenerMejorMovimientoInicial(this.tablero);
      
      if (mejorMovimientoInicial && mejorMovimientoInicial.tasaExito > 0.55) {
        // Usar el mejor movimiento inicial según la memoria
        return {
          fila: mejorMovimientoInicial.fila,
          columna: mejorMovimientoInicial.columna,
          tipo: 'memoria',
          razon: `Movimiento inicial con ${Math.round(mejorMovimientoInicial.tasaExito * 100)}% éxito en partidas anteriores`
        };
      }
      
      // 2. Sin datos de memoria suficientes, preferir esquinas y bordes
      
      // Lista de estrategias en orden de preferencia
      const estrategias = [
        // Esquinas (4 posiciones)
        () => this.seleccionarEsquinaAleatoria(),
        
        // Bordes (excepto esquinas)
        () => this.seleccionarBordeAleatorio(),
        
        // Celda aleatoria con cierta distancia del borde
        () => this.seleccionarCeldaInteriorAleatoria()
      ];
      
      // Intentar cada estrategia en orden
      for (const estrategia of estrategias) {
        const seleccion = estrategia();
        if (seleccion) {
          return seleccion;
        }
      }
      
      // Si todas fallan, seleccionar cualquier celda aleatoria
      return this.seleccionarCeldaCompletamenteAleatoria();
    }
  
    /**
     * Selecciona una esquina aleatoria
     * @returns {Object|null} - Celda seleccionada o null si no hay disponibles
     */
    seleccionarEsquinaAleatoria() {
      const esquinas = [
        { fila: 0, columna: 0 },
        { fila: 0, columna: this.tablero.columnas - 1 },
        { fila: this.tablero.filas - 1, columna: 0 },
        { fila: this.tablero.filas - 1, columna: this.tablero.columnas - 1 }
      ];
      
      // Filtrar esquinas disponibles (no descubiertas ni con bandera)
      const disponibles = esquinas.filter(pos => {
        const celda = this.tablero.obtenerCelda(pos.fila, pos.columna);
        return celda && !celda.descubierta && !celda.tieneBandera;
      });
      
      if (disponibles.length === 0) return null;
      
      // Seleccionar aleatoriamente
      const seleccion = disponibles[Math.floor(Math.random() * disponibles.length)];
      
      return {
        fila: seleccion.fila,
        columna: seleccion.columna,
        tipo: 'estrategia',
        razon: 'Estrategia inicial: esquina'
      };
    }
  
    /**
     * Selecciona un borde aleatorio (no esquina)
     * @returns {Object|null} - Celda seleccionada o null si no hay disponibles
     */
    seleccionarBordeAleatorio() {
      const bordes = [];
      
      // Alternar entre los diferentes bordes para variar la estrategia
      this.ultimoBordeAnalizado = (this.ultimoBordeAnalizado + 1) % 4;
      
      // Borde superior (excluye esquinas)
      if (this.ultimoBordeAnalizado === 0) {
        for (let col = 1; col < this.tablero.columnas - 1; col++) {
          bordes.push({ fila: 0, columna: col });
        }
      } 
      // Borde derecho (excluye esquinas)
      else if (this.ultimoBordeAnalizado === 1) {
        for (let fila = 1; fila < this.tablero.filas - 1; fila++) {
          bordes.push({ fila, columna: this.tablero.columnas - 1 });
        }
      }
      // Borde inferior (excluye esquinas) 
      else if (this.ultimoBordeAnalizado === 2) {
        for (let col = 1; col < this.tablero.columnas - 1; col++) {
          bordes.push({ fila: this.tablero.filas - 1, columna: col });
        }
      }
      // Borde izquierdo (excluye esquinas)
      else {
        for (let fila = 1; fila < this.tablero.filas - 1; fila++) {
          bordes.push({ fila, columna: 0 });
        }
      }
      
      // Filtrar disponibles
      const disponibles = bordes.filter(pos => {
        const celda = this.tablero.obtenerCelda(pos.fila, pos.columna);
        return celda && !celda.descubierta && !celda.tieneBandera;
      });
      
      if (disponibles.length === 0) return null;
      
      // Seleccionar aleatoriamente
      const seleccion = disponibles[Math.floor(Math.random() * disponibles.length)];
      
      return {
        fila: seleccion.fila,
        columna: seleccion.columna,
        tipo: 'estrategia',
        razon: 'Estrategia inicial: borde'
      };
    }
  
    /**
     * Selecciona una celda interior aleatoria (distancia 1 o 2 del borde)
     * @returns {Object|null} - Celda seleccionada o null si no hay disponibles
     */
    seleccionarCeldaInteriorAleatoria() {
      const interiores = [];
      
      // Seleccionar celdas a distancia 1-2 del borde
      for (let fila = 0; fila < this.tablero.filas; fila++) {
        for (let columna = 0; columna < this.tablero.columnas; columna++) {
          const celda = this.tablero.obtenerCelda(fila, columna);
          
          if (celda && celda.distanciaBorde >= 1 && celda.distanciaBorde <= 2 && 
              !celda.descubierta && !celda.tieneBandera) {
            interiores.push({ fila, columna });
          }
        }
      }
      
      if (interiores.length === 0) return null;
      
      // Seleccionar aleatoriamente
      const seleccion = interiores[Math.floor(Math.random() * interiores.length)];
      
      return {
        fila: seleccion.fila,
        columna: seleccion.columna,
        tipo: 'estrategia',
        razon: 'Estrategia inicial: interior cercano al borde'
      };
    }
  
    /**
     * Selecciona una celda completamente aleatoria
     * @returns {Object} - Celda seleccionada
     */
    seleccionarCeldaCompletamenteAleatoria() {
      const celdasDisponibles = [];
      
      for (let fila = 0; fila < this.tablero.filas; fila++) {
        for (let columna = 0; columna < this.tablero.columnas; columna++) {
          const celda = this.tablero.obtenerCelda(fila, columna);
          
          if (celda && !celda.descubierta && !celda.tieneBandera) {
            celdasDisponibles.push({ fila, columna });
          }
        }
      }
      
      if (celdasDisponibles.length === 0) {
        // No debería ocurrir, pero por seguridad
        return {
          fila: 0,
          columna: 0,
          tipo: 'error',
          razon: 'No hay celdas disponibles'
        };
      }
      
      // Seleccionar aleatoriamente
      const seleccion = celdasDisponibles[Math.floor(Math.random() * celdasDisponibles.length)];
      
      return {
        fila: seleccion.fila,
        columna: seleccion.columna,
        tipo: 'aleatorio',
        razon: 'Celda aleatoria'
      };
    }
  
    /**
     * Elige la mejor celda segura entre varias opciones
     * @param {Array} celdasSeguras - Lista de celdas seguras
     * @returns {Object} - La mejor celda segura
     */
    elegirMejorCeldaSegura(celdasSeguras) {
      // Si solo hay una, retornarla
      if (celdasSeguras.length === 1) {
        return celdasSeguras[0];
      }
      
      // Prioridades (de mayor a menor):
      // 1. Celdas en esquinas
      const esquinas = celdasSeguras.filter(c => c.esEsquina);
      if (esquinas.length > 0) {
        return esquinas[0];
      }
      
      // 2. Celdas en bordes
      const bordes = celdasSeguras.filter(c => c.esBorde);
      if (bordes.length > 0) {
        return bordes[0];
      }
      
      // 3. Celdas cercanas al último movimiento (continuidad)
      if (this.historialMovimientos.length > 0) {
        const ultimoMovimiento = this.historialMovimientos[this.historialMovimientos.length - 1];
        
        // Ordenar por cercanía al último movimiento
        const ordenadas = [...celdasSeguras].sort((a, b) => {
          const distA = this.calcularDistanciaManhattan(a, ultimoMovimiento);
          const distB = this.calcularDistanciaManhattan(b, ultimoMovimiento);
          return distA - distB;
        });
        
        return ordenadas[0];
      }
      
      // 4. Por defecto, la primera
      return celdasSeguras[0];
    }
  
    /**
     * Selecciona la celda más probable (menor probabilidad de mina)
     * @returns {Object} - Celda seleccionada
     */
    seleccionarCeldaMasProbable() {
      // Obtener todas las celdas sin revelar
      const celdasSinRevolar = this.tablero.obtenerCeldasSinRevolar()
        .filter(c => !c.tieneBandera);
      
      if (celdasSinRevolar.length === 0) {
        // No quedan celdas (debería ser victoria)
        return {
          tipo: 'error',
          razon: 'No quedan celdas sin revelar'
        };
      }
      
      // Clasificar celdas por niveles de seguridad
      const clasificadas = this.clasificarCeldasPorNiveles(celdasSinRevolar);
      
      // Seleccionar la celda más segura según la clasificación
      let celdaSeleccionada;
      let razonSeleccion;
      
      // Nivel 1: Celdas muy seguras (probabilidad < 0.1)
      if (clasificadas.muySeguras.length > 0) {
        celdaSeleccionada = this.elegirMejorCeldaEnCategoria(clasificadas.muySeguras);
        razonSeleccion = `Celda muy segura (${Math.round((1-celdaSeleccionada.probabilidades.probabilidadMina)*100)}% seguridad)`;
      }
      // Nivel 2: Celdas seguras (probabilidad < 0.2)
      else if (clasificadas.seguras.length > 0) {
        celdaSeleccionada = this.elegirMejorCeldaEnCategoria(clasificadas.seguras);
        razonSeleccion = `Celda relativamente segura (${Math.round((1-celdaSeleccionada.probabilidades.probabilidadMina)*100)}% seguridad)`;
      }
      // Nivel 3: Celdas de bajo riesgo (probabilidad < 0.3)
      else if (clasificadas.bajoRiesgo.length > 0) {
        celdaSeleccionada = this.elegirMejorCeldaEnCategoria(clasificadas.bajoRiesgo);
        razonSeleccion = `Celda de bajo riesgo (${Math.round((1-celdaSeleccionada.probabilidades.probabilidadMina)*100)}% seguridad)`;
      }
      // Nivel 4: Celdas de riesgo moderado (probabilidad < 0.5)
      else if (clasificadas.riesgoModerado.length > 0) {
        celdaSeleccionada = this.elegirMejorCeldaEnCategoria(clasificadas.riesgoModerado);
        razonSeleccion = `Celda de riesgo moderado (${Math.round((1-celdaSeleccionada.probabilidades.probabilidadMina)*100)}% seguridad)`;
      }
      // Nivel 5: Celdas de alto riesgo (todas las restantes)
      else {
        // Ordenar por menor probabilidad de mina
        const ordenadas = [...clasificadas.altoRiesgo].sort((a, b) => 
          a.probabilidades.probabilidadMina - b.probabilidades.probabilidadMina
        );
        
        celdaSeleccionada = ordenadas[0];
        razonSeleccion = `Celda menos arriesgada disponible (${Math.round((1-celdaSeleccionada.probabilidades.probabilidadMina)*100)}% seguridad)`;
      }
      
      return {
        fila: celdaSeleccionada.fila,
        columna: celdaSeleccionada.columna,
        tipo: 'probabilidad',
        razon: razonSeleccion,
        probabilidadMina: celdaSeleccionada.probabilidades.probabilidadMina,
        confianza: celdaSeleccionada.probabilidades.confianza
      };
    }
  
    /**
     * Clasifica celdas por niveles de seguridad
     * @param {Array} celdas - Lista de celdas a clasificar
     * @returns {Object} - Clasificación por niveles
     */
    clasificarCeldasPorNiveles(celdas) {
      const clasificacion = {
        muySeguras: [],      // < 0.1 probabilidad de mina
        seguras: [],         // < 0.2 probabilidad de mina
        bajoRiesgo: [],      // < 0.3 probabilidad de mina
        riesgoModerado: [],  // < 0.5 probabilidad de mina
        altoRiesgo: []       // >= 0.5 probabilidad de mina
      };
      
      celdas.forEach(celda => {
        const prob = celda.probabilidades.probabilidadMina;
        
        if (prob < 0.1) {
          clasificacion.muySeguras.push(celda);
        } else if (prob < 0.2) {
          clasificacion.seguras.push(celda);
        } else if (prob < 0.3) {
          clasificacion.bajoRiesgo.push(celda);
        } else if (prob < 0.5) {
          clasificacion.riesgoModerado.push(celda);
        } else {
          clasificacion.altoRiesgo.push(celda);
        }
      });
      
      return clasificacion;
    }
  
    /**
     * Elige la mejor celda dentro de una categoría
     * @param {Array} celdas - Lista de celdas de la categoría
     * @returns {Object} - Mejor celda
     */
    elegirMejorCeldaEnCategoria(celdas) {
      // Si solo hay una, retornarla
      if (celdas.length === 1) {
        return celdas[0];
      }
      
      // Ordenar por múltiples criterios
      const ordenadas = [...celdas].sort((a, b) => {
        // 1. Menor probabilidad de mina
        const diffProb = a.probabilidades.probabilidadMina - b.probabilidades.probabilidadMina;
        if (Math.abs(diffProb) > 0.05) return diffProb;
        
        // 2. Mayor confianza
        const diffConf = b.probabilidades.confianza - a.probabilidades.confianza;
        if (Math.abs(diffConf) > 0.1) return diffConf;
        
        // 3. Esquinas y bordes
        if (a.esEsquina && !b.esEsquina) return -1;
        if (!a.esEsquina && b.esEsquina) return 1;
        if (a.esBorde && !b.esBorde) return -1;
        if (!a.esBorde && b.esBorde) return 1;
        
        // 4. Cercanía al último movimiento (si existe)
        if (this.historialMovimientos.length > 0) {
          const ultimoMovimiento = this.historialMovimientos[this.historialMovimientos.length - 1];
          const distA = this.calcularDistanciaManhattan(a, ultimoMovimiento);
          const distB = this.calcularDistanciaManhattan(b, ultimoMovimiento);
          return distA - distB;
        }
        
        return 0;
      });
      
      // Aleatorizar entre los N mejores para evitar patrones predecibles
      const mejoresN = ordenadas.slice(0, Math.min(3, ordenadas.length));
      return mejoresN[Math.floor(Math.random() * mejoresN.length)];
    }
  
    /**
     * Registra un movimiento en el historial
     * @param {Object} movimiento - Datos del movimiento
     */
    registrarMovimiento(movimiento) {
      this.historialMovimientos.push(movimiento);
    }
  
    /**
     * Calcula la distancia Manhattan entre dos celdas
     * @param {Object} celda1 - Primera celda
     * @param {Object} celda2 - Segunda celda
     * @returns {number} - Distancia Manhattan
     */
    calcularDistanciaManhattan(celda1, celda2) {
      return Math.abs(celda1.fila - celda2.fila) + Math.abs(celda1.columna - celda2.columna);
    }
  
    /**
     * Obtiene el historial de movimientos
     * @returns {Array} - Historial de movimientos
     */
    obtenerHistorialMovimientos() {
      return this.historialMovimientos;
    }
  
    /**
     * Reinicia el historial de movimientos
     */
    reiniciarHistorial() {
      this.historialMovimientos = [];
      this.partidaIniciada = false;
    }
  }
  
  export default AnalizadorCeldas;