// Routes 
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CreateCourse from './pages/CreateCourse';
import CourseList from './pages/CourseList';
import CreateModule from './pages/CreateModule';
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

      {/* Course-List Protected Route */}
      <Route path='/courses/:id' element={<ProtectedRoute> <CourseList/> </ProtectedRoute>} />

      {/* Create-Module Protected Route */}
      <Route path='/create-module' element={<ProtectedRoute> <CreateModule/> </ProtectedRoute>} />

      

    </Routes>
  );  
  //element = funtion()
}

export default App;
