import api from "./client";

// ---------- Auth ----------
export const registerPatient = (data) => api.post("/api/auth/register/patient", data);
export const registerDoctor = (data) => api.post("/api/auth/register/doctor", data);
export const registerAdmin = (data, secret) => api.post("/api/auth/register/admin", data, { headers: { "admin-secret": secret } });
export const loginUser = (data) => {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);
  return api.post("/api/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
};
export const getCurrentUser = () => api.get("/api/auth/me");

// ---------- Users ----------
export const updateMyProfile = (data) => api.put("/api/users/me", data);

// ---------- Doctors ----------
export const listDoctors = (specialization) =>
  api.get("/api/doctors", { params: specialization ? { specialization } : {} });
export const getDoctor = (id) => api.get(`/api/doctors/${id}`);
export const updateDoctorProfile = (data) => api.put("/api/doctors/profile", data);
export const adminUpdateDoctorProfile = (id, data) => api.put(`/api/doctors/${id}/profile`, data);

// ---------- Appointments ----------
export const bookAppointment = (data) => api.post("/api/appointments", data);
export const getMyAppointments = () => api.get("/api/appointments/my");
export const updateAppointmentStatus = (id, data) =>
  api.put(`/api/appointments/${id}/status`, data);
export const updateAppointmentNotes = (id, notes) =>
  api.put(`/api/appointments/${id}/notes`, { notes });
export const getAppointment = (id) => api.get(`/api/appointments/${id}`);

// ---------- Medical Records ----------
export const getMyRecords = () => api.get("/api/records/my");
export const getPatientRecords = (patientId) => api.get(`/api/records/patient/${patientId}`);
export const createRecord = (data) => api.post("/api/records", data);
export const deleteRecord = (id) => api.delete(`/api/records/${id}`);

// ---------- Prescriptions ----------
export const createPrescription = (data) => api.post("/api/prescriptions", data);
export const getMyPrescriptions = () => api.get("/api/prescriptions/my");
export const getPrescriptionByAppointment = (appointmentId) =>
  api.get(`/api/prescriptions/appointment/${appointmentId}`);

// ---------- Notifications ----------
export const getNotifications = () => api.get("/api/notifications");
export const markNotificationRead = (id) => api.put(`/api/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put("/api/notifications/read-all");

// ---------- AI Assistant ----------
export const sendChatMessage = (message) => api.post("/api/assistant/chat", { message });
export const getChatHistory = () => api.get("/api/assistant/history");
export const checkSymptoms = (data) => api.post("/api/assistant/symptom-check", data);

// ---------- Schedules ----------
export const createTimeSlot = (data) => api.post("/api/schedules/", data);
export const getDoctorSlots = (doctorId, date = null) => 
  api.get(`/api/schedules/${doctorId}`, { params: date ? { slot_date: date } : {} });
export const deleteTimeSlot = (slotId) => api.delete(`/api/schedules/${slotId}`);
export const updateSlotStatus = (id, status) => api.put(`/api/schedules/${id}/status`, { is_booked: status });
export const getMyTimeSlots = () => api.get("/api/schedules/my-slots");

// ---------- Reviews ----------
export const createReview = (data) => api.post("/api/reviews/", data);
export const getDoctorReviews = (doctorId) => api.get(`/api/reviews/doctor/${doctorId}`);

// ---------- Billing ----------
export const generateInvoice = (data) => api.post("/api/billing/", data);
export const generateDirectBill = (data) => api.post("/api/billing/direct", data);
export const getMyInvoices = () => api.get("/api/billing/my-invoices");
export const payInvoice = (invoiceId) => api.put(`/api/billing/${invoiceId}/pay`);

// ---------- Admin ----------
export const getAdminStats = () => api.get("/api/admin/stats");

// ---------- Departments ----------
export const getDepartments = () => api.get("/api/departments/");
export const createDepartment = (data) => api.post("/api/departments/", data);
export const updateDepartment = (id, data) => api.put(`/api/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/api/departments/${id}`);
export const getDepartmentStats = () => api.get("/api/departments/stats");

// ---------- Lab Tests ----------
export const getLabTests = () => api.get("/api/lab-tests/");
export const requestLabTest = (data) => api.post("/api/lab-tests/", data);
export const updateLabTest = (id, formData) => api.put(`/api/lab-tests/${id}`, formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const deleteLabTest = (id) => api.delete(`/api/lab-tests/${id}`);

// ---------- Insurance ----------
export const getMyInsuranceDetails = () => api.get("/api/insurance/details/my");
export const createOrUpdateInsurance = (data) => api.post("/api/insurance/details", data);
export const getMyClaims = () => api.get("/api/insurance/claims/my");
export const submitClaim = (data) => api.post("/api/insurance/claims", data);

export const getAllInsuranceDetails = () => api.get("/api/insurance/details/all");
export const updateInsuranceDetailsStatus = (id, status) => api.put(`/api/insurance/details/${id}/status`, null, { params: { status } });
export const getAllClaims = () => api.get("/api/insurance/claims/all");
export const updateClaimStatus = (id, status) => api.put(`/api/insurance/claims/${id}/status`, null, { params: { status } });

// ---------- Pharmacy ----------
export const getMedicines = (search = "") => api.get(`/api/pharmacy/medicines?search=${search}`);
export const placeOrder = (data) => api.post("/api/pharmacy/orders", data);
export const getMyOrders = () => api.get("/api/pharmacy/orders/my");

// ---------- Emergency Contacts ----------
export const getMyEmergencyContacts = () => api.get("/api/emergency-contacts/my");
export const createEmergencyContact = (data) => api.post("/api/emergency-contacts", data);
export const deleteEmergencyContact = (id) => api.delete(`/api/emergency-contacts/${id}`);
export const getPatientEmergencyContacts = (patientId) => api.get(`/api/emergency-contacts/patient/${patientId}`);

// ---------- Downloads ----------
export const downloadPrescriptionPdf = (id) => api.get(`/api/prescriptions/${id}/download`, { responseType: 'blob' });
export const downloadInvoicePdf = (id) => api.get(`/api/billing/${id}/download`, { responseType: 'blob' });

// ---------- Admin ----------
export const getAdminAuditLogs = () => api.get("/api/admin/audit-logs");

// ---------- Chat ----------
export const getConsultationChatHistory = (appointmentId) => api.get(`/api/chat/history/${appointmentId}`);

// ---------- Analytics ----------
export const logHealthMetric = (data) => api.post("/api/analytics/metrics", data);
export const getMyHealthMetrics = (metricType = "") => api.get(`/api/analytics/metrics/my`, { params: metricType ? { metric_type: metricType } : {} });
export const syncWearableData = (provider) => api.post(`/api/analytics/sync-wearable?provider=${provider}`);

// ---------- Reminders ----------
export const createReminder = (data) => api.post("/api/reminders", data);
export const getReminders = () => api.get("/api/reminders");
export const logReminder = (id) => api.post(`/api/reminders/${id}/log`);
export const getReminderLogs = () => api.get("/api/reminders/logs");

// ---------- Bed Management ----------
export const createWard = (data) => api.post("/api/wards", data);
export const getWards = () => api.get("/api/wards");
export const getWardBeds = (wardId) => api.get(`/api/wards/${wardId}/beds`);

// ---------- Admissions ----------
export const admitPatient = (data) => api.post("/api/admissions", data);
export const dischargePatient = (id) => api.post(`/api/admissions/${id}/discharge`);
export const getAdmissions = () => api.get("/api/admissions");

// ---------- Emergency Services ----------
export const requestEmergency = (data) => api.post("/api/emergencies", data);
export const getEmergencies = () => api.get("/api/emergencies");
export const updateEmergencyStatus = (id, status) => api.put(`/api/emergencies/${id}/status`, { status });

// ---------- Feedback ----------
export const submitFeedback = (data) => api.post("/api/feedback", data);
export const getAllFeedback = () => api.get("/api/feedback");
export const getFeedbackAnalytics = () => api.get("/api/feedback/analytics");
