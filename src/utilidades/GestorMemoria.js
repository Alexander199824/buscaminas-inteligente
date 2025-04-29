/**
 * GestorMemoria - Maneja el aprendizaje del sistema basado en la experiencia
 * Permite recordar posiciones de minas, patrones y estrategias efectivas
 */
class GestorMemoria {
    /**
     * Constructor
     */
    constructor() {
      this.CLAVE_ALMACENAMIENTO = 'buscaminas_memoria_sistema';
      this.memoria = this.cargarMemoria();
      this.idPartidaActual = Date.now();
      this.cambiosDetectados = false;
    }
  
    /**
     * Carga la memoria desde el almacenamiento local
     * @returns {Object} - Objeto con la memoria cargada o estructura inicial
     */
    cargarMemoria() {
      try {
        const memoriaGuardada = localStorage.getItem(this.CLAVE_ALMACENAMIENTO);
        if (memoriaGuardada) {
          return JSON.parse(memoriaGuardada);
        }
      } catch (error) {
        console.error("Error al cargar memoria:", error);
      }
      
      // Si no hay memoria guardada o hay error, crear estructura inicial
      return {
        // Registro de posiciones con mina
        mapaMinasConocidas: {},
        
        // Patrones de juego
        patrones: {
          movimientosIniciales: {},
          segundosMovimientos: {},
          secuenciasGanadoras: [],
          secuenciasPerdedoras: []
        },
        
        // Historial de partidas
        partidas: [],
        
        // Estadísticas globales
        estadisticas: {
          partidasJugadas: 0,
          victorias: 0,
          derrotas: 0,
          minasTotales: 0,
          movimientosTotales: 0,
          tiempoTotal: 0
        },
        
        // Detección de cambios en el tablero
        controlCambios: {
          ultimoTablero: null,
          contadorCambios: 0,
          historialCambios: []
        },
        
        // Fecha de última actualización
        ultimaActualizacion: new Date().toISOString()
      };
    }
  
    /**
     * Guarda la memoria en el almacenamiento local
     */
    guardarMemoria() {
      try {
        localStorage.setItem(this.CLAVE_ALMACENAMIENTO, JSON.stringify(this.memoria));
      } catch (error) {
        console.error("Error al guardar memoria:", error);
      }
    }
  
    /**
     * Registra una mina encontrada para aprendizaje futuro
     * @param {number} fila - Fila de la mina
     * @param {number} columna - Columna de la mina
     * @param {Object} tablero - Referencia al tablero
     */
    registrarMinaEncontrada(fila, columna, tablero) {
      // Clave para el mapa de minas
      const clave = `${fila},${columna}`;
      
      // Información sobre la posición normalizada (para generalizar entre tableros)
      const posicionNormalizada = this.normalizarPosicion(fila, columna, tablero);
      
      // Actualizar mapa de minas conocidas
      if (!this.memoria.mapaMinasConocidas[clave]) {
        this.memoria.mapaMinasConocidas[clave] = {
          fila,
          columna,
          ocurrencias: 1,
          ultimoTablero: {
            filas: tablero.filas,
            columnas: tablero.columnas
          },
          primeraDeteccion: new Date().toISOString(),
          ultimaDeteccion: new Date().toISOString(),
          posicionNormalizada,
          partidasAsociadas: [this.idPartidaActual],
          esReciente: true
        };
      } else {
        // Incrementar contador
        this.memoria.mapaMinasConocidas[clave].ocurrencias++;
        this.memoria.mapaMinasConocidas[clave].ultimaDeteccion = new Date().toISOString();
        this.memoria.mapaMinasConocidas[clave].esReciente = true;
        
        // Registrar partida si no está ya
        if (!this.memoria.mapaMinasConocidas[clave].partidasAsociadas.includes(this.idPartidaActual)) {
          this.memoria.mapaMinasConocidas[clave].partidasAsociadas.push(this.idPartidaActual);
        }
      }
      
      // Actualizar estadísticas
      this.memoria.estadisticas.minasTotales++;
      
      // Guardar memoria
      this.guardarMemoria();
    }
  
    /**
     * Registra el resultado de una partida
     * @param {boolean} victoria - true si se ganó la partida
     * @param {Array} movimientos - Historial de movimientos
     * @param {Object} tablero - Referencia al tablero
     * @param {number} tiempoJuego - Tiempo en segundos
     */
    registrarResultadoPartida(victoria, movimientos, tablero, tiempoJuego) {
      // Actualizar estadísticas
      this.memoria.estadisticas.partidasJugadas++;
      this.memoria.estadisticas.tiempoTotal += tiempoJuego;
      
      if (victoria) {
        this.memoria.estadisticas.victorias++;
        this.registrarSecuenciaGanadora(movimientos, tablero);
      } else {
        this.memoria.estadisticas.derrotas++;
        this.registrarSecuenciaPerdedora(movimientos, tablero);
      }
      
      // Actualizar movimientos totales
      this.memoria.estadisticas.movimientosTotales += movimientos.length;
      
      // Registrar partida completa
      this.memoria.partidas.push({
        id: this.idPartidaActual,
        fecha: new Date().toISOString(),
        resultado: victoria ? 'victoria' : 'derrota',
        movimientos: movimientos.map(m => ({
          fila: m.fila,
          columna: m.columna,
          tipo: m.tipo,
          respuesta: m.respuesta
        })),
        tamañoTablero: {
          filas: tablero.filas,
          columnas: tablero.columnas
        },
        tiempoJuego,
        cambiosDetectados: this.cambiosDetectados
      });
      
      // Limitar historial a 50 partidas
      if (this.memoria.partidas.length > 50) {
        this.memoria.partidas = this.memoria.partidas.slice(-50);
      }
      
      // Actualizar fecha
      this.memoria.ultimaActualizacion = new Date().toISOString();
      
      // Guardar memoria
      this.guardarMemoria();
    }
  
    /**
     * Registra una secuencia de movimientos ganadora
     * @param {Array} movimientos - Historial de movimientos
     * @param {Object} tablero - Referencia al tablero
     */
    registrarSecuenciaGanadora(movimientos, tablero) {
      if (movimientos.length === 0) return;
      
      // Normalizar secuencia
      const secuenciaNormalizada = this.normalizarSecuencia(movimientos, tablero);
      
      // Guardar la secuencia ganadora si no existe ya
      if (!this.memoria.patrones.secuenciasGanadoras.includes(secuenciaNormalizada)) {
        this.memoria.patrones.secuenciasGanadoras.push(secuenciaNormalizada);
        
        // Limitar a 100 secuencias
        if (this.memoria.patrones.secuenciasGanadoras.length > 100) {
          this.memoria.patrones.secuenciasGanadoras.shift();
        }
      }
      
      // Registrar movimiento inicial como exitoso
      this.registrarMovimientoInicial(movimientos[0], true, tablero);
      
      // Registrar segundo movimiento si existe
      if (movimientos.length >= 2) {
        this.registrarSegundoMovimiento(movimientos[0], movimientos[1], true, tablero);
      }
    }
  
    /**
     * Registra una secuencia de movimientos perdedora
     * @param {Array} movimientos - Historial de movimientos
     * @param {Object} tablero - Referencia al tablero
     */
    registrarSecuenciaPerdedora(movimientos, tablero) {
      if (movimientos.length === 0) return;
      
      // Normalizar secuencia
      const secuenciaNormalizada = this.normalizarSecuencia(movimientos, tablero);
      
      // Guardar la secuencia perdedora si no existe ya
      if (!this.memoria.patrones.secuenciasPerdedoras.includes(secuenciaNormalizada)) {
        this.memoria.patrones.secuenciasPerdedoras.push(secuenciaNormalizada);
        
        // Limitar a 100 secuencias
        if (this.memoria.patrones.secuenciasPerdedoras.length > 100) {
          this.memoria.patrones.secuenciasPerdedoras.shift();
        }
      }
      
      // Registrar movimiento inicial como fallido
      this.registrarMovimientoInicial(movimientos[0], false, tablero);
      
      // Registrar segundo movimiento si existe
      if (movimientos.length >= 2) {
        this.registrarSegundoMovimiento(movimientos[0], movimientos[1], false, tablero);
      }
    }
  
    /**
     * Registra un movimiento inicial
     * @param {Object} movimiento - Datos del movimiento
     * @param {boolean} exito - true si el movimiento fue exitoso
     * @param {Object} tablero - Referencia al tablero
     */
    registrarMovimientoInicial(movimiento, exito, tablero) {
      // Normalizar posición
      const posNorm = this.normalizarPosicion(movimiento.fila, movimiento.columna, tablero);
      if (!posNorm) return;
      
      const clave = `${posNorm.filaNorm},${posNorm.columnaNorm}`;
      
      // Actualizar registro de movimientos iniciales
      if (!this.memoria.patrones.movimientosIniciales[clave]) {
        this.memoria.patrones.movimientosIniciales[clave] = {
          victorias: exito ? 1 : 0,
          derrotas: exito ? 0 : 1,
          partidas: [this.idPartidaActual]
        };
      } else {
        if (exito) {
          this.memoria.patrones.movimientosIniciales[clave].victorias++;
        } else {
          this.memoria.patrones.movimientosIniciales[clave].derrotas++;
        }
        
        // Registrar partida si no está ya
        if (!this.memoria.patrones.movimientosIniciales[clave].partidas.includes(this.idPartidaActual)) {
          this.memoria.patrones.movimientosIniciales[clave].partidas.push(this.idPartidaActual);
        }
      }
    }
  
    /**
     * Registra un segundo movimiento
     * @param {Object} movimiento1 - Primer movimiento
     * @param {Object} movimiento2 - Segundo movimiento
     * @param {boolean} exito - true si la secuencia fue exitosa
     * @param {Object} tablero - Referencia al tablero
     */
    registrarSegundoMovimiento(movimiento1, movimiento2, exito, tablero) {
      // Normalizar posiciones
      const posNorm1 = this.normalizarPosicion(movimiento1.fila, movimiento1.columna, tablero);
      const posNorm2 = this.normalizarPosicion(movimiento2.fila, movimiento2.columna, tablero);
      
      if (!posNorm1 || !posNorm2) return;
      
      const clave1 = `${posNorm1.filaNorm},${posNorm1.columnaNorm}`;
      const clave2 = `${posNorm2.filaNorm},${posNorm2.columnaNorm}`;
      const claveSecuencia = `${clave1}|${clave2}`;
      
      // Actualizar registro de segundos movimientos
      if (!this.memoria.patrones.segundosMovimientos[claveSecuencia]) {
        this.memoria.patrones.segundosMovimientos[claveSecuencia] = {
          victorias: exito ? 1 : 0,
          derrotas: exito ? 0 : 1,
          partidas: [this.idPartidaActual]
        };
      } else {
        if (exito) {
          this.memoria.patrones.segundosMovimientos[claveSecuencia].victorias++;
        } else {
          this.memoria.patrones.segundosMovimientos[claveSecuencia].derrotas++;
        }
        
        // Registrar partida si no está ya
        if (!this.memoria.patrones.segundosMovimientos[claveSecuencia].partidas.includes(this.idPartidaActual)) {
          this.memoria.patrones.segundosMovimientos[claveSecuencia].partidas.push(this.idPartidaActual);
        }
      }
    }
  
    /**
     * Registra una contradicción/inconsistencia para detectar cambios de tablero
     * @param {Object} contradiccion - Datos de la contradicción
     */
    registrarContradiccion(contradiccion) {
      if (!this.memoria.controlCambios) {
        this.memoria.controlCambios = {
          ultimoTablero: null,
          contadorCambios: 0,
          historialCambios: []
        };
      }
      
      // Incrementar contador
      this.memoria.controlCambios.contadorCambios++;
      
      // Registrar en historial
      this.memoria.controlCambios.historialCambios.push({
        tipo: contradiccion.tipo,
        timestamp: new Date().toISOString(),
        idPartida: this.idPartidaActual
      });
      
      // Limitar historial
      if (this.memoria.controlCambios.historialCambios.length > 20) {
        this.memoria.controlCambios.historialCambios = this.memoria.controlCambios.historialCambios.slice(-20);
      }
      
      // Si hay muchas contradicciones, considerar que el tablero ha cambiado
      if (this.memoria.controlCambios.contadorCambios >= 3) {
        this.cambiosDetectados = true;
        this.atenuarMemoriaAntigua();
      }
      
      this.guardarMemoria();
    }
  
    /**
     * Atenúa el peso de la memoria antigua cuando se detectan cambios
     */
    atenuarMemoriaAntigua() {
      // Reducir peso de minas conocidas
      for (const clave in this.memoria.mapaMinasConocidas) {
        const mina = this.memoria.mapaMinasConocidas[clave];
        
        // Reducir ocurrencias (pero mantener al menos 1)
        mina.ocurrencias = Math.max(1, Math.floor(mina.ocurrencias * 0.7));
        
        // Marcar como no reciente
        mina.esReciente = false;
      }
      
      // Actualizar control de cambios
      this.memoria.controlCambios.ultimoTablero = this.idPartidaActual;
      this.memoria.ultimaActualizacion = new Date().toISOString();
    }
  
    /**
     * Obtiene el mejor movimiento inicial basado en la memoria
     * @param {Object} tablero - Referencia al tablero
     * @returns {Object|null} - Celda recomendada o null si no hay datos
     */
    obtenerMejorMovimientoInicial(tablero) {
      // No hay datos suficientes
      if (Object.keys(this.memoria.patrones.movimientosIniciales).length === 0) {
        return null;
      }
      
      const movimientos = [];
      
      // Convertir a lista y calcular tasa de éxito
      for (const clave in this.memoria.patrones.movimientosIniciales) {
        const datos = this.memoria.patrones.movimientosIniciales[clave];
        const total = datos.victorias + datos.derrotas;
        
        if (total >= 2) { // Sólo considerar movimientos con suficientes datos
          const tasaExito = datos.victorias / total;
          
          // Convertir posición normalizada a coordenadas de tablero
          try {
            const [filaNorm, columnaNorm] = clave.split(',').map(parseFloat);
            
            // Denormalizar
            const fila = Math.round(filaNorm * (tablero.filas - 1));
            const columna = Math.round(columnaNorm * (tablero.columnas - 1));
            
            // Verificar validez
            if (fila >= 0 && fila < tablero.filas && columna >= 0 && columna < tablero.columnas) {
              movimientos.push({
                fila,
                columna,
                tasaExito,
                total,
                confianza: Math.min(0.9, 0.4 + total * 0.05)
              });
            }
          } catch (error) {
            console.error("Error al denormalizar posición:", error);
          }
        }
      }
      
      // No hay movimientos válidos
      if (movimientos.length === 0) {
        return null;
      }
      
      // Ordenar por tasa de éxito (mayor primero)
      movimientos.sort((a, b) => {
        // Si la diferencia es significativa, ordenar por tasa de éxito
        if (Math.abs(a.tasaExito - b.tasaExito) > 0.1) {
          return b.tasaExito - a.tasaExito;
        }
        // Si son similares, preferir el que tenga más datos
        return b.total - a.total;
      });
      
      // Retornar el mejor (con cierta aleatoriedad entre los mejores)
      const indiceAleatorio = Math.floor(Math.random() * Math.min(3, movimientos.length));
      return movimientos[indiceAleatorio];
    }
  
    /**
     * Obtiene el mejor segundo movimiento basado en la memoria
     * @param {Object} primerMovimiento - Datos del primer movimiento
     * @param {Object} tablero - Referencia al tablero
     * @returns {Object|null} - Celda recomendada o null si no hay datos
     */
    obtenerMejorSegundoMovimiento(primerMovimiento, tablero) {
      // No hay datos suficientes
      if (Object.keys(this.memoria.patrones.segundosMovimientos).length === 0) {
        return null;
      }
      
      // Normalizar primer movimiento
      const posNorm = this.normalizarPosicion(primerMovimiento.fila, primerMovimiento.columna, tablero);
      if (!posNorm) return null;
      
      const clavePrimero = `${posNorm.filaNorm},${posNorm.columnaNorm}`;
      const movimientos = [];
      
      // Buscar segundos movimientos que siguen a este
      for (const clave in this.memoria.patrones.segundosMovimientos) {
        if (clave.startsWith(clavePrimero + '|')) {
          const datos = this.memoria.patrones.segundosMovimientos[clave];
          const total = datos.victorias + datos.derrotas;
          
          if (total >= 2) { // Sólo considerar movimientos con suficientes datos
            const tasaExito = datos.victorias / total;
            
            // Extraer posición del segundo movimiento
            try {
              const claveSegundo = clave.split('|')[1];
              const [filaNorm, columnaNorm] = claveSegundo.split(',').map(parseFloat);
              
              // Denormalizar
              const fila = Math.round(filaNorm * (tablero.filas - 1));
              const columna = Math.round(columnaNorm * (tablero.columnas - 1));
              
              // Verificar validez
              if (fila >= 0 && fila < tablero.filas && columna >= 0 && columna < tablero.columnas) {
                movimientos.push({
                  fila,
                  columna,
                  tasaExito,
                  total,
                  confianza: Math.min(0.8, 0.3 + total * 0.05)
                });
              }
            } catch (error) {
              console.error("Error al denormalizar posición:", error);
            }
          }
        }
      }
      
      // No hay movimientos válidos
      if (movimientos.length === 0) {
        return null;
      }
      
      // Ordenar por tasa de éxito (mayor primero)
      movimientos.sort((a, b) => b.tasaExito - a.tasaExito);
      
      // Retornar el mejor
      return movimientos[0];
    }
  
    /**
     * Obtiene el mapa de minas conocidas para análisis de probabilidad
     * @returns {Object} - Mapa de minas conocidas
     */
    obtenerMapaMinasConocidas() {
      // Si se detectaron cambios, reducir confianza en datos históricos
      if (this.cambiosDetectados) {
        // Crear copia reducida
        const mapaReducido = {};
        
        for (const clave in this.memoria.mapaMinasConocidas) {
          const mina = this.memoria.mapaMinasConocidas[clave];
          
          // Copiar con ocurrencias reducidas
          mapaReducido[clave] = {
            ...mina,
            ocurrencias: Math.max(1, Math.floor(mina.ocurrencias * 0.5)),
            esReciente: false
          };
        }
        
        return mapaReducido;
      }
      
      // Si no hay cambios, devolver el mapa original
      return this.memoria.mapaMinasConocidas;
    }
  
    /**
     * Normaliza una posición para poder compararla entre tableros de distintos tamaños
     * @param {number} fila - Fila de la celda
     * @param {number} columna - Columna de la celda
     * @param {Object} tablero - Referencia al tablero
     * @returns {Object|null} - Posición normalizada (0-1) o null si hay error
     */
    normalizarPosicion(fila, columna, tablero) {
      if (fila === undefined || columna === undefined ||
          !tablero || tablero.filas === undefined || tablero.columnas === undefined) {
        return null;
      }
      
      try {
        // Normalizar a escala 0-1
        const filaNorm = tablero.filas > 1 ? fila / (tablero.filas - 1) : 0;
        const columnaNorm = tablero.columnas > 1 ? columna / (tablero.columnas - 1) : 0;
        
        // Discretizar a 10 niveles para generalizar
        const discretizar = (valor) => Math.floor(valor * 10) / 10;
        
        return {
          filaNorm: discretizar(filaNorm),
          columnaNorm: discretizar(columnaNorm)
        };
      } catch (error) {
        console.error("Error al normalizar posición:", error);
        return null;
      }
    }
  
    /**
     * Normaliza una secuencia de movimientos para comparar entre tableros
     * @param {Array} movimientos - Lista de movimientos
     * @param {Object} tablero - Referencia al tablero
     * @returns {string} - Representación normalizada de la secuencia
     */
    normalizarSecuencia(movimientos, tablero) {
      const secuenciaNormalizada = [];
      
      for (const movimiento of movimientos) {
        const posNorm = this.normalizarPosicion(movimiento.fila, movimiento.columna, tablero);
        if (posNorm) {
          secuenciaNormalizada.push(`${posNorm.filaNorm},${posNorm.columnaNorm}`);
        }
      }
      
      return secuenciaNormalizada.join('|');
    }
  
    /**
     * Obtiene estadísticas del sistema
     * @returns {Object} - Estadísticas
     */
    obtenerEstadisticas() {
      return {
        ...this.memoria.estadisticas,
        totalPartidas: this.memoria.partidas.length,
        minasConocidas: Object.keys(this.memoria.mapaMinasConocidas).length,
        patronesAprendidos: {
          movimientosIniciales: Object.keys(this.memoria.patrones.movimientosIniciales).length,
          segundosMovimientos: Object.keys(this.memoria.patrones.segundosMovimientos).length,
          secuenciasGanadoras: this.memoria.patrones.secuenciasGanadoras.length,
          secuenciasPerdedoras: this.memoria.patrones.secuenciasPerdedoras.length
        },
        cambiosDetectados: this.cambiosDetectados,
        contadorCambios: this.memoria.controlCambios?.contadorCambios || 0
      };
    }
  
    /**
     * Reinicia la memoria del sistema
     */
    reiniciarMemoria() {
      this.memoria = {
        mapaMinasConocidas: {},
        patrones: {
          movimientosIniciales: {},
          segundosMovimientos: {},
          secuenciasGanadoras: [],
          secuenciasPerdedoras: []
        },
        partidas: [],
        estadisticas: {
          partidasJugadas: 0,
          victorias: 0,
          derrotas: 0,
          minasTotales: 0,
          movimientosTotales: 0,
          tiempoTotal: 0
        },
        controlCambios: {
          ultimoTablero: null,
          contadorCambios: 0,
          historialCambios: []
        },
        ultimaActualizacion: new Date().toISOString()
      };
      
      this.idPartidaActual = Date.now();
      this.cambiosDetectados = false;
      this.guardarMemoria();
    }
  }
  
  export default GestorMemoria;