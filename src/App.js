import React from 'react';
import './App.css';
import BuscaminasInverso from './componentes/BuscaminasInverso';

/**
 * Aplicación principal que renderiza el juego BuscaminasInverso
 */
function App() {
  return (
    <div className="App min-h-screen">
      <BuscaminasInverso />
    </div>
  );
}

export default App;