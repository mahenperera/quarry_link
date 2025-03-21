import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import ProductCatalogue from './pages/ProductCatalogue';
import InventoryControl from './pages/InventoryControl';

function App() {
  return (
    <>
      
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
