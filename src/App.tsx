import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Dashboard from './pages/Dashboard.tsx'
import TripDetail from './pages/TripDetail.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trip/:tripId" element={<TripDetail />} />
      </Route>
    </Routes>
  )
}
