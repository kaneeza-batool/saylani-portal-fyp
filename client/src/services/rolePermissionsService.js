import api from './authService';

export async function fetchSubAdminsWithPermissions() {
  const { data } = await api.get('/admin/role-permissions/sub-admins');
  return data;
}

export async function updateSubAdminPermissions(id, permissions) {
  const { data } = await api.patch(`/admin/role-permissions/sub-admins/${id}`, { permissions });
  return data.item;
}

export async function grantSubAdminFullAccess(id) {
  const { data } = await api.patch(`/admin/role-permissions/sub-admins/${id}/full-access`);
  return data.item;
}
