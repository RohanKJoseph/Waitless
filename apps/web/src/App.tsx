import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PatientLayout } from "@/layouts/PatientLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AdminAppointmentsPage } from "@/pages/admin/Appointments";
import { AdminDashboardPage } from "@/pages/admin/Dashboard";
import { DepartmentsPage } from "@/pages/admin/Departments";
import { DoctorsPage } from "@/pages/admin/Doctors";
import { PatientsPage } from "@/pages/admin/Patients";
import { QueueManagementPage } from "@/pages/admin/QueueManagement";
import { SettingsPage } from "@/pages/admin/Settings";
import { AdminSwapsPage } from "@/pages/admin/Swaps";
import { BookAppointmentPage } from "@/pages/patient/BookAppointment";
import { PatientHomePage } from "@/pages/patient/Home";
import { MyAppointmentsPage } from "@/pages/patient/MyAppointments";
import { QueueStatusPage } from "@/pages/patient/QueueStatus";
import { SwapRequestsPage } from "@/pages/patient/SwapRequests";
import { LandingPage } from "@/pages/public/Landing";
import { LoginPage } from "@/pages/public/Login";
import { NotFoundPage } from "@/pages/public/NotFound";
import { PatientStartPage } from "@/pages/public/PatientStart";
import { ScanPage } from "@/pages/public/Scan";

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="start" element={<PatientStartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="scan/:token" element={<ScanPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["PATIENT"]} />}>
        <Route path="patient" element={<PatientLayout />}>
          <Route index element={<PatientHomePage />} />
          <Route path="book" element={<BookAppointmentPage />} />
          <Route path="appointments" element={<MyAppointmentsPage />} />
          <Route path="queue" element={<QueueStatusPage />} />
          <Route path="swaps" element={<SwapRequestsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["ADMIN", "STAFF"]} />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="appointments" element={<AdminAppointmentsPage />} />
          <Route path="queue" element={<QueueManagementPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="swaps" element={<AdminSwapsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="book" element={<Navigate to="/patient/book" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
