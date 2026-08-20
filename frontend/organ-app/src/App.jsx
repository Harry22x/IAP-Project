import AdminDash from './components/AdminDash'
import AdminReports from './components/AdminReports'
import AdminUsers from './components/AdminUsers'
// import Founders from './components/HomeFounders'
// import Home from './components/Home'
import HPDash from './components/HPDash'
import HPHistory from './components/HPHistory'
import LogIn from './components/LogIn'
import Register from './components/Register'
import TCDash from './components/TCDash'
import TCPatients from './components/TCPatients'
import TCMatches from './components/TCMatches'
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom'

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path='/' element={<Home />} /> */}
        <Route path='/admin' element={<AdminDash />} />
        <Route path='/reports' element={<AdminReports />} />
        <Route path='/users' element={<AdminUsers />} />
        {/* <Route path='/founders' element={<Founders />} /> */}
        <Route path='/register' element={<Register />} />
        <Route path='/' element={<LogIn />} />
        <Route path='/hp' element={<HPDash />} />
        <Route path='/history' element={<HPHistory />} />
        <Route path='/tc' element={<TCDash />} />
        <Route path='/patients' element={<TCPatients />} />
        <Route path='/matches' element={<TCMatches />} />
      </Routes>
    </Router>
  )
}

export default App
