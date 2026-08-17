import api from './authService';

// Single call backing Super Admin/Sub-Admin's QR scanner — payload is the
// decoded {org, type, id, name} JSON already encoded on every ID card (see
// IDCardModal.jsx), forwarded as-is; the server decides Student vs Trainer
// and what action to take (see attendanceScanController.js).
export async function scanAttendance(payload) {
  const { data } = await api.post('/admin/attendance-scan/scan', { payload });
  return data;
}
