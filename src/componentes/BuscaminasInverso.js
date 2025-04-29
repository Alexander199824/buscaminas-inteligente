import React, { useState, useEffect } from 'react';
import TableroVisual from './TableroVisual';
import PanelControl from './PanelControl';
import PanelEstadisticas from './PanelEstadisticas';
import PanelRespuesta from './PanelRespuesta';
import Juego from '../modelos/Juego';
import { TAMAÑOS_TABLERO } from '../constantes/ConfiguracionJuego';

/**
 * Componente principal del juego BuscaminasInverso
 * Integra todos los componentes y gestiona la interacción con el usuario
 */
const BuscaminasInverso = () => {
  // Referencias al juego
  const [juego, setJuego] = useState(null);
  
  // Estado del juego para la UI
  const [estadoJuego, setEstadoJuego] = useState({
    enCurso: false,
    esperandoRespuesta: false,
    juegoTerminado: false,
    victoria: false,
    celdaActual: null,
    ultimaAccion: { tipo: 'inicial', mensaje: 'Cargando juego...' }
  });
  
  // Configuración
  const [tamañoSeleccionado, setTamañoSeleccionado] = useState(TAMAÑOS_TABLERO[0]);
  const [temaColor, setTemaColor] = useState('claro');
  
  // Configurar el juego al inicio
  useEffect(() => {
    const nuevoJuego = new Juego(
      tamañoSeleccionado.filas,
      tamañoSeleccionado.columnas,
      actualizarEstadoJuego
    );
    
    setJuego(nuevoJuego);
    actualizarEstadoJuego(nuevoJuego.obtenerEstadoActual());
  }, [tamañoSeleccionado]);
  
  // Función para actualizar el estado del juego en la UI
  const actualizarEstadoJuego = (estado) => {
    setEstadoJuego(estado);
  };
  
  // Iniciar una nueva partida
  const iniciarJuego = () => {
    if (juego) {
      juego.iniciarPartida();
    }
  };
  
  // Reiniciar el juego actual
  const reiniciarJuego = () => {
    if (juego) {
      juego.reiniciarJuego();
    }
  };
  
  // Cambiar el tamaño del tablero
  const cambiarTamañoTablero = (nuevoTamaño) => {
    setTamañoSeleccionado(nuevoTamaño);
  };
  
  // Manejar la respuesta del usuario
  const manejarRespuesta = (respuesta) => {
    if (juego && estadoJuego.esperandoRespuesta) {
      juego.procesarRespuesta(respuesta);
    }
  };
  
  // Reiniciar la memoria del sistema
  const reiniciarMemoria = () => {
    if (juego) {
      juego.reiniciarMemoria();
    }
  };
  
  // Cambiar el tema de color
  const cambiarTemaColor = (tema) => {
    setTemaColor(tema);
  };
  
  // Obtener clases CSS según el tema
  const obtenerClasesTema = () => {
    return {
      principal: temaColor === 'oscuro' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800',
      tarjeta: temaColor === 'oscuro' ? 'bg-gray-800 shadow-xl' : 'bg-gray-50 shadow-sm border border-gray-200',
      cabecera: temaColor === 'oscuro' ? 'bg-indigo-800 text-white' : 'bg-gray-100 text-gray-800 border-b border-gray-200',
      botonPrimario: temaColor === 'oscuro' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
      botonSecundario: temaColor === 'oscuro' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800',
      botonSeleccionado: temaColor === 'oscuro' ? 'bg-indigo-500 text-white' : 'bg-blue-500 text-white',
      panel: temaColor === 'oscuro' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200',
      mensaje: temaColor === 'oscuro' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200',
      selector: temaColor === 'oscuro' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300',
      victoria: temaColor === 'oscuro' ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800',
      derrota: temaColor === 'oscuro' ? 'bg-red-800 text-white' : 'bg-red-100 text-red-800'
    };
  };
  
  const clasesTema = obtenerClasesTema();
  
  return (
    <div className={`flex flex-col min-h-screen ${clasesTema.principal}`}>
      {/* Cabecera */}
      <header className={`px-4 py-3 ${clasesTema.cabecera} flex justify-between items-center`}>
        <h1 className="text-xl font-bold">Buscaminas Inverso</h1>
        
        <div className="flex gap-2">
          <button
            className={`px-2 py-1 rounded ${temaColor === 'claro' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
            onClick={() => cambiarTemaColor('claro')}
          >
            Claro
          </button>
          <button
            className={`px-2 py-1 rounded ${temaColor === 'oscuro' ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'}`}
            onClick={() => cambiarTemaColor('oscuro')}
          >
            Oscuro
          </button>
        </div>
      </header>
      
      {/* Contenido principal */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Panel izquierdo */}
        <div className={`w-full md:w-1/4 p-4 ${clasesTema.tarjeta}`}>
          <PanelControl 
            tema={clasesTema}
            tamañosTablero={TAMAÑOS_TABLERO}
            tamañoSeleccionado={tamañoSeleccionado}
            enCurso={estadoJuego.enCurso}
            juegoTerminado={estadoJuego.juegoTerminado}
            victoria={estadoJuego.victoria}
            cambiarTamañoTablero={cambiarTamañoTablero}
            iniciarJuego={iniciarJuego}
            reiniciarJuego={reiniciarJuego}
            reiniciarMemoria={reiniciarMemoria}
            estadisticas={estadoJuego.estadisticas}
          />
          
          <PanelEstadisticas 
            tema={clasesTema}
            tiempoJuego={estadoJuego.tiempoJuego}
            movimientosRealizados={estadoJuego.movimientosRealizados}
            tablero={estadoJuego.tablero}
            enCurso={estadoJuego.enCurso}
            juegoTerminado={estadoJuego.juegoTerminado}
          />
        </div>
        
        {/* Panel central - Tablero */}
        <div className="w-full md:w-2/4 p-4 flex flex-col items-center">
          {/* Panel de mensaje */}
          <div className={`w-full p-3 mb-4 rounded ${getMensajeClass(estadoJuego.ultimaAccion.tipo, clasesTema)}`}>
            <p className="font-medium">
              {estadoJuego.ultimaAccion.mensaje || 'Listo para iniciar el juego'}
            </p>
          </div>
          
          {/* Panel de respuesta cuando se espera input del usuario */}
          {estadoJuego.esperandoRespuesta && estadoJuego.celdaActual && (
            <PanelRespuesta 
              tema={clasesTema}
              celdaActual={estadoJuego.celdaActual}
              manejarRespuesta={manejarRespuesta}
            />
          )}
          
          {/* Tablero visual */}
          {estadoJuego.tablero && (
            <TableroVisual 
              tema={clasesTema}
              tablero={estadoJuego.tablero}
              celdaActual={estadoJuego.celdaActual}
              ultimaAccion={estadoJuego.ultimaAccion}
            />
          )}
        </div>
        
        {/* Panel derecho - Instrucciones */}
        <div className={`w-full md:w-1/4 p-4 ${clasesTema.tarjeta}`}>
          <div className={`p-4 rounded border ${clasesTema.panel}`}>
            <h2 className="text-lg font-semibold mb-3">Instrucciones:</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>El sistema (IA) seleccionará automáticamente una casilla del tablero para descubrir.</li>
              <li>Tú debes indicar qué hay en esa casilla: vacío, un número (0-8) o una mina.</li>
              <li>Los números indican cuántas minas hay en las 8 casillas adyacentes.</li>
              <li>El sistema usará esta información para decidir su siguiente movimiento.</li>
              <li>El sistema colocará banderas donde tenga certeza absoluta que hay minas.</li>
              <li>El juego termina cuando el sistema encuentra una mina (pierdes) o cuando identifica todas las minas correctamente (ganas).</li>
            </ol>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Consejos:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Crea un mapa mental o en papel para recordar dónde colocaste las minas.</li>
                <li>Mantén un tablero consistente - las reglas del Buscaminas deben respetarse.</li>
                <li>El sistema aprende de partidas anteriores, así que puede mejorar con el tiempo.</li>
              </ul>
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Valores posibles:</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className={`px-2 py-1 rounded border ${clasesTema.panel}`}>Vacío</span>
                <span className={`px-2 py-1 rounded border ${clasesTema.panel}`}>0</span>
                <span className={`px-2 py-1 rounded border ${clasesTema.panel}`}>1-8</span>
                <span className={`px-2 py-1 rounded border ${clasesTema.panel}`}>Mina 💣</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Determina la clase CSS para el panel de mensaje según el tipo de acción
 * @param {string} tipo - Tipo de acción
 * @param {Object} clasesTema - Clases CSS del tema
 * @returns {string} - Clase CSS para el panel
 */
const getMensajeClass = (tipo, clasesTema) => {
  switch (tipo) {
    case 'victoria':
      return clasesTema.victoria;
    case 'derrota':
      return clasesTema.derrota;
    case 'seleccion':
      return `${clasesTema.panel} border-yellow-400 bg-yellow-50 dark:bg-yellow-900 dark:border-yellow-700`;
    case 'banderas':
      return `${clasesTema.panel} border-orange-400 bg-orange-50 dark:bg-orange-900 dark:border-orange-700`;
    case 'respuesta':
      return `${clasesTema.panel} border-blue-400 bg-blue-50 dark:bg-blue-900 dark:border-blue-700`;
    case 'error':
      return `${clasesTema.panel} border-red-400 bg-red-50 dark:bg-red-900 dark:border-red-700`;
    default:
      return clasesTema.panel;
  }
};

export default BuscaminasInverso;