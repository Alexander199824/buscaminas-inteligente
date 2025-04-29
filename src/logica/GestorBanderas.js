/**
 * GestorBanderas - Maneja la lógica de colocación de banderas con 100% de certeza
 */
class GestorBanderas {
    /**
     * Constructor
     * @param {Object} tablero - Instancia del tablero de juego
     */
    constructor(tablero) {
      this.tablero = tablero;
      this.banderasColocadas = [];
      this.ultimaIteracion = 0;
    }
  
    /**
     * Busca y coloca banderas donde haya 100% de certeza de minas
     * @returns {Array} - Lista de celdas donde se colocaron banderas
     */
    colocarBanderasSeguras() {
      // Asegurar que las restricciones estén actualizadas
      this.tablero.actualizarRestricciones();
      this.banderasColocadas = [];
      this.ultimaIteracion++;
  
      // Primero: Análisis simple de restricciones
      this.analizarRestriccionesBasicas();
      
      // Segundo: Análisis de subconjuntos
      this.analizarSubconjuntos();
      
      // Tercero: Análisis de patrones comunes
      this.analizarPatrones();
      
      // Cuarto: Análisis de sistemas de ecuaciones
      this.analizarSistemasEcuaciones();
      
      // Verificación final de consistencia global
      this.validarConsistenciaGlobal();
      
      return this.banderasColocadas;
    }
  
    /**
     * Análisis básico: Si todas las minas faltantes de una restricción 
     * tienen que ir en las celdas restantes, todas son minas
     */
    analizarRestriccionesBasicas() {
      // Obtener todas las celdas numéricas
      const celdasNumericas = this.tablero.obtenerCeldasNumericas();
      
      for (const celdaNumerica of celdasNumericas) {
        // Obtener restricciones de esta celda
        const valor = celdaNumerica.obtenerValorNumerico();
        const celdasAdyacentes = this.tablero.obtenerCeldasAdyacentes(celdaNumerica.fila, celdaNumerica.columna);
        
        // Celdas sin revelar y sin bandera
        const celdasSinRevolarSinBandera = celdasAdyacentes.filter(c => 
          !c.descubierta && !c.tieneBandera
        );
        
        // Banderas ya colocadas
        const banderasColocadas = celdasAdyacentes.filter(c => c.tieneBandera).length;
        
        // Minas faltantes
        const minasFaltantes = valor - banderasColocadas;
        
        // Si el número de celdas sin revelar es igual a las minas faltantes,
        // todas tienen minas
        if (celdasSinRevolarSinBandera.length === minasFaltantes && minasFaltantes > 0) {
          celdasSinRevolarSinBandera.forEach(celda => {
            // Solo si es seguro colocar bandera
            if (this.esSeguroColocarBandera(celda, 'restriccion_basica')) {
              celda.actualizarProbabilidades(1, 1, 'analisis100');
              this.marcarParaBandera(celda, `análisis básico de celda (${celdaNumerica.fila+1},${celdaNumerica.columna+1})`);
            }
          });
        }
      }
    }
  
    /**
     * Análisis de subconjuntos: Si una restricción es subconjunto de otra,
     * la diferencia entre ellas tiene información útil
     */
    analizarSubconjuntos() {
      // Obtener todas las celdas numéricas
      const celdasNumericas = this.tablero.obtenerCeldasNumericas();
      
      // Crear pares de restricciones para analizar
      for (let i = 0; i < celdasNumericas.length; i++) {
        const celdaA = celdasNumericas[i];
        
        for (let j = 0; j < celdasNumericas.length; j++) {
          // No comparar consigo misma
          if (i === j) continue;
          
          const celdaB = celdasNumericas[j];
          
          // Obtener las celdas adyacentes sin revelar de cada restricción
          const adyacentesA = this.tablero.obtenerCeldasAdyacentes(celdaA.fila, celdaA.columna)
            .filter(c => !c.descubierta);
          
          const adyacentesB = this.tablero.obtenerCeldasAdyacentes(celdaB.fila, celdaB.columna)
            .filter(c => !c.descubierta);
          
          // Verificar si hay una relación de subconjunto
          if (this.esSubconjunto(adyacentesA, adyacentesB)) {
            // A es subconjunto de B
            this.aplicarAnalisisSubconjunto(celdaA, celdaB, adyacentesA, adyacentesB);
          } else if (this.esSubconjunto(adyacentesB, adyacentesA)) {
            // B es subconjunto de A
            this.aplicarAnalisisSubconjunto(celdaB, celdaA, adyacentesB, adyacentesA);
          }
          
          // Analizar también intersecciones parciales
          this.analizarInterseccionParcial(celdaA, celdaB, adyacentesA, adyacentesB);
        }
      }
    }
  
    /**
     * Verifica si conjuntoA es subconjunto de conjuntoB
     * @param {Array} conjuntoA - Primer conjunto de celdas
     * @param {Array} conjuntoB - Segundo conjunto de celdas
     * @returns {boolean} - true si conjuntoA es subconjunto de conjuntoB
     */
    esSubconjunto(conjuntoA, conjuntoB) {
      if (conjuntoA.length > conjuntoB.length) {
        return false;
      }
      
      // Verificar si cada elemento de conjuntoA está en conjuntoB
      return conjuntoA.every(celdaA => 
        conjuntoB.some(celdaB => celdaA.fila === celdaB.fila && celdaA.columna === celdaB.columna)
      );
    }
  
    /**
     * Aplica el análisis de subconjuntos para encontrar minas
     * @param {Celda} celdaSubconjunto - Celda del subconjunto
     * @param {Celda} celdaSuperconjunto - Celda del superconjunto
     * @param {Array} adyacentesSubconjunto - Celdas adyacentes sin revelar del subconjunto
     * @param {Array} adyacentesSuperconjunto - Celdas adyacentes sin revelar del superconjunto
     */
    aplicarAnalisisSubconjunto(celdaSubconjunto, celdaSuperconjunto, adyacentesSubconjunto, adyacentesSuperconjunto) {
      // Contar banderas en cada conjunto
      const banderasSubconjunto = adyacentesSubconjunto.filter(c => c.tieneBandera).length;
      const banderasSuperconjunto = adyacentesSuperconjunto.filter(c => c.tieneBandera).length;
      
      // Calcular minas faltantes
      const valorSubconjunto = celdaSubconjunto.obtenerValorNumerico();
      const valorSuperconjunto = celdaSuperconjunto.obtenerValorNumerico();
      
      const minasFaltantesSubconjunto = valorSubconjunto - banderasSubconjunto;
      const minasFaltantesSuperconjunto = valorSuperconjunto - banderasSuperconjunto;
      
      // Calcular la diferencia de conjuntos (celdas en superconjunto pero no en subconjunto)
      const celdasDiferencia = adyacentesSuperconjunto.filter(celdaSuper => 
        !adyacentesSubconjunto.some(celdaSub => 
          celdaSub.fila === celdaSuper.fila && celdaSub.columna === celdaSuper.columna
        )
      );
      
      // Calcular minas en la diferencia
      const minasDiferencia = minasFaltantesSuperconjunto - minasFaltantesSubconjunto;
      
      // Si todas las celdas de la diferencia tienen minas
      if (celdasDiferencia.length === minasDiferencia && minasDiferencia > 0) {
        celdasDiferencia.forEach(celda => {
          if (!celda.tieneBandera && !celda.descubierta) {
            // Solo si es seguro colocar bandera
            if (this.esSeguroColocarBandera(celda, 'subconjunto')) {
              celda.actualizarProbabilidades(1, 1, 'analisis100');
              this.marcarParaBandera(celda, `análisis de subconjunto (${celdaSubconjunto.fila+1},${celdaSubconjunto.columna+1}-${celdaSuperconjunto.fila+1},${celdaSuperconjunto.columna+1})`);
            }
          }
        });
      }
    }
  
    /**
     * Analiza intersección parcial entre dos conjuntos de celdas
     * @param {Celda} celdaA - Primera celda 
     * @param {Celda} celdaB - Segunda celda
     * @param {Array} adyacentesA - Celdas adyacentes sin revelar de A
     * @param {Array} adyacentesB - Celdas adyacentes sin revelar de B
     */
    analizarInterseccionParcial(celdaA, celdaB, adyacentesA, adyacentesB) {
      // Calcular intersección
      const celdasInterseccion = adyacentesA.filter(celdaA => 
        adyacentesB.some(celdaB => celdaA.fila === celdaB.fila && celdaA.columna === celdaB.columna)
      );
      
      // Solo procesar si hay intersección parcial
      if (celdasInterseccion.length > 0 && 
          celdasInterseccion.length < adyacentesA.length && 
          celdasInterseccion.length < adyacentesB.length) {
        
        // Contar banderas en cada conjunto
        const banderasA = adyacentesA.filter(c => c.tieneBandera).length;
        const banderasB = adyacentesB.filter(c => c.tieneBandera).length;
        const banderasInterseccion = celdasInterseccion.filter(c => c.tieneBandera).length;
        
        // Calcular minas faltantes
        const valorA = celdaA.obtenerValorNumerico();
        const valorB = celdaB.obtenerValorNumerico();
        
        const minasFaltantesA = valorA - banderasA;
        const minasFaltantesB = valorB - banderasB;
        
        // Celdas exclusivas de cada conjunto
        const celdasSoloA = adyacentesA.filter(celdaA => 
          !celdasInterseccion.some(celdaInt => celdaA.fila === celdaInt.fila && celdaA.columna === celdaInt.columna)
        );
        
        const celdasSoloB = adyacentesB.filter(celdaB => 
          !celdasInterseccion.some(celdaInt => celdaB.fila === celdaInt.fila && celdaB.columna === celdaInt.columna)
        );
        
        // Caso 1: Si todas las minas de A deben estar en la intersección
        if (minasFaltantesA <= celdasInterseccion.length - banderasInterseccion && 
            celdasSoloA.length > 0) {
          
          celdasSoloA.forEach(celda => {
            if (!celda.descubierta && !celda.tieneBandera) {
              celda.actualizarProbabilidades(0, 1, 'analisis100');
            }
          });
        }
        
        // Caso 2: Si todas las minas de B deben estar en la intersección
        if (minasFaltantesB <= celdasInterseccion.length - banderasInterseccion && 
            celdasSoloB.length > 0) {
          
          celdasSoloB.forEach(celda => {
            if (!celda.descubierta && !celda.tieneBandera) {
              celda.actualizarProbabilidades(0, 1, 'analisis100');
            }
          });
        }
        
        // Calcular límites de minas en la intersección
        const minasMaxInterseccion = Math.min(minasFaltantesA, minasFaltantesB);
        const minasMinA = Math.max(0, minasFaltantesA - celdasSoloA.length);
        const minasMinB = Math.max(0, minasFaltantesB - celdasSoloB.length);
        const minasMinInterseccion = Math.max(minasMinA, minasMinB);
        
        // Si sabemos exactamente el número de minas en la intersección
        if (minasMinInterseccion === minasMaxInterseccion && minasMinInterseccion === celdasInterseccion.length - banderasInterseccion) {
          celdasInterseccion.forEach(celda => {
            if (!celda.descubierta && !celda.tieneBandera) {
              // Solo si es seguro colocar bandera
              if (this.esSeguroColocarBandera(celda, 'interseccion')) {
                celda.actualizarProbabilidades(1, 1, 'analisis100');
                this.marcarParaBandera(celda, `análisis de intersección (${celdaA.fila+1},${celdaA.columna+1}-${celdaB.fila+1},${celdaB.columna+1})`);
              }
            }
          });
        }
      }
    }
  
    /**
     * Analiza patrones conocidos como 1-2-1 para detectar minas
     */
    analizarPatrones() {
      // Patrones a buscar:
      // 1. Patrón 1-2-1 (horizontal y vertical)
      this.buscarPatron121();
      
      // 2. Patrón 1-1 con esquina común
      this.buscarPatron11Esquina();
      
      // 3. Patrón borde (1 en borde con restricción)
      this.buscarPatronBorde();
    }
  
    /**
     * Busca el patrón 1-2-1 en el tablero
     */
    buscarPatron121() {
      // Direcciones a verificar (horizontal y vertical)
      const direcciones = [
        { dx: 1, dy: 0 }, // horizontal
        { dx: 0, dy: 1 }  // vertical
      ];
      
      for (let fila = 0; fila < this.tablero.filas; fila++) {
        for (let columna = 0; columna < this.tablero.columnas; columna++) {
          // Para cada dirección
          direcciones.forEach(({ dx, dy }) => {
            // Verificar si hay espacio suficiente
            if (fila + 2*dy < this.tablero.filas && columna + 2*dx < this.tablero.columnas) {
              // Obtener las tres celdas del patrón
              const celda1 = this.tablero.obtenerCelda(fila, columna);
              const celda2 = this.tablero.obtenerCelda(fila + dy, columna + dx);
              const celda3 = this.tablero.obtenerCelda(fila + 2*dy, columna + 2*dx);
              
              // Verificar si es un patrón 1-2-1
              if (celda1.tieneValorNumerico() && celda1.obtenerValorNumerico() === 1 &&
                  celda2.tieneValorNumerico() && celda2.obtenerValorNumerico() === 2 &&
                  celda3.tieneValorNumerico() && celda3.obtenerValorNumerico() === 1) {
                
                // Obtener celdas adyacentes
                const adyacentes1 = this.tablero.obtenerCeldasAdyacentes(celda1.fila, celda1.columna);
                const adyacentes2 = this.tablero.obtenerCeldasAdyacentes(celda2.fila, celda2.columna);
                const adyacentes3 = this.tablero.obtenerCeldasAdyacentes(celda3.fila, celda3.columna);
                
                // Celdas que son adyacentes solo al 2
                const celdasSoloDel2 = adyacentes2.filter(celda => 
                  !adyacentes1.some(c => c.fila === celda.fila && c.columna === celda.columna) &&
                  !adyacentes3.some(c => c.fila === celda.fila && c.columna === celda.columna) &&
                  !celda.descubierta
                );
                
                // Si hay exactamente 2 celdas adyacentes solo al 2, ambas son minas
                if (celdasSoloDel2.length === 2) {
                  celdasSoloDel2.forEach(celda => {
                    if (!celda.tieneBandera) {
                      // Solo si es seguro colocar bandera
                      if (this.esSeguroColocarBandera(celda, 'patron_121')) {
                        celda.actualizarProbabilidades(1, 1, 'patron');
                        this.marcarParaBandera(celda, `patrón 1-2-1 (${celda2.fila+1},${celda2.columna+1})`);
                      }
                    }
                  });
                }
              }
            }
          });
        }
      }
    }
  
    /**
     * Busca el patrón 1-1 con esquina común
     */
    buscarPatron11Esquina() {
      // Verificar las cuatro posibles esquinas
      const esquinas = [
        { dx1: 0, dy1: -1, dx2: -1, dy2: 0 }, // Esquina superior izquierda
        { dx1: 0, dy1: -1, dx2: 1, dy2: 0 },  // Esquina superior derecha
        { dx1: 0, dy1: 1, dx2: -1, dy2: 0 },  // Esquina inferior izquierda
        { dx1: 0, dy1: 1, dx2: 1, dy2: 0 }    // Esquina inferior derecha
      ];
      
      for (let fila = 0; fila < this.tablero.filas; fila++) {
        for (let columna = 0; columna < this.tablero.columnas; columna++) {
          // Para cada esquina
          esquinas.forEach(({ dx1, dy1, dx2, dy2 }) => {
            // Verificar si hay espacio suficiente
            if (fila + dy1 >= 0 && fila + dy1 < this.tablero.filas &&
                columna + dx1 >= 0 && columna + dx1 < this.tablero.columnas &&
                fila + dy2 >= 0 && fila + dy2 < this.tablero.filas &&
                columna + dx2 >= 0 && columna + dx2 < this.tablero.columnas) {
              
              // Obtener las tres celdas del patrón
              const celdaCentral = this.tablero.obtenerCelda(fila, columna);
              const celda1 = this.tablero.obtenerCelda(fila + dy1, columna + dx1);
              const celda2 = this.tablero.obtenerCelda(fila + dy2, columna + dx2);
              
              // Verificar si las celdas 1 y 2 tienen valor 1
              if (celda1.tieneValorNumerico() && celda1.obtenerValorNumerico() === 1 &&
                  celda2.tieneValorNumerico() && celda2.obtenerValorNumerico() === 1 &&
                  !celdaCentral.descubierta && !celdaCentral.tieneBandera) {
                
                // Obtener celdas adyacentes
                const adyacentes1 = this.tablero.obtenerCeldasAdyacentes(celda1.fila, celda1.columna)
                  .filter(c => !c.descubierta && !c.tieneBandera);
                
                const adyacentes2 = this.tablero.obtenerCeldasAdyacentes(celda2.fila, celda2.columna)
                  .filter(c => !c.descubierta && !c.tieneBandera);
                
                // Verificar si solo queda la celda central sin descubrir
                if (adyacentes1.length === 1 && adyacentes2.length === 1 &&
                    adyacentes1[0].fila === celdaCentral.fila && adyacentes1[0].columna === celdaCentral.columna &&
                    adyacentes2[0].fila === celdaCentral.fila && adyacentes2[0].columna === celdaCentral.columna) {
                  
                  // La celda central debe ser mina
                  if (this.esSeguroColocarBandera(celdaCentral, 'patron_11_esquina')) {
                    celdaCentral.actualizarProbabilidades(1, 1, 'patron');
                    this.marcarParaBandera(celdaCentral, `patrón 1-1 esquina (${celda1.fila+1},${celda1.columna+1}-${celda2.fila+1},${celda2.columna+1})`);
                  }
                }
              }
            }
          });
        }
      }
    }
  
    /**
     * Busca el patrón de borde (1 en borde)
     */
    buscarPatronBorde() {
      // Patrones de borde con 1 en el borde
      for (let fila = 0; fila < this.tablero.filas; fila++) {
        for (let columna = 0; columna < this.tablero.columnas; columna++) {
          const celda = this.tablero.obtenerCelda(fila, columna);
          
          // Solo procesar celdas de borde con valor 1
          if (celda.esBorde && celda.tieneValorNumerico() && celda.obtenerValorNumerico() === 1) {
            // Obtener celdas adyacentes sin descubrir
            const adyacentesSinDescubrir = this.tablero.obtenerCeldasAdyacentes(fila, columna)
              .filter(c => !c.descubierta && !c.tieneBandera);
            
            // Si solo queda una celda adyacente sin descubrir, debe ser mina
            if (adyacentesSinDescubrir.length === 1) {
              const celdaMina = adyacentesSinDescubrir[0];
              if (this.esSeguroColocarBandera(celdaMina, 'patron_borde')) {
                celdaMina.actualizarProbabilidades(1, 1, 'patron');
                this.marcarParaBandera(celdaMina, `patrón borde (${celda.fila+1},${celda.columna+1})`);
              }
            }
          }
        }
      }
    }
  
    /**
     * Analiza sistemas de ecuaciones para identificar minas
     */
    analizarSistemasEcuaciones() {
      // Agrupar restricciones por celdas comunes
      const grupos = this.agruparRestriccionesPorCeldasComunes();
      
      // Para cada grupo, intentar resolver el sistema
      grupos.forEach(grupo => {
        if (grupo.celdas.length >= 2) { // Al menos 2 restricciones
          const resultado = this.resolverSistemaEcuaciones(grupo);
          
          if (resultado) {
            // Procesar resultado
            for (let i = 0; i < resultado.soluciones.length; i++) {
              const valor = resultado.soluciones[i];
              const celda = resultado.celdas[i];
              
              // Si el valor es 1 (o muy cercano), es mina
              if (valor >= 0.99 && !celda.tieneBandera && !celda.descubierta) {
                if (this.esSeguroColocarBandera(celda, 'sistema_ecuaciones')) {
                  celda.actualizarProbabilidades(1, 1, 'analisis100');
                  this.marcarParaBandera(celda, `sistema de ecuaciones`);
                }
              }
            }
          }
        }
      });
    }
  
    /**
     * Agrupa restricciones que comparten celdas comunes
     * @returns {Array} - Grupos de restricciones relacionadas
     */
    agruparRestriccionesPorCeldasComunes() {
      const celdasNumericas = this.tablero.obtenerCeldasNumericas();
      const grupos = [];
      
      // Crear mapa de restricciones por celda
      const mapaCeldas = {};
      
      for (const celdaNumerica of celdasNumericas) {
        // Obtener celdas adyacentes sin revelar
        const adyacentes = this.tablero.obtenerCeldasAdyacentes(celdaNumerica.fila, celdaNumerica.columna)
          .filter(c => !c.descubierta);
        
        // Si hay celdas sin revelar, agregar restricción
        if (adyacentes.length > 0) {
          const restriccion = {
            celda: celdaNumerica,
            valor: celdaNumerica.obtenerValorNumerico(),
            celdas: adyacentes
          };
          
          // Agregar a mapa por cada celda afectada
          adyacentes.forEach(celda => {
            const clave = `${celda.fila},${celda.columna}`;
            if (!mapaCeldas[clave]) {
              mapaCeldas[clave] = [];
            }
            mapaCeldas[clave].push(restriccion);
          });
        }
      }
      
      // Encontrar grupos conectados
      const restriccionesProcesadas = new Set();
      
      for (const celdaNumerica of celdasNumericas) {
        const claveRestriccion = `${celdaNumerica.fila},${celdaNumerica.columna}`;
        
        // Si ya está procesada, continuar
        if (restriccionesProcesadas.has(claveRestriccion)) continue;
        
        // Obtener grupo relacionado
        const grupo = this.obtenerGrupoConectado(celdaNumerica, mapaCeldas, restriccionesProcesadas);
        
        // Si hay al menos 2 restricciones, guardar grupo
        if (grupo.restricciones.length >= 2) {
          grupos.push({
            restricciones: grupo.restricciones,
            celdas: grupo.celdas
          });
        }
      }
      
      return grupos;
    }
  
    /**
     * Obtiene grupo de restricciones conectadas
     * @param {Celda} celdaInicio - Celda numérica de inicio
     * @param {Object} mapaCeldas - Mapa de restricciones por celda
     * @param {Set} restriccionesProcesadas - Conjunto de restricciones ya procesadas
     * @returns {Object} - Grupo de restricciones y celdas
     */
    obtenerGrupoConectado(celdaInicio, mapaCeldas, restriccionesProcesadas) {
      const grupo = {
        restricciones: [],
        celdas: []
      };
      
      const colaRestricciones = [celdaInicio];
      const celdasEnGrupo = new Set();
      
      while (colaRestricciones.length > 0) {
        const celdaRestriccion = colaRestricciones.shift();
        const claveRestriccion = `${celdaRestriccion.fila},${celdaRestriccion.columna}`;
        
        // Si ya está procesada, continuar
        if (restriccionesProcesadas.has(claveRestriccion)) continue;
        
        // Marcar como procesada
        restriccionesProcesadas.add(claveRestriccion);
        
        // Agregar restricción al grupo
        grupo.restricciones.push({
          celda: celdaRestriccion,
          valor: celdaRestriccion.obtenerValorNumerico()
        });
        
        // Obtener celdas adyacentes sin revelar
        const adyacentes = this.tablero.obtenerCeldasAdyacentes(celdaRestriccion.fila, celdaRestriccion.columna)
          .filter(c => !c.descubierta);
        
        // Procesar cada celda
        adyacentes.forEach(celda => {
          const claveCelda = `${celda.fila},${celda.columna}`;
          
          // Si no está en el grupo, agregarla
          if (!celdasEnGrupo.has(claveCelda)) {
            celdasEnGrupo.add(claveCelda);
            grupo.celdas.push(celda);
            
            // Buscar otras restricciones relacionadas
            if (mapaCeldas[claveCelda]) {
              mapaCeldas[claveCelda].forEach(restriccion => {
                // Agregar restricción a la cola si no está procesada
                if (!restriccionesProcesadas.has(`${restriccion.celda.fila},${restriccion.celda.columna}`)) {
                  colaRestricciones.push(restriccion.celda);
                }
              });
            }
          }
        });
      }
      
      return grupo;
    }
  
    /**
     * Resuelve un sistema de ecuaciones para identificar minas
     * @param {Object} grupo - Grupo de restricciones
     * @returns {Object|null} - Resultado con soluciones o null si no es posible resolver
     */
    resolverSistemaEcuaciones(grupo) {
      const { restricciones, celdas } = grupo;
      
      // Crear matriz de coeficientes y vector de valores
      const matriz = [];
      const valores = [];
      
      // Mapeo de celdas a índices
      const indiceCeldas = {};
      celdas.forEach((celda, indice) => {
        indiceCeldas[`${celda.fila},${celda.columna}`] = indice;
      });
      
      // Llenar matriz y vector
      restricciones.forEach(restriccion => {
        const fila = Array(celdas.length).fill(0);
        
        // Obtener celdas adyacentes sin revelar
        const adyacentes = this.tablero.obtenerCeldasAdyacentes(restriccion.celda.fila, restriccion.celda.columna)
          .filter(c => !c.descubierta);
        
        // Poner 1 en las celdas afectadas
        adyacentes.forEach(celda => {
          const indice = indiceCeldas[`${celda.fila},${celda.columna}`];
          if (indice !== undefined) {
            fila[indice] = 1;
          }
        });
        
        // Calcular valor efectivo (descontando banderas ya colocadas)
        const banderasColocadas = this.tablero.obtenerCeldasAdyacentes(restriccion.celda.fila, restriccion.celda.columna)
          .filter(c => c.tieneBandera).length;
        
        const valorEfectivo = restriccion.valor - banderasColocadas;
        
        matriz.push(fila);
        valores.push(valorEfectivo);
      });
      
      // Resolver sistema
      try {
        const soluciones = this.eliminarGaussiana(matriz, valores);
        
        if (soluciones) {
          return {
            soluciones,
            celdas
          };
        }
      } catch (error) {
        console.error("Error al resolver sistema de ecuaciones:", error);
      }
      
      return null;
    }
  
    /**
     * Resuelve un sistema de ecuaciones mediante eliminación gaussiana
     * @param {Array} matriz - Matriz de coeficientes
     * @param {Array} vector - Vector de valores
     * @returns {Array|null} - Vector de soluciones o null si no hay solución única
     */
    eliminarGaussiana(matriz, vector) {
      const n = matriz.length; // Número de ecuaciones
      const m = matriz[0].length; // Número de incógnitas
      
      // Si hay más incógnitas que ecuaciones, no hay solución única
      if (m > n) return null;
      
      // Crear matriz aumentada
      const matrizAumentada = matriz.map((fila, i) => [...fila, vector[i]]);
      
      // Eliminación hacia adelante
      for (let i = 0; i < n; i++) {
        // Buscar pivote no nulo
        let maxFila = i;
        for (let j = i + 1; j < n; j++) {
          if (Math.abs(matrizAumentada[j][i]) > Math.abs(matrizAumentada[maxFila][i])) {
            maxFila = j;
          }
        }
        
        // Intercambiar filas
        if (maxFila !== i) {
          [matrizAumentada[i], matrizAumentada[maxFila]] = [matrizAumentada[maxFila], matrizAumentada[i]];
        }
        
        // Si el pivote es cero, continuar con la siguiente fila
        if (Math.abs(matrizAumentada[i][i]) < 1e-10) continue;
        
        // Normalizar fila
        const pivote = matrizAumentada[i][i];
        for (let j = i; j <= m; j++) {
          matrizAumentada[i][j] /= pivote;
        }
        
        // Eliminar términos en otras filas
        for (let j = 0; j < n; j++) {
          if (j !== i) {
            const factor = matrizAumentada[j][i];
            for (let k = i; k <= m; k++) {
              matrizAumentada[j][k] -= factor * matrizAumentada[i][k];
            }
          }
        }
      }
      
      // Extraer soluciones
      const soluciones = Array(m).fill(0);
      for (let i = 0; i < n; i++) {
        let sum = matrizAumentada[i][m];
        for (let j = 0; j < m; j++) {
          if (i !== j && Math.abs(matrizAumentada[i][j]) > 1e-10) {
            sum -= matrizAumentada[i][j] * soluciones[j];
          }
        }
        if (Math.abs(matrizAumentada[i][i]) > 1e-10) {
          soluciones[i] = sum / matrizAumentada[i][i];
        }
      }
      
      return soluciones;
    }
  
    /**
     * Valida la consistencia global de las banderas
     */
    validarConsistenciaGlobal() {
      // Clonar lista de banderas para no modificar la original durante la validación
      const banderasOriginales = [...this.banderasColocadas];
      this.banderasColocadas = [];
      
      // Verificar cada bandera potencial
      for (const bandera of banderasOriginales) {
        if (this.esConsistenteGlobal(bandera)) {
          this.banderasColocadas.push(bandera);
        } else {
          console.warn(`Bandera inconsistente en (${bandera.fila+1},${bandera.columna+1}). No se colocará.`);
        }
      }
    }
  
    /**
     * Verifica si una bandera potencial es consistente globalmente
     * @param {Object} bandera - Datos de la bandera
     * @returns {boolean} - true si es consistente
     */
    esConsistenteGlobal(bandera) {
      // Simulación: colocar la bandera y verificar todas las restricciones
      const celda = this.tablero.obtenerCelda(bandera.fila, bandera.columna);
      
      // Verificar restricciones que afectan a esta celda
      for (const restriccion of celda.restricciones) {
        const celdaRestriccion = this.tablero.obtenerCelda(
          restriccion.celdaOrigen.fila,
          restriccion.celdaOrigen.columna
        );
        
        if (celdaRestriccion && celdaRestriccion.tieneValorNumerico()) {
          const valor = celdaRestriccion.obtenerValorNumerico();
          
          // Contar banderas ya colocadas o a colocar
          const banderas = this.tablero.obtenerCeldasAdyacentes(
            restriccion.celdaOrigen.fila,
            restriccion.celdaOrigen.columna
          ).filter(c => 
            c.tieneBandera || 
            this.banderasColocadas.some(b => b.fila === c.fila && b.columna === c.columna) ||
            (c.fila === bandera.fila && c.columna === bandera.columna)
          ).length;
          
          // Si supera el valor numérico, es inconsistente
          if (banderas > valor) {
            return false;
          }
        }
      }
      
      return true;
    }
  
    /**
     * Verifica si es seguro colocar una bandera en una celda
     * @param {Celda} celda - Celda a verificar
     * @param {string} origen - Origen del análisis
     * @returns {boolean} - true si es seguro colocar bandera
     */
    esSeguroColocarBandera(celda, origen) {
      // Si ya tiene bandera o está descubierta, no es válido
      if (celda.tieneBandera || celda.descubierta) {
        return false;
      }
      
      // Buscar restricciones de valor 0 o vacío que la afecten
      const celdasAdyacentes = this.tablero.obtenerCeldasAdyacentes(celda.fila, celda.columna);
      
      // Si alguna celda adyacente es un 0 o vacío, no puede tener mina
      for (const adyacente of celdasAdyacentes) {
        if (adyacente.descubierta && 
            (adyacente.valor === '' || adyacente.valor === '0' || adyacente.obtenerValorNumerico() === 0)) {
          return false;
        }
      }
      
      // Verificar todas las restricciones que afectan a esta celda
      for (const restriccion of celda.restricciones) {
        const celdaRestriccion = this.tablero.obtenerCelda(
          restriccion.celdaOrigen.fila,
          restriccion.celdaOrigen.columna
        );
        
        if (celdaRestriccion && celdaRestriccion.tieneValorNumerico()) {
          const valor = celdaRestriccion.obtenerValorNumerico();
          
          // Contar banderas ya colocadas o a colocar
          const banderas = this.tablero.obtenerCeldasAdyacentes(
            restriccion.celdaOrigen.fila,
            restriccion.celdaOrigen.columna
          ).filter(c => 
            c.tieneBandera || 
            this.banderasColocadas.some(b => b.fila === c.fila && b.columna === c.columna)
          ).length;
          
          // Si esta bandera adicional superaría el valor, no es seguro
          if (banderas >= valor) {
            return false;
          }
        }
      }
      
      return true;
    }
  
    /**
     * Marca una celda para colocar bandera
     * @param {Celda} celda - Celda a marcar
     * @param {string} origen - Origen de la bandera
     */
    marcarParaBandera(celda, origen) {
      this.banderasColocadas.push({
        fila: celda.fila,
        columna: celda.columna,
        origen: origen,
        iteracion: this.ultimaIteracion
      });
    }
  }
  
  export default GestorBanderas;