import { Routes, Route, useLocation } from 'react-router-dom'
import './index.css'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Suppliers from './pages/Suppliers'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Recommendations from './pages/Recommendations'

function App() {
  const location = useLocation();
  // Derive the active page from the path for the Navbar and Sidebar highlighting
  const activePage = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activePage={activePage} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar activePage={activePage} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
