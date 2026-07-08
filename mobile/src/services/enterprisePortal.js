import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const defaultGroups = [
  { id: 'visitor', name: 'Visitor' },
  { id: 'employee', name: 'Employee' },
  { id: 'delivery', name: 'Delivery' },
  { id: 'contractor', name: 'Contractor' },
];

const sortByName = (items = []) =>
  [...items].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));

export const getStoredUser = async () => {
  try {
    const raw = await AsyncStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAccessibleSites = async (preferredSiteId) => {
  const storedUser = await getStoredUser();
  const resolvedSiteId = preferredSiteId || storedUser?.project_id;

  // Strategy 1: Try fetching the full projects list first (works for guards/managers with multiple sites)
  try {
    const response = await api.get('/projects');
    const allSites = sortByName(response.data || []);
    if (allSites.length) return allSites;
  } catch {
    // fall through to single-site lookup
  }

  // Strategy 2: If only one project is assigned, fetch it directly by ID
  if (resolvedSiteId) {
    try {
      const response = await api.get(`/projects/${resolvedSiteId}/public`);
      return response?.data ? [response.data] : [];
    } catch {
      // fall through
    }
  }

  return [];
};

const normalizeVisit = (visit) => ({
  ...visit,
  id: visit?.id || visit?._id,
  name: visit?.name || visit?.visitor_name || 'Unknown',
  group: visit?.group || visit?.userType || visit?.visitor_group || 'Visitor',
  sign_in_time: visit?.sign_in_time || visit?.checkIn || visit?.created_at || visit?.createdAt,
  sign_out_time: visit?.sign_out_time || visit?.checkOut || null,
  pre_registered: Boolean(visit?.pre_registered || visit?.preRegistered),
  checked_in_by_guard: Boolean(visit?.checked_in_by_guard || visit?.checkedInByGuard),
  checked_in_by: visit?.checked_in_by || visit?.checkedInBy || '',
});

export const getVisits = async ({ siteId, status, limit = 200, search = '' }) => {
  if (!siteId) return [];
  const response = await api.get('/visits', {
    params: {
      site_id: siteId,
      status,
      limit,
      search: search || undefined,
    },
  });
  const visits = response?.data?.visits || response?.data || [];
  return visits.map(normalizeVisit);
};

export const getVisitStats = async (siteId) => {
  if (!siteId) return { totalIn: 0, visitorsIn: 0, employeesIn: 0 };
  const response = await api.get('/visits/stats', { params: { site_id: siteId } });
  return response?.data || { totalIn: 0, visitorsIn: 0, employeesIn: 0 };
};

export const getPreRegistrations = async ({ siteId, status = 'Pending', search = '' }) => {
  if (!siteId) return [];
  const response = await api.get('/pre-registrations', {
    params: {
      site_id: siteId,
      status,
      search: search || undefined,
    },
  });
  return (response?.data || []).map((item) => ({
    ...item,
    id: item?.id || item?._id,
    name: item?.name || 'Unknown',
  }));
};

export const getVisitorGroups = async (siteId) => {
  if (!siteId) return defaultGroups;
  try {
    const response = await api.get('/visitor-groups', { params: { project_id: siteId } });
    const groups = response?.data || [];
    return groups.length ? groups : defaultGroups;
  } catch {
    return defaultGroups;
  }
};

export const signInVisitor = async ({ siteId, name, group, notes }) => {
  const response = await api.post('/visits', {
    site_id: siteId,
    name,
    group,
    notes,
  });
  return response?.data;
};

export const signOutVisit = async (visitId) => {
  const response = await api.post(`/visits/${visitId}/sign-out`);
  return response?.data;
};

export const markPreRegisteredArrival = async (preRegistrationId) => {
  const response = await api.post(`/pre-registrations/${preRegistrationId}/arrive`);
  return response?.data;
};

export const createPreRegistration = async ({
  siteId,
  name,
  email,
  phone,
  notes,
  expectedDate,
  visitorGroupId,
  sendInvitation,
}) => {
  const response = await api.post('/pre-registrations', {
    site_id: siteId,
    name,
    email: email || undefined,
    phone: phone || undefined,
    notes: notes || undefined,
    expected_date: expectedDate,
    visitor_group_id: visitorGroupId || undefined,
    send_invitation: Boolean(sendInvitation && email),
  });
  return response?.data;
};
