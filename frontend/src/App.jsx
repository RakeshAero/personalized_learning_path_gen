// Routes 
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';

function App() { 
  return (
    <Routes> 

      {/* Login */}
      <Route path="/" element={<Login />} /> 

      {/* Dashboard Protected Route */}
      <Route path='/dashboard' element={<ProtectedRoute> <Dashboard/> </ProtectedRoute>} />

      {/* Courses Protected Route */}
      <Route path='/courses' element={<ProtectedRoute> <Courses/> </ProtectedRoute>} />

    </Routes>
  );  
  //element = funtion()
}

export default App;
