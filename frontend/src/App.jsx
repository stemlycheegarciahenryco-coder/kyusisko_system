import { Routes, Route, Navigate } from 'react-router-dom';



//PUBLIC
import OrganizationRegisterPage from './OrganizationRegisterPage';
import ProviderGuidelines from './ProviderGuidelines';
//Scholarship Related

import ProgramView from './org/ScholarshipManager';


//RootAdmin
import RootOrganization from './rootadmin/RootOrganization';
import Dashboard from './rootadmin/RootDashboard';
import Reports from './rootadmin/RootReports';
import Notifications from './rootadmin/RootNotifications';
import RootLayout from './rootadmin/RootLayout';
import StudentLog from './rootadmin/RootStudentLog';
import RootAudit from './rootadmin/RootAudit';

//Student
import StudentRegister from './student/StudentRegister';


import StudentProfile from './student/StudentProfile';
import StudentSettings from './student/StudentSettings';
import StudentLayout from './student/StudentLayout';
import StudentOnboarding from './student/StudentOnboarding';
import MyScholarships from './student/MyScholarships';
import StudentMessages from './student/StudentMessages';

//Sponsors
import OrgApplicantPrograms from './org/OrgApplicantsPrograms';
import OrgApplicants from './org/OrgApplicants';
import OrgLayout from './org/OrgLayout';
import OrgDashboard from './org/OrgDashboard';
import ApplicationDetails from './org/ApplicationDetails';
import OrgProfile from './org/OrgProfile';
import ProtectedRoutes from './ProtectedRoutes'; // Import the guard
import OrgHistory from './org/OrgHistory';
import CreateScholarship from './component/CreateScholarship';
import OrgMessages from './org/OrgMessages';
import {CompliancePage} from './CompliancePage';

import ApplicationForm from './ApplicationForm';



import  VerifyReset from  './VerifyReset';




import ScholarList from './ScholarshipList';


import LogIn from './LogIn';


import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';


import Home from './Home';

export default function App() {
  return (
    <Routes>
      {/* 1. THE FRONT DOOR: Home Page is the first thing everyone sees */}
      <Route path="/" element={<Home />} />
      <Route path="/organization-register" element= {<OrganizationRegisterPage/>}/>
      <Route path="/provider-guidelines" element={<ProviderGuidelines />} />
     <Route path="/student-onboard" element= {<StudentOnboarding/>}/>

      {/* 2. STUDENT FLOW: Publicly accessible scholarship routes */}

      <Route path="/student-register" element={<StudentRegister />} />
      {/* 3. ADMIN AUTH: Entry point for Root and Org admins */}
      <Route path="/login" element={<LogIn />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset" element={<VerifyReset />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/compliance/:id" element={<CompliancePage />} />

          

      {/* 4. ORG (SUB-ADMIN) LAYOUT: Wrapped in OrgLayout */}
     <Route element={<ProtectedRoutes allowedRoles={['sub_admin']} />}>
     <Route element={<OrgLayout />}>
       <Route path="/OrgDashboard" element={<OrgDashboard />} />
        {/*MIGHT DELETE LATERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR*/ }
        <Route path="/scholarship-applications/:id/applicants/:appId" element={<ApplicationDetails />} />



        {/* The Specific Pages (Triggered after selection) ORG */}
        
       <Route path="/OrgApplicantPrograms" element={<OrgApplicantPrograms />} />
      <Route path="/scholarship-applications/:id/applicants" element={<OrgApplicants />} />
        <Route path="/ProgramView" element={<ProgramView />} />
          <Route path="/OrgMessages" element={<OrgMessages />} />
        <Route path="/OrgProfile" element={<OrgProfile />} />
        <Route path="/OrgHistory" element={<OrgHistory />} />
        <Route path="/create-scholarship" element={<CreateScholarship />} />
       
      </Route>
</Route>


      {/* 5. ROOT ADMIN LAYOUT: Wrapped in RootLayout */}
     <Route element={<ProtectedRoutes allowedRoles={['root_admin']} />}>
     <Route element={<RootLayout />}>
        <Route path="/RootDashboard" element={<Dashboard />} />
        <Route path="/RootReports" element={<Reports />} />
        <Route path="/RootOrganization" element={<RootOrganization />} />
        <Route path="/RootStudLog" element={<StudentLog />} />
        <Route path="/RootNotifications" element={<Notifications />} />
        <Route path="/RootAudit" element={<RootAudit />} />
        </Route>
      </Route>


      

      {/* 6. Student LAYOUT: Wrapped in StudentLayout */}
      
      <Route element={<ProtectedRoutes allowedRoles={['student']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/scholarships" element={<ScholarList />} />
        <Route path="/StudentProfile" element={<StudentProfile />} />
        <Route path="/MyScholarships" element={<MyScholarships />} />
        <Route path="/StudentSettings" element={<StudentSettings />} />
        <Route path="/apply/:id" element={<ApplicationForm />} />
        <Route path="/student-onboard" element={<StudentOnboarding />} />
        <Route path="/StudentMessages" element={<StudentMessages />} />
        </Route>
        
      </Route>

      


      
      

      
      {/* CATCH-ALL: If someone gets lost, send them back to the Home Page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}