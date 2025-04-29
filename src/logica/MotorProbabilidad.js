/**
 * MotorProbabilidad - Calcula la probabilidad de mina para cada celda
 * Implementa algoritmos avanzados para determinar probabilidades precisas
 */
class MotorProbabilidad {
    /**
     * Constructor
     * @param {Object} tablero - Instancia del tablero de juego
     */
    constructor(tablero) {
      this.tablero = tablero;
      this.registroCalculos = []; // Historial de cálculos para aprendizaje
      this.casosAnalizados = 0;   // Contador de casos analizados
    }
  
    /**
     * Calcula probabilidades para todas las celdas sin revelar
     * @param {Object} gestorMemoria - Gestor de memoria para obtener datos históricos
     * @returns {Array} - Lista de celdas con sus probabilidades actualizadas
     */
    calcularProbabilidades(gestorMemoria = null) {
      // Asegurar que las restricciones estén actualizadas
      this.tablero.actualizarRestricciones();
      
      // Reiniciar contador de análisis
      this.casosAnalizados = 0;
      
      // Obtener celdas sin revelar
      const celdasSinRevolar = this.tablero.obtenerCeldasSinRevolar();
      
      // 1. INICIALIZACIÓN: probabilidad base para todas las celdas
      this.inicializarProbabilidadesBase(celdasSinRevolar);
      
      // 2. ANÁLISIS LOCAL: probabilidades basadas en restricciones directas
      this.calcularProbabilidadesLocales(celdasSinRevolar);
      
      // 3. ANÁLISIS GLOBAL: sistema de ecuaciones completo
      this.calcularProbabilidadesGlobales(celdasSinRevolar);
      
      // 4. ANÁLISIS POR FRONTERA: mejorar probabilidades en celdas de frontera
      this.calcularProbabilidadesFrontera(celdasSinRevolar);
      
      // 5. DATOS HISTÓRICOS: integrar memoria histórica
      if (gestorMemoria) {
        this.integrarMemoriaHistorica(celdasSinRevolar, gestorMemoria);
      }
      
      // 6. PROCESAMIENTO FINAL: normalización y ajuste de casos especiales
      this.ajustarProbabilidadesFinales(celdasSinRevolar);
      
      // Guardar registro de cálculos
      this.registroCalculos.push({
        timestamp: Date.now(),
        celdasAnalizadas: celdasSinRevolar.length,
        casosAnalizados: this.casosAnalizados,
        estadoTablero: this.tablero.obtenerEstadoParaMemoria()
      });
      
      // Limitar historial a 20 entradas
      if (this.registroCalculos.length > 20) {
        this.registroCalculos.shift();
      }
      
      return celdasSinRevolar;
    }
  
    /**
     * Inicializa probabilidades base para todas las celdas sin revelar
     * @param {Array} celdasSinRevolar - Lista de celdas sin revelar
     */
    inicializarProbabilidadesBase(celdasSinRevolar) {
      // Calcular probabilidad base según la estimación de minas totales
      const totalCeldas = this.tablero.filas * this.tablero.columnas;
      const celdasReveladas = this.tablero.contadorDescubiertas;
      const banderasColocadas = this.tablero.contadorBanderas;
      
      // Estimar minas totales basado en densidad típica (15-20%)
      const estimacionMinas = Math.round(totalCeldas * 0.18); // 18% es una estimación común
      const minasFaltantes = Math.max(0, estimacionMinas - banderasColocadas);
      
      // Calcular probabilidad base
      let probabilidadBase = 0.15; // Valor base por defecto
      
      if (celdasSinRevolar.length > 0) {
        probabilidadBase = Math.min(0.5, minasFaltantes / celdasSinRevolar.length);
      }
      
      // Inicializar cada celda con la probabilidad base
      celdasSinRevolar.forEach(celda => {
        // Probabilidad ajustada según posición
        let factorPosicion = 1;
        
        // Las esquinas y bordes tienen históricamente menos probabilidad de tener minas
        if (celda.esEsquina) {
          factorPosicion = 0.7; // 30% menos de probabilidad en esquinas
        } else if (celda.esBorde) {
          factorPosicion = 0.8; // 20% menos de probabilidad en bordes
        } else if (celda.distanciaBorde === 1) {
          factorPosicion = 0.9; // 10% menos de probabilidad cerca de bordes
        }
        
        const probAjustada = probabilidadBase * factorPosicion;
        
        // Solo actualizar si la celda no tiene ya una probabilidad con alta confianza
        if (celda.probabilidades.confianza < 0.5) {
          celda.actualizarProbabilidades(probAjustada, 0.3, 'base');
        }
      });
    }
  
    /**
     * Calcula probabilidades locales basadas en restricciones directas
     * @param {Array} celdasSinRevolar - Lista de celdas sin revelar
     */
    calcularProbabilidadesLocales(celdasSinRevolar) {
      // Agrupar por restricciones
      const restriccionesPorCelda = {};
      
      // Agrupar celdas por sus restricciones
      celdasSinRevolar.forEach(celda => {
        if (celda.restricciones.length > 0) {
          const clave = celda.restricciones.map(r => 
            `${r.celdaOrigen.fila},${r.celdaOrigen.columna}`
          ).sort().join('|');
          
          if (!restriccionesPorCelda[clave]) {
            restriccionesPorCelda[clave] = {
              celdas: [],
              restricciones: celda.restricciones.map(r => ({
                celda: { 
                  fila: r.celdaOrigen.fila, 
                  columna: r.celdaOrigen.columna 
                },
                valor: r.valor,
                minasRestantes: r.minasRestantes,
                celdasAfectadas: r.celdasAfectadas
              }))
            };
          }
          
          restriccionesPorCelda[clave].celdas.push(celda);
        }
      });
      
      // Procesar cada grupo de restricciones
      Object.values(restriccionesPorCelda).forEach(grupo => {
        if (grupo.celdas.length > 0 && grupo.restricciones.length > 0) {
          // Si es un grupo simple (una restricción)
          if (grupo.restricciones.length === 1) {
            const restriccion = grupo.restricciones[0];
            
            // Probabilidad uniforme para celdas bajo la misma restricción
            const probabilidad = restriccion.minasRestantes / grupo.celdas.length;
            
            // Confianza basada en el número de celdas (menos celdas = más confianza)
            const confianza = 0.5 + (0.3 / Math.sqrt(grupo.celdas.length));
            
            grupo.celdas.forEach(celda => {
              celda.actualizarProbabilidades(probabilidad, confianza, 'restricciones');
            });
          }
        }
      });
    }
  
    /**
     * Calcula probabilidades globales mediante análisis de todas las restricciones simultáneamente
     * @param {Array} celdasSinRevolar - Lista de celdas sin revelar
     */
    calcularProbabilidadesGlobales(celdasSinRevolar) {
      // Obtener grupos de celdas conectadas por restricciones
      const grupos = this.obtenerGruposConectados(celdasSinRevolar);
      
      // Procesar cada grupo
      grupos.forEach(grupo => {
        if (grupo.celdas.length <= 12) { // Limitar a grupos pequeños por eficiencia
          // Calcular probabilidades por enumeración de casos
          const resultado = this.calcularProbabilidadesPorEnumeracion(grupo);
          
          if (resultado) {
            // Actualizar probabilidades
            resultado.probabilidades.forEach((prob, indice) => {
              const celda = grupo.celdas[indice];
              celda.actualizarProbabilidades(prob, 0.8, 'probabilidad');
            });
          }
        } else {
          // Para grupos grandes, usar aproximación por modelo lineal
          const resultado = this.calcularProbabilidadesPorModeloLineal(grupo);
          
          if (resultado) {
            // Actualizar probabilidades
            resultado.probabilidades.forEach((prob, indice) => {
              const celda = grupo.celdas[indice];
              celda.actualizarProbabilidades(prob, 0.6, 'probabilidad');
            });
          }
        }
      });
      
      // Procesar celdas que no están en ningún grupo (sin restricciones)
      const celdasSinGrupo = celdasSinRevolar.filter(celda => 
        celda.restricciones.length === 0
      );
      
      // Para celdas sin restricciones, usar probabilidad baja
      celdasSinGrupo.forEach(celda => {
        celda.actualizarProbabilidades(0.1, 0.4, 'aislada');
      });
    }
  
    /**
     * Obtiene grupos de celdas conectadas por restricciones comunes
     * @param {Array} celdasSinRevolar - Lista de celdas sin revelar
     * @returns {Array} - Grupos de celdas conectadas
     */
    obtenerGruposConectados(celdasSinRevolar) {
      const grupos = [];
      const celdasAgrupadas = new Set();
      
      // Para cada celda, buscar grupo conexo
      celdasSinRevolar.forEach(celda => {
        const clave = `${celda.fila},${celda.columna}`;
        
        // Si ya está en un grupo, ignorar
        if (celdasAgrupadas.has(clave)) return;
        
        // Si no tiene restricciones, ignorar
        if (celda.restricciones.length === 0) return;
        
        // Buscar grupo conexo
        const grupo = this.obtenerGrupoConexo(celda, celdasSinRevolar, celdasAgrupadas);
        
        if (grupo.celdas.length > 0) {
          grupos.push(grupo);
        }
      });
      
      return grupos;
    }
  
    /**
     * Obtiene un grupo conexo de celdas a partir de una celda inicial
     * @param {Object} celdaInicial - Celda inicial
     * @param {Array} celdasSinRevolar - Lista de celdas sin revelar
     * @param {Set} celdasAgrupadas - Conjunto de celdas ya agrupadas
     * @returns {Object} - Grupo de celdas y restricciones
     */
    obtenerGrupoConexo(celdaInicial, celdasSinRevolar, celdasAgrupadas) {
      const grupo = {
        celdas: [],
        restricciones: new Set()
      };
      
      // Cola de celdas por visitar
      const cola = [celdaInicial];
      const visitadas = new Set();
      
      while (cola.length > 0) {
        const celda = cola.shift();
        const clave = `${celda.fila},${celda.columna}`;
        
        // Si ya está visitada, continuar
        if (visitadas.has(clave)) continue;
        
        // Marcar como visitada y agregar al grupo
        visitadas.add(clave);
        celdasAgrupadas.add(clave);
        grupo.celdas.push(celda);
        
        // Agregar todas las restricciones
        celda.restricciones.forEach(restriccion => {
          const claveRestriccion = `${restriccion.celdaOrigen.fila},${restriccion.celdaOrigen.columna}`;
          grupo.restricciones.add(claveRestriccion);
          
          // Buscar celdas conectadas por esta restricción
          const celdasConectadas = celdasSinRevolar.filter(otraCelda => {
            // No considerar celdas ya visitadas
            if (visitadas.has(`${otraCelda.fila},${otraCelda.columna}`)) return false;
            
            // Verificar si comparten esta restricción
            return otraCelda.restricciones.some(r => 
              r.celdaOrigen.fila === restriccion.celdaOrigen.fila && 
              r.celdaOrigen.columna === restriccion.celdaOrigen.columna
            );
          });
          
          // Agregar celdas conectadas a la cola
          celdasConectadas.forEach(celdaConectada => {
            cola.push(celdaConectada);
          });
        });
      }
      
      return {
        celdas: grupo.celdas,
        restricciones: Array.from(grupo.restricciones).map(clave => {
          const [fila, columna] = clave.split(',').map(Number);
          const celdaRestriccion = this.tablero.obtenerCelda(fila, columna);
          return {
            celda: { fila, columna },
            valor: celdaRestriccion.obtenerValorNumerico()
          };
        })
      };
    }
  
    /**
     * Calcula probabilidades por enumeración exhaustiva de casos posibles
     * @param {Object} grupo - Grupo de celdas y restricciones
     * @returns {Object|null} - Resultados o null si no es posible calcular
     */
    calcularProbabilidadesPorEnumeracion(grupo) {
      // Limitar a grupos pequeños para evitar explosión combinatoria
      if (grupo.celdas.length > 12) return null;
      
      // Mapeo de celdas a índices
      const indiceCeldas = {};
      grupo.celdas.forEach((celda, indice) => {
        indiceCeldas[`${celda.fila},${celda.columna}`] = indice;
      });
      
      // Preparar restricciones
      const restricciones = grupo.restricciones.map(r => {
        // Obtener celdas afectadas por esta restricción
        const celdasAfectadas = this.tablero.obtenerCeldasAdyacentes(r.celda.fila, r.celda.columna)
          .filter(c => !c.descubierta)
          .map(c => indiceCeldas[`${c.fila},${c.columna}`])
          .filter(indice => indice !== undefined);
        
        // Obtener banderas existentes
        const banderasActuales = this.tablero.obtenerCeldasAdyacentes(r.celda.fila, r.celda.columna)
          .filter(c => c.tieneBandera).length;
        
        return {
          celda: r.celda,
          valor: r.valor,
          banderasActuales,
          minasRestantes: r.valor - banderasActuales,
          celdasAfectadas
        };
      });
      
      // Generar todas las combinaciones posibles
      const combinaciones = this.generarCombinaciones(grupo.celdas.length);
      
      // Filtrar combinaciones válidas
      const combinacionesValidas = combinaciones.filter(combinacion => {
        // Verificar cada restricción
        return restricciones.every(restriccion => {
          // Contar minas en esta restricción
          const minasEnRestriccion = restriccion.celdasAfectadas.reduce((count, indice) => {
            return count + combinacion[indice];
          }, 0);
          
          // Verificar si cumple la restricción
          return minasEnRestriccion === restriccion.minasRestantes;
        });
      });
      
      // Calcular probabilidades
      const probabilidades = Array(grupo.celdas.length).fill(0);
      
      if (combinacionesValidas.length > 0) {
        combinacionesValidas.forEach(combinacion => {
          for (let i = 0; i < combinacion.length; i++) {
            probabilidades[i] += combinacion[i];
          }
        });
        
        // Normalizar
        for (let i = 0; i < probabilidades.length; i++) {
          probabilidades[i] /= combinacionesValidas.length;
        }
        
        return {
          probabilidades,
          combinacionesValidas: combinacionesValidas.length,
          totalCombinaciones: combinaciones.length
        };
      }
      
      return null;
    }
  
    /**
     * Genera todas las combinaciones de minas para un conjunto de celdas
     * @param {number} n - Número de celdas
     * @returns {Array} - Lista de combinaciones
     */
    generarCombinaciones(n) {
      this.casosAnalizados++;
      
      // Para grupos muy grandes, limitar número de combinaciones
      if (n > 10) {
        // Usar aproximación con muestreo aleatorio
        return this.generarCombinacionesMuestreo(n, 1000);
      }
      
      const total = Math.pow(2, n);
      const combinaciones = [];
      
      for (let i = 0; i < total; i++) {
        const combinacion = [];
        for (let j = 0; j < n; j++) {
          combinacion.push((i & (1 << j)) ? 1 : 0);
        }
        combinaciones.push(combinacion);
      }
      
      return combinaciones;
    }
  
    /**
     * Genera un muestreo de combinaciones para grupos grandes
     * @param {number} n - Número de celdas
     * @param {number} muestras - Número de muestras a generar
     * @returns {Array} - Lista de combinaciones muestreadas
     */
    generarCombinacionesMuestreo(n, muestras) {
      const combinaciones = new Set();
      
      for (let i = 0; i < muestras; i++) {
        const combinacion = [];
        for (let j = 0; j < n; j++) {
          combinacion.push(Math.random() < 0.5 ? 1 : 0);
        }
        combinaciones.add(JSON.stringify(combinacion));
      }
      
      return Array.from(combinaciones).map(c => JSON.parse(c));
    }
  
    /**
     * Calcula probabilidades usando un modelo lineal para grupos grandes
     * @param {Object} grupo - Grupo de celdas y restricciones
     * @returns {Object|null} - Resultados o null si no es posible calcular
     */
    calcularProbabilidadesPorModeloLineal(grupo) {
      // Preparar sistema de ecuaciones
      const celdas = grupo.celdas;
      const restricciones = grupo.restricciones;
      
      // Matriz de coeficientes
      const matriz = Array(restricciones.length).fill().map(() => Array(celdas.length).fill(0));
      
      // Vector de valores
      const valores = Array(restricciones.length).fill(0);
      
      // Mapeo de celdas a índices
      const indiceCeldas = {};
      celdas.forEach((celda, indice) => {
        indiceCeldas[`${celda.fila},${celda.columna}`] = indice;
      });
      
      // Llenar matriz
      restricciones.forEach((restriccion, indiceRestriccion) => {
        // Obtener celdas afectadas por esta restricción
        const celdasAfectadas = this.tablero.obtenerCeldasAdyacentes(restriccion.celda.fila, restriccion.celda.columna)
          .filter(c => !c.descubierta);
        
        // Obtener banderas existentes
        const banderasActuales = this.tablero.obtenerCeldasAdyacentes(restriccion.celda.fila, restriccion.celda.columna)
          .filter(c => c.tieneBandera).length;
        
        // Llenar fila de la matriz
        celdasAfectadas.forEach(celda => {
          const indice = indiceCeldas[`${celda.fila},${celda.columna}`];
          if (indice !== undefined) {
            matriz[indiceRestriccion][indice] = 1;
          }
        });
        
        // Valor de la restricción
        valores[indiceRestriccion] = restriccion.valor - banderasActuales;
      });
      
      // Resolver sistema usando método de mínimos cuadrados
      try {
        const soluciones = this.resolverMinimosCuadrados(matriz, valores);
        
        if (soluciones) {
          // Ajustar soluciones al rango [0,1]
          const probabilidades = soluciones.map(p => Math.max(0, Math.min(1, p)));
          
          return {
            probabilidades,
            confianza: 0.6
          };
        }
      } catch (error) {
        console.error("Error al resolver sistema lineal:", error);
      }
      
      return null;
    }
  
    /**
     * Resuelve un sistema de ecuaciones lineales por mínimos cuadrados
     * @param {Array} A - Matriz de coeficientes
     * @param {Array} b - Vector de valores
     * @returns {Array|null} - Vector de soluciones o null si hay error
     */
    resolverMinimosCuadrados(A, b) {
      try {
        const m = A.length;
        const n = A[0].length;
        
        // Calcular A^T * A
        const ATA = Array(n).fill().map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            for (let k = 0; k < m; k++) {
              ATA[i][j] += A[k][i] * A[k][j];
            }
          }
        }
        
        // Calcular A^T * b
        const ATb = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
          for (let k = 0; k < m; k++) {
            ATb[i] += A[k][i] * b[k];
          }
        }
        
        // Resolver ATA * x = ATb
        const x = this.resolverSistemaLineal(ATA, ATb);
        
        return x;
      } catch (error) {
        console.error("Error en mínimos cuadrados:", error);
        return null;
      }
    }
  
    /**
     * Resuelve un sistema lineal Ax = b
     * @param {Array} A - Matriz de coeficientes
     * @param {Array} b - Vector de valores
     * @returns {Array} - Vector de soluciones
     */
    resolverSistemaLineal(A, b) {
      const n = A.length;
      
      // Crear matriz aumentada [A|b]
      const aumentada = A.map((fila, i) => [...fila, b[i]]);
      
      // Eliminación gaussiana
      for (let i = 0; i < n; i++) {
        // Pivoteo parcial
        let maxRow = i;
        for (let j = i + 1; j < n; j++) {
          if (Math.abs(aumentada[j][i]) > Math.abs(aumentada[maxRow][i])) {
            maxRow = j;
          }
        }
        
        // Intercambiar filas
        [aumentada[i], aumentada[maxRow]] = [aumentada[maxRow], aumentada[i]];
        
        // Si el pivote es 0, continuar con la siguiente columna
        if (Math.abs(aumentada[i][i]) < 1e-10) continue;
        
        // Normalizar fila
        for (let j = i + 1; j <= n; j++) {
          aumentada[i][j] /= aumentada[i][i];
        }
        aumentada[i][i] = 1;
        
        // Eliminar debajo del pivote
        for (let j = i + 1; j < n; j++) {
          const factor = aumentada[j][i];
          for (let k = i; k <= n; k++) {
            aumentada[j][k] -= factor * aumentada[i][k];
          }
        }
      }
      
      // Sustitución hacia atrás
      const soluciones = Array(n).fill(0);
      
      for (let i = n - 1; i >= 0; i--) {
        soluciones[i] = aumentada[i][n];
        for (let j = i + 1; j < n; j++) {
          soluciones[i] -= aumentada[i][j] * soluciones[j];
        }
      }
      
      return soluciones;
    }
  
    /**
     * Calcula probabilidades específicas para celdas de frontera
     * @param {Array} celdasSinRevolar - Lista de celdas sin revelar
     */
    calcularProbabilidadesFrontera(celdasSinRevolar) {
      // Identificar celdas de frontera (adyacentes a celdas reveladas)
      const celdasFrontera = celdasSinRevolar.filter(celda => {
        // Obtener celdas adyacentes
        const adyacentes = this.tablero.obtenerCeldasAdyacentes(celda.fila, celda.columna);
        
        // Es frontera si tiene al menos una celda adyacente revelada
        return adyacentes.some(adj => adj.descubierta);
      });
      
      // Calcular probabilidades específicas para celdas de frontera
      celdasFrontera.forEach(celda => {
        const adyacentesReveladas = this.tablero.obtenerCeldasAdyacentes(celda.fila, celda.columna)
          .filter(adj => adj.descubierta);
        
        // Para cada celda adyacente revelada, calcular influencia
        let influenciaTotal = 0;
        let factorTotal = 0;
        
        adyacentesReveladas.forEach(adyacente => {
          if (adyacente.tieneValorNumerico()) {
            const valor = adyacente.obtenerValorNumerico();
            
            // Celdas sin revelar adyacentes a este número
            const adyacentesSinRevolar = this.tablero.obtenerCeldasAdyacentes(adyacente.fila, adyacente.columna)
              .filter(adj => !adj.descubierta && !adj.tieneBandera);
            
            // Banderas ya colocadas
            const banderasColocadas = this.tablero.obtenerCeldasAdyacentes(adyacente.fila, adyacente.columna)
              .filter(adj => adj.tieneBandera).length;
            
            // Minas restantes
            const minasRestantes = valor - banderasColocadas;
            
            // Probabilidad local (si hay celdas sin revelar)
            if (adyacentesSinRevolar.length > 0) {
              const probabilidadLocal = minasRestantes / adyacentesSinRevolar.length;
              
              // Factor de peso (inversamente proporcional a la cantidad de celdas)
              const factorPeso = 1 / adyacentesSinRevolar.length;
              
              influenciaTotal += probabilidadLocal * factorPeso;
              factorTotal += factorPeso;
            }
          }
        });
        
        // Probabilidad ponderada
        if (factorTotal > 0) {
          const probabilidadPonderada = influenciaTotal / factorTotal;
          const confianza = Math.min(0.7, 0.4 + (0.1 * adyacentesReveladas.length));
          
          celda.actualizarProbabilidades(probabilidadPonderada, confianza, 'frontera');
        }
      });
      
      // Celdas no frontera (más alejadas de números)
      const celdasNoFrontera = celdasSinRevolar.filter(celda => 
        !celdasFrontera.includes(celda)
      );
      
      // Reducir probabilidad para celdas alejadas
      celdasNoFrontera.forEach(celda => {
        // Sólo si no tiene alta confianza ya
        if (celda.probabilidades.confianza < 0.5) {
          const probabilidadActual = celda.probabilidades.probabilidadMina;
          const factorReduccion = 0.85; // Reducir en 15%
          celda.actualizarProbabilidades(probabilidadActual * factorReduccion, 0.5, 'no_frontera');
        }
      });
    }
  
    /**
     * Integra datos históricos para mejorar las probabilidades
     * @param {Array} celdasSinRevolar - Lista de celdas sin revelar
     * @param {Object} gestorMemoria - Gestor de memoria para obtener datos históricos
     */
    integrarMemoriaHistorica(celdasSinRevolar, gestorMemoria) {
      // Obtener mapa de minas conocidas
      const mapaMinasConocidas = gestorMemoria.obtenerMapaMinasConocidas();
      
      // Aplicar conocimiento histórico a cada celda
      celdasSinRevolar.forEach(celda => {
        const clave = `${celda.fila},${celda.columna}`;
        
        // Si esta celda tiene historial de minas
        if (mapaMinasConocidas[clave]) {
          const infoHistorica = mapaMinasConocidas[clave];
          
          // Calcular influencia histórica
          let factorHistorico = 0;
          let confianzaHistorica = 0;
          
          if (infoHistorica.ocurrencias > 0) {
            // Más ocurrencias = más confianza
            factorHistorico = Math.min(0.8, 0.3 + (infoHistorica.ocurrencias * 0.1));
            confianzaHistorica = Math.min(0.7, 0.3 + (infoHistorica.ocurrencias * 0.05));
            
            // Ajustar basado en recencia
            if (infoHistorica.esReciente) {
              factorHistorico += 0.1;
              confianzaHistorica += 0.1;
            }
            
            // Limitar valores
            factorHistorico = Math.min(0.9, factorHistorico);
            confianzaHistorica = Math.min(0.8, confianzaHistorica);
            
            // Si la confianza histórica es significativa y mayor a la actual, actualizar
            if (confianzaHistorica > 0.4 && confianzaHistorica > celda.probabilidades.confianza) {
              // Combinar con probabilidad actual
              const probActual = celda.probabilidades.probabilidadMina;
              const confActual = celda.probabilidades.confianza;
              
              // Combinar probabilidades (ponderado por confianza)
              const probCombinada = ((probActual * confActual) + (factorHistorico * confianzaHistorica)) / 
                                  (confActual + confianzaHistorica);
              
              const confCombinada = Math.max(confActual, confianzaHistorica);
              
              celda.actualizarProbabilidades(probCombinada, confCombinada, 'memoria');
            }
          }
        }
      });
    }
  
    /**
     * Ajusta probabilidades finales tras todos los cálculos
     * @param {Array} celdasSinRevolar - Lista de celdas sin revelar
     */
    ajustarProbabilidadesFinales(celdasSinRevolar) {
      // 1. Identificar casos de 100% de certeza
      this.identificarCasosConCerteza(celdasSinRevolar);
      
      // 2. Normalizar probabilidades para mantener consistencia global
      this.normalizarProbabilidades(celdasSinRevolar);
      
      // 3. Ajustar casos especiales
      this.ajustarCasosEspeciales(celdasSinRevolar);
    }
  
    /**
     * Identifica celdas con 100% de certeza (mina o segura)
     * @param {Array} celdasSinRevolar - Lista de celdas sin revelar
     */
    identificarCasosConCerteza(celdasSinRevolar) {
      // Celdas con probabilidad muy alta o muy baja
      celdasSinRevolar.forEach(celda => {
        const probabilidad = celda.probabilidades.probabilidadMina;
        const confianza = celda.probabilidades.confianza;
        
        // Mina con certeza
        if (probabilidad > 0.99 && confianza > 0.95) {
          celda.actualizarProbabilidades(1, 1, 'analisis100');
        }
        // Segura con certeza
        else if (probabilidad < 0.01 && confianza > 0.95) {
          celda.actualizarProbabilidades(0, 1, 'analisis100');
        }
      });
    }
  
    /**
     * Normaliza probabilidades para mantener consistencia global
     * @param {Array} celdasSinRevolar - Lista de celdas sin revelar
     */
    normalizarProbabilidades(celdasSinRevolar) {
      // Estimar total de minas
      const totalCeldas = this.tablero.filas * this.tablero.columnas;
      const banderasColocadas = this.tablero.contadorBanderas;
      
      // Estimación basada en densidad típica (aproximadamente 15-20%)
      const estimacionMinas = Math.round(totalCeldas * 0.18);
      const minasFaltantes = Math.max(1, estimacionMinas - banderasColocadas);
      
      // Calcular suma total de probabilidades
      let sumaProbabilidades = 0;
      celdasSinRevolar.forEach(celda => {
        sumaProbabilidades += celda.probabilidades.probabilidadMina;
      });
      
      // Si la suma es muy diferente del número esperado, normalizar
      if (Math.abs(sumaProbabilidades - minasFaltantes) > 0.5 * minasFaltantes) {
        // Factor de escala
        const factorEscala = minasFaltantes / Math.max(0.1, sumaProbabilidades);
        
        // Aplicar escala, preservando celdas con certeza
        celdasSinRevolar.forEach(celda => {
          if (celda.probabilidades.confianza < 0.95) {
            const nuevaProb = Math.min(0.95, Math.max(0.05, celda.probabilidades.probabilidadMina * factorEscala));
            celda.actualizarProbabilidades(nuevaProb, celda.probabilidades.confianza, 'normalizado');
          }
        });
      }
    }
  
    /**
     * Ajusta casos especiales tras los cálculos principales
     * @param {Array} celdasSinRevolar - Lista de celdas sin revelar
     */
    ajustarCasosEspeciales(celdasSinRevolar) {
      // Verificar cada celda para casos especiales
      celdasSinRevolar.forEach(celda => {
        // Caso 1: Celda adyacente a un 0 o vacío
        const adyacentes = this.tablero.obtenerCeldasAdyacentes(celda.fila, celda.columna);
        
        const adyacenteVacia = adyacentes.some(adj => 
          adj.descubierta && (adj.valor === '' || adj.valor === '0')
        );
        
        if (adyacenteVacia) {
          // No puede tener mina
          celda.actualizarProbabilidades(0, 1, 'analisis100');
        }
        
        // Caso 2: Celda en esquina con todas sus adyacentes descubiertas excepto esta
        if (celda.esEsquina) {
          const adyacentesSinDescubrir = adyacentes.filter(adj => !adj.descubierta);
          
          // Si esta es la única sin descubrir
          if (adyacentesSinDescubrir.length === 1) {
            // Verificar si hay algún 1 adyacente
            const hayUnoAdyacente = adyacentes.some(adj => 
              adj.descubierta && adj.tieneValorNumerico() && adj.obtenerValorNumerico() === 1
            );
            
            if (hayUnoAdyacente) {
              // Debe ser mina
              celda.actualizarProbabilidades(1, 1, 'analisis100');
            }
          }
        }
      });
    }
  }
  
  export default MotorProbabilidad;