import Tablero from './Tablero';
import GestorBanderas from '../logica/GestorBanderas';
import MotorProbabilidad from '../logica/MotorProbabilidad';
import AnalizadorCeldas from '../logica/AnalizadorCeldas';
import GestorMemoria from '../utilidades/GestorMemoria';

/**
 * Clase Juego - Controlador principal del juego de Buscaminas Inverso
 * Coordina todos los componentes y gestiona el flujo del juego
 */
class Juego {
  /**
   * Constructor
   * @param {number} filas - Número de filas del tablero
   * @param {number} columnas - Número de columnas del tablero
   * @param {Function} actualizarEstado - Función para actualizar la interfaz
   */
  constructor(filas, columnas, actualizarEstado) {
    // Dimensiones del tablero
    this.filas = filas;
    this.columnas = columnas;
    
    // Función para actualizar la interfaz
    this.actualizarEstado = actualizarEstado || (() => {});
    
    // Estado del juego
    this.enCurso = false;
    this.esperandoRespuesta = false;
    this.juegoTerminado = false;
    this.victoria = false;
    
    // Estadísticas
    this.tiempoInicio = null;
    this.tiempoJuego = 0;
    this.intervalTiempo = null;
    this.movimientosRealizados = 0;
    
    // Inicializar componentes
    this.tablero = new Tablero(filas, columnas);
    this.gestorMemoria = new GestorMemoria();
    this.gestorBanderas = new GestorBanderas(this.tablero);
    this.motorProbabilidad = new MotorProbabilidad(this.tablero);
    this.analizadorCeldas = new AnalizadorCeldas(
      this.tablero, 
      this.gestorBanderas, 
      this.motorProbabilidad,
      this.gestorMemoria
    );
    
    // Estado de la última acción
    this.ultimaAccion = {
      tipo: 'inicial',
      mensaje: 'Listo para comenzar',
      celda: null
    };
    
    // Celda actualmente seleccionada
    this.celdaActual = null;
  }
  
  /**
   * Inicializa una nueva partida
   */
  iniciarPartida() {
    // Reiniciar tablero
    this.tablero.reiniciar();
    
    // Reiniciar estado
    this.enCurso = true;
    this.esperandoRespuesta = false;
    this.juegoTerminado = false;
    this.victoria = false;
    this.movimientosRealizados = 0;
    
    // Reiniciar temporizador
    this.tiempoInicio = Date.now();
    this.tiempoJuego = 0;
    this.iniciarTemporizador();
    
    // Reiniciar historial de movimientos
    this.analizadorCeldas.reiniciarHistorial();
    
    // Mensaje inicial
    this.ultimaAccion = {
      tipo: 'inicial',
      mensaje: 'Partida iniciada. Seleccionando primera jugada...',
      celda: null
    };
    
    this.celdaActual = null;
    
    // Actualizar interfaz
    this.actualizarEstado(this.obtenerEstadoActual());
    
    // Programar primer movimiento con un pequeño retraso para la animación
    setTimeout(() => {
      this.realizarSiguienteMovimiento(true);
    }, 1000);
  }
  
  /**
   * Realiza el siguiente movimiento del sistema
   * @param {boolean} esPrimerMovimiento - Si es el primer movimiento de la partida
   */
  realizarSiguienteMovimiento(esPrimerMovimiento = false) {
    // Si el juego no está en curso o está esperando respuesta, no hacer nada
    if (!this.enCurso || this.esperandoRespuesta || this.juegoTerminado) {
      return;
    }
    
    try {
      // Seleccionar la mejor celda
      const seleccion = this.analizadorCeldas.seleccionarMejorCelda(esPrimerMovimiento);
      
      // Si son banderas, procesarlas y continuar con el siguiente movimiento
      if (seleccion.tipo === 'banderas') {
        this.procesarNuevasBanderas(seleccion.banderas, seleccion.razon);
        
        // Programar siguiente movimiento
        setTimeout(() => {
          this.realizarSiguienteMovimiento();
        }, 1000);
        
        return;
      }
      
      // Seleccionar la celda
      this.seleccionarCelda(seleccion.fila, seleccion.columna, seleccion.razon);
      
    } catch (error) {
      console.error("Error al realizar movimiento:", error);
      this.ultimaAccion = {
        tipo: 'error',
        mensaje: 'Error al calcular el siguiente movimiento',
        celda: null
      };
      this.actualizarEstado(this.obtenerEstadoActual());
    }
  }
  
  /**
   * Selecciona una celda para descubrir
   * @param {number} fila - Fila de la celda
   * @param {number} columna - Columna de la celda
   * @param {string} razon - Razón de la selección
   */
  seleccionarCelda(fila, columna, razon) {
    // Verificar si la celda es válida
    const celda = this.tablero.obtenerCelda(fila, columna);
    if (!celda || celda.descubierta || celda.tieneBandera) {
      console.warn("Celda inválida o ya procesada:", fila, columna);
      
      // Intentar otro movimiento
      setTimeout(() => {
        this.realizarSiguienteMovimiento();
      }, 500);
      
      return;
    }
    
    // Marcar como esperando respuesta
    this.esperandoRespuesta = true;
    this.celdaActual = { fila, columna };
    
    // Actualizar última acción
    this.ultimaAccion = {
      tipo: 'seleccion',
      mensaje: `He seleccionado la casilla (${fila+1},${columna+1}). ${razon}`,
      celda: { fila, columna }
    };
    
    // Incrementar contador de movimientos
    this.movimientosRealizados++;
    
    // Actualizar interfaz
    this.actualizarEstado(this.obtenerEstadoActual());
  }
  
  /**
   * Procesa las nuevas banderas colocadas
   * @param {Array} banderas - Lista de banderas colocadas
   * @param {string} razon - Razón de la colocación
   */
  procesarNuevasBanderas(banderas, razon) {
    if (!banderas || banderas.length === 0) return;
    
    // Colocar cada bandera en el tablero
    banderas.forEach(bandera => {
      const celda = this.tablero.obtenerCelda(bandera.fila, bandera.columna);
      if (celda && !celda.descubierta && !celda.tieneBandera) {
        this.tablero.establecerBandera(bandera.fila, bandera.columna, true);
      }
    });
    
    // Actualizar última acción
    this.ultimaAccion = {
      tipo: 'banderas',
      mensaje: `${razon} (${banderas.length} ${banderas.length === 1 ? 'bandera colocada' : 'banderas colocadas'})`,
      banderas: banderas.map(b => ({ fila: b.fila, columna: b.columna }))
    };
    
    // Verificar victoria
    this.verificarVictoria();
    
    // Actualizar interfaz
    this.actualizarEstado(this.obtenerEstadoActual());
  }
  
  /**
   * Procesa la respuesta del usuario para una celda
   * @param {string} respuesta - Respuesta ('vacío', '0', '1' ... '8', 'mina')
   */
  procesarRespuesta(respuesta) {
    // Verificar si está esperando respuesta
    if (!this.esperandoRespuesta || !this.celdaActual) {
      return;
    }
    
    const { fila, columna } = this.celdaActual;
    
    // Procesar respuesta
    if (respuesta === 'mina') {
      // Encontró una mina - Fin del juego (derrota)
      this.tablero.establecerValorCelda(fila, columna, 'M');
      
      // Registrar mina para aprendizaje
      this.gestorMemoria.registrarMinaEncontrada(fila, columna, this.tablero);
      
      // Terminar juego
      this.terminarJuego(false);
      
      // Actualizar última acción
      this.ultimaAccion = {
        tipo: 'derrota',
        mensaje: `¡BOOM! He encontrado una mina en (${fila+1},${columna+1}).`,
        celda: { fila, columna }
      };
    } else {
      // Valor numérico o vacío
      let valor = respuesta;
      if (respuesta === 'vacío') {
        valor = '';
      }
      
      // Actualizar tablero
      this.tablero.establecerValorCelda(fila, columna, valor);
      
      // Registrar movimiento en el analizador
      this.analizadorCeldas.registrarMovimiento({
        fila,
        columna,
        tipo: 'seleccion',
        respuesta: valor
      });
      
      // Actualizar última acción
      this.ultimaAccion = {
        tipo: 'respuesta',
        mensaje: `Celda (${fila+1},${columna+1}) revelada como ${respuesta === 'vacío' ? 'vacía' : respuesta}. Analizando...`,
        celda: { fila, columna },
        valor: respuesta
      };
      
      // Verificar victoria
      this.verificarVictoria();
    }
    
    // Ya no está esperando respuesta
    this.esperandoRespuesta = false;
    this.celdaActual = null;
    
    // Actualizar interfaz
    this.actualizarEstado(this.obtenerEstadoActual());
    
    // Si el juego continúa, programar siguiente movimiento
    if (this.enCurso && !this.juegoTerminado) {
      setTimeout(() => {
        this.realizarSiguienteMovimiento();
      }, 1500);
    }
  }
  
  /**
   * Verifica si se ha alcanzado la victoria
   * @returns {boolean} - true si hay victoria
   */
  verificarVictoria() {
    // Si ya terminó, no hacer nada
    if (this.juegoTerminado) return false;
    
    // Obtener celdas sin revelar
    const celdasSinRevolar = this.tablero.obtenerCeldasSinRevolar();
    const celdasConBandera = this.tablero.obtenerCeldasConBandera();
    
    // Si todas las celdas sin revelar tienen bandera, es victoria
    if (celdasSinRevolar.length === celdasConBandera.length && 
        celdasSinRevolar.every(c => c.tieneBandera)) {
      this.terminarJuego(true);
      return true;
    }
    
    return false;
  }
  
  /**
   * Termina el juego
   * @param {boolean} victoria - true si es victoria, false si es derrota
   */
  terminarJuego(victoria) {
    // Detener temporizador
    this.detenerTemporizador();
    
    // Actualizar estado
    this.enCurso = false;
    this.juegoTerminado = true;
    this.victoria = victoria;
    
    // Registrar resultado en la memoria
    this.gestorMemoria.registrarResultadoPartida(
      victoria,
      this.analizadorCeldas.obtenerHistorialMovimientos(),
      this.tablero,
      this.tiempoJuego
    );
    
    // Actualizar última acción si es victoria
    if (victoria) {
      this.ultimaAccion = {
        tipo: 'victoria',
        mensaje: '¡Victoria! He identificado correctamente todas las minas del tablero.',
        celda: null
      };
    }
    
    // Actualizar interfaz
    this.actualizarEstado(this.obtenerEstadoActual());
  }
  
  /**
   * Inicia el temporizador del juego
   */
  iniciarTemporizador() {
    // Detener si ya existe
    this.detenerTemporizador();
    
    // Iniciar nuevo temporizador
    this.intervalTiempo = setInterval(() => {
      this.tiempoJuego = Math.floor((Date.now() - this.tiempoInicio) / 1000);
      this.actualizarEstado(this.obtenerEstadoActual());
    }, 1000);
  }
  
  /**
   * Detiene el temporizador del juego
   */
  detenerTemporizador() {
    if (this.intervalTiempo) {
      clearInterval(this.intervalTiempo);
      this.intervalTiempo = null;
    }
  }
  
  /**
   * Reinicia el juego
   */
  reiniciarJuego() {
    // Detener temporizador
    this.detenerTemporizador();
    
    // Reiniciar componentes
    this.tablero = new Tablero(this.filas, this.columnas);
    this.gestorBanderas = new GestorBanderas(this.tablero);
    this.motorProbabilidad = new MotorProbabilidad(this.tablero);
    this.analizadorCeldas = new AnalizadorCeldas(
      this.tablero, 
      this.gestorBanderas, 
      this.motorProbabilidad,
      this.gestorMemoria
    );
    
    // Reiniciar estado
    this.enCurso = false;
    this.esperandoRespuesta = false;
    this.juegoTerminado = false;
    this.victoria = false;
    this.tiempoJuego = 0;
    this.movimientosRealizados = 0;
    
    // Reiniciar variables de interfaz
    this.ultimaAccion = {
      tipo: 'reinicio',
      mensaje: 'Juego reiniciado. Presiona "Iniciar Juego" para comenzar.',
      celda: null
    };
    
    this.celdaActual = null;
    
    // Actualizar interfaz
    this.actualizarEstado(this.obtenerEstadoActual());
  }
  
  /**
   * Cambia el tamaño del tablero
   * @param {number} filas - Nuevo número de filas
   * @param {number} columnas - Nuevo número de columnas
   */
  cambiarTamañoTablero(filas, columnas) {
    if (this.enCurso) {
      // No permitir cambiar durante el juego
      return;
    }
    
    this.filas = filas;
    this.columnas = columnas;
    
    // Reiniciar con nuevo tamaño
    this.reiniciarJuego();
  }
  
  /**
   * Obtiene el estado actual del juego para la interfaz
   * @returns {Object} - Estado actual
   */
  obtenerEstadoActual() {
    return {
      tablero: this.tablero,
      enCurso: this.enCurso,
      esperandoRespuesta: this.esperandoRespuesta,
      juegoTerminado: this.juegoTerminado,
      victoria: this.victoria,
      tiempoJuego: this.tiempoJuego,
      movimientosRealizados: this.movimientosRealizados,
      ultimaAccion: this.ultimaAccion,
      celdaActual: this.celdaActual,
      estadisticas: this.gestorMemoria.obtenerEstadisticas()
    };
  }
  
  /**
   * Formatea el tiempo de juego
   * @returns {string} - Tiempo formateado (MM:SS)
   */
  formatearTiempo() {
    const minutos = Math.floor(this.tiempoJuego / 60);
    const segundos = this.tiempoJuego % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }
  
  /**
   * Reinicia la memoria del sistema
   */
  reiniciarMemoria() {
    this.gestorMemoria.reiniciarMemoria();
    this.actualizarEstado(this.obtenerEstadoActual());
  }
}

export default Juego;