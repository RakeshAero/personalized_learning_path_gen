// Routes 
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CreateCourse from './pages/CreateCourse';
import Navbar from './components/navbar';

function App() { 
  return (
    <Routes> 

      {/* Login */}
      <Route path="/" element={<Login />} /> 

      {/* Dashboard Protected Route */}
      <Route path='/dashboard' element={<ProtectedRoute> <Dashboard/> </ProtectedRoute>} />

      {/* Courses Protected Route */}
      <Route path='/courses' element={<ProtectedRoute> <Courses/> </ProtectedRoute>} />

      {/* Create-Course Protected Route */}
      <Route path='/create-course' element={<ProtectedRoute> <CreateCourse/> </ProtectedRoute>} />

    </Routes>
  );  
  //element = funtion()
}

export default App;
