import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminRegister from "./pages/AdminRegister";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import Prescriptions from "./pages/Prescriptions";
import Notifications from "./pages/Notifications";
import Assistant from "./pages/Assistant";
import Billing from "./pages/Billing";
import DoctorProfile from "./pages/DoctorProfile";
import Admin from "./pages/Admin";
import LabTests from "./pages/LabTests";
import ConsultationRoom from "./pages/ConsultationRoom";
import Insurance from "./pages/Insurance";
import EmergencyContacts from "./pages/EmergencyContacts";
import SymptomChecker from "./pages/SymptomChecker";
import Pharmacy from "./pages/Pharmacy";
import PharmacyOrders from "./pages/PharmacyOrders";
import HealthAnalytics from "./pages/HealthAnalytics";
import MedicineReminders from "./pages/MedicineReminders";
import BedManagement from "./pages/BedManagement";
import AdminDepartments from "./pages/AdminDepartments";
import Admissions from "./pages/Admissions";
import EmergencyPatient from "./pages/EmergencyPatient";
import EmergencyAdmin from "./pages/EmergencyAdmin";
import SubmitFeedback from "./pages/SubmitFeedback";
import FeedbackAnalytics from "./pages/FeedbackAnalytics";
import Revenue from "./pages/Revenue";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-admin" element={<AdminRegister />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Doctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consultation/:id"
            element={
              <ProtectedRoute allowedRoles={["doctor", "patient"]}>
                <ConsultationRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/records"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <MedicalRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Prescriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insurance"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Insurance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-contacts"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <EmergencyContacts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assistant"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Assistant />
              </ProtectedRoute>
            }
          />
          <Route
            path="/symptom-checker"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <SymptomChecker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Pharmacy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PharmacyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <HealthAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reminders"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <MedicineReminders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor-profile"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDepartments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bed-management"
            element={
              <ProtectedRoute allowedRoles={["admin", "doctor"]}>
                <BedManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admissions"
            element={
              <ProtectedRoute allowedRoles={["admin", "doctor"]}>
                <Admissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <EmergencyPatient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/emergencies"
            element={
              <ProtectedRoute allowedRoles={["admin", "doctor"]}>
                <EmergencyAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <SubmitFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <FeedbackAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab-tests"
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
                <LabTests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/revenue"
            element={
              <ProtectedRoute allowedRoles={["admin", "doctor"]}>
                <Revenue />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
