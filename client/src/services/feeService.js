import api from './authService';

export async function fetchFees({ status = 'all', month, batch } = {}) {
  const { data } = await api.get('/admin/fees', {
    params: { status: status === 'all' ? undefined : status, month, batch },
  });
  return data;
}

export async function updateFeeVoucher(id, payload) {
  const { data } = await api.patch(`/admin/fees/${id}`, payload);
  return data.voucher;
}

export async function generateFeeVoucher(studentId, amount) {
  const { data } = await api.post(`/admin/fees/generate/${studentId}`, amount ? { amount } : {});
  return data;
}

export async function bulkGenerateFeeVouchers() {
  const { data } = await api.post('/admin/fees/generate-bulk');
  return data;
}
