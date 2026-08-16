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
