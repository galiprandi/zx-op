import { Routes, Route } from 'react-router-dom'
import { CheckInView } from './views/CheckInView'
import { OperationView } from './views/OperationView'
import { MonitorView } from './views/MonitorView'
import { Layout } from './components/Layout'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Layout>
        <Routes>
          <Route path="/" element={<CheckInView />} />
          <Route path="/checkin" element={<CheckInView />} />
          <Route path="/operation" element={<OperationView />} />
          <Route path="/monitor" element={<MonitorView />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App
