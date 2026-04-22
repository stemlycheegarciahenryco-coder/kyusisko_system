import { Routes, Route, Navigate } from 'react-router-dom';

import FormBuilder from './ScholarshipFormBuilder';
import ScholarFields from './ScholarshipManager';

import SuperRootConsole from './superroot/SuperRootConsole';
import SuperAuditLogs from './superroot/SuperAuditLogs';
import SuperLayout from './superroot/SuperLayout';


import ApplicationForm from './ApplicationForm';
import  ScholarshipSelector from './component/ScholarshipSelector';
import ApplicationDetails from './org/ApplicationDetails';
import StudentSettings from './student/StudentSettings';
import  VerifyReset from  './VerifyReset';
import SetupProfile from './student/SetupProfile';

import StudentNotification from './student/StudentNotification';
import RootOrganization from './rootadmin/RootOrganization';

import ScholarList from './ScholarshipList';
import StudentProfile from './student/StudentProfile';
import StudentLayout from './student/StudentLayout';
import LogIn from './LogIn';
import RootLayout from './rootadmin/RootLayout';
import OrgLayout from './org/OrgLayout';
import OrgDashboard from './org/OrgDashboard';
import Dashboard from './rootadmin/RootDashboard';
import Reports from './rootadmin/RootReports';
import Notifications from './rootadmin/RootNotifications';

import StudentLog from './rootadmin/RootStudentLog';
import OrgApplicants from './org/OrgApplicants';
import OrgNotif from './org/OrgNotif';
import OrgProfile from './org/OrgProfile';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import StudentLogin from './StudentLogin';
import StudentRegister from './StudentRegister';
import Home from './Home';
export default function App() {
  return (
    <Routes>
      {/* 1. THE FRONT DOOR: Home Page is the first thing everyone sees */}
      <Route path="/" element={<Home />} />

      {/* 2. STUDENT FLOW: Publicly accessible scholarship routes */}
      
      
      <Route path="/student-login"    element={<StudentLogin />} />
      <Route path="/student-register" element={<StudentRegister />} />

      {/* 3. ADMIN AUTH: Entry point for Root and Org admins */}
      <Route path="/rootlogin" element={<LogIn />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset" element={<VerifyReset />} />
      <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<SuperLayout />}>
          <Route path="/SuperRootConsole" element={<SuperRootConsole />} />
          <Route path="/super/audit" element={<SuperAuditLogs />} />
          <Route path="/super/manage-admins" element={<div>System Admin List Component</div>} />
          <Route path="/super/orgs" element={<div>Organizations List Component</div>} />
          <Route path="/super/students" element={<div>Students List Component</div>} />
        </Route>

      {/* 4. ORG (SUB-ADMIN) LAYOUT: Wrapped in OrgLayout */}
      <Route element={<OrgLayout />}>
        <Route path="/OrgDashboard" element={<OrgDashboard />} />
        {/* The Selector Page (Handles both Applicants and Fields) */}
        <Route path="/SelectScholarship/:mode" element={<ScholarshipSelector />} />
        <Route path="/scholarship/:id/applications/:appId" element={<ApplicationDetails />} />
        {/* The Specific Pages (Triggered after selection) */}
        <Route path="/scholarship/:id/applicants" element={<OrgApplicants />} />
        <Route path="/builder/:scholarshipId" element={<FormBuilder />} />
        <Route path="/ScholarFields" element={<ScholarFields />} />
        <Route path="/OrgNotif" element={<OrgNotif />} />
        <Route path="/OrgProfile" element={<OrgProfile />} />
      </Route>



      {/* 5. ROOT ADMIN LAYOUT: Wrapped in RootLayout */}
      <Route element={<RootLayout />}>
        <Route path="/RootDashboard" element={<Dashboard />} />
        <Route path="/RootReports" element={<Reports />} />
        <Route path="/RootOrganization" element={<RootOrganization />} />
        <Route path="/RootStudLog" element={<StudentLog />} />
        <Route path="/RootNotifications" element={<Notifications />} />
        
      </Route>

      {/* 6. Student LAYOUT: Wrapped in StudentLayout */}
      
      <Route element={<StudentLayout />}>
        <Route path="/scholarships" element={<ScholarList />} />
        <Route path="/student-profile" element={<StudentProfile />} />
        <Route path="/StudentNotification" element={<StudentNotification />} />
        <Route path="/StudentSettings" element={<StudentSettings />} />
        <Route path="/apply/:id" element={<ApplicationForm />} />
      </Route>
      <Route path="/setup-profile" element={<SetupProfile />} />
      

      
      {/* CATCH-ALL: If someone gets lost, send them back to the Home Page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}