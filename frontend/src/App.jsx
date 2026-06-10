// Routes 
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import InstructorRoute from './routes/InstructorRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CreateCourse from './pages/CreateCourse';
import CourseList from './pages/CourseList';
import CreateModule from './pages/CreateModule';
import Assessments from './pages/Assessments';
import Questions from './pages/Questions';
import CreateAssessment from './pages/CreateAssessment';
import CreateQuestion from './pages/CreateQuestion';
import Navbar from './components/navbar';
import TakeOnboardingAssessment from './pages/TakeOnboardingAssessment';
import LearnerDashboard from './pages/LearnerDashboard';
import SkillResult from './pages/SkillResult';


function App() { 
  return (
    <Routes> 

      {/* Login */}
      <Route path="/" element={<Login />} />

      {/* Register */}
      <Route path="/register" element={<Register />} />

      {/* Dashboard Protected Route */}
      <Route path='/dashboard' element={<ProtectedRoute> <Dashboard/> </ProtectedRoute>} />

      {/* Learner Dashboard */}
      <Route path='/learner-dashboard' element={<ProtectedRoute> <LearnerDashboard/> </ProtectedRoute>} />

      {/* Courses Protected Route */}
      <Route path='/courses' element={<ProtectedRoute> <Courses/> </ProtectedRoute>} />

      {/* Create-Course Protected Route */}
      <Route path='/create-course' element={<InstructorRoute> <CreateCourse/> </InstructorRoute>} />

      {/* Course-List Protected Route */}
      <Route path='/courses/:id' element={<ProtectedRoute> <CourseList/> </ProtectedRoute>} />

      {/* Create-Module Protected Route */}
      <Route path='/create-module' element={<InstructorRoute> <CreateModule/> </InstructorRoute>} />

      {/* Assessments Protected Route */}
      <Route path='/assessments' element={<ProtectedRoute> <Assessments/> </ProtectedRoute>} />

      {/* Assessments Protected Route */}
      <Route path='/questions/:id' element={<ProtectedRoute> <Questions/> </ProtectedRoute>} />

      {/* Create Assessment - Instructor/Admin only */}
      <Route path='/create-assessment' element={<InstructorRoute> <CreateAssessment/> </InstructorRoute>} />

      {/* Create Question - Instructor/Admin only */}
      <Route path='/create-question' element={<InstructorRoute> <CreateQuestion/> </InstructorRoute>} />

      {/* Take Onboarding Assessment */}
      <Route path='/onboarding/:id' element={<ProtectedRoute> <TakeOnboardingAssessment/> </ProtectedRoute>} />

      {/* Skill assessment result */}
      <Route path='/skill-result/:assessmentId' element={<ProtectedRoute> <SkillResult/> </ProtectedRoute>} />

    </Routes>
  );  
  //element = funtion()
}

export default App;
