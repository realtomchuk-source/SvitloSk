const REPO_OWNER = 'realtomchuk-source';
const REPO_NAME = 'svitlo-starkon';
const WORKFLOW_ID = 'monitor.yml';

export const triggerParserWorkflow = async (token: string, inputs: any) => {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: 'main',
      inputs
    })
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to trigger workflow');
  }

  return true;
};

export const fetchHealthStatus = async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/health.json?t=${Date.now()}`);
    if (!response.ok) throw new Error('Health data not found');
    return response.json();
};

export const fetchParserState = async () => {
    // Note: In development, this might be in web/public/data or relative to parser
    const response = await fetch(`${import.meta.env.BASE_URL}data/unified_schedules.json?t=${Date.now()}`);
    if (!response.ok) throw new Error('Parser state not found');
    const history = await response.json();
    return history[history.length - 1];
};

export const fetchSystemStats = async () => {
    // 1. Total users
    const { count: totalUsers } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
    
    // 2. Group density (Subscriber count per group - Start group + Active Push slots!)
    const { data: profiles } = await supabase.from('user_profiles').select('start_group');
    const { data: slots } = await supabase.from('notification_slots').select('data');
    
    const density: Record<string, number> = {};
    
    // Count start groups
    profiles?.forEach(p => {
        const g = p.start_group || 'none';
        if (g !== 'none') {
            density[g] = (density[g] || 0) + 1;
        }
    });

    // Count active push slots
    slots?.forEach(s => {
        const slotData = s.data as any;
        if (slotData && slotData.isActive && slotData.subGroup) {
            const g = slotData.subGroup;
            density[g] = (density[g] || 0) + 1;
        }
    });

    // 3. Admin actions (last 24h)
    const { count: recentActions } = await supabase
        .from('admin_actions')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return {
        totalUsers: totalUsers || 0,
        groupDensity: density,
        recentActions: recentActions || 0,
        health: 'stable'
    };
};

import { supabase } from './supabaseClient';

export const fetchPendingResults = async () => {
    const { data, error } = await supabase
        .from('parser_results')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
};

export const approveResult = async (id: number) => {
    const { error } = await supabase
        .from('parser_results')
        .update({ status: 'approved' })
        .eq('id', id);
    
    if (error) throw error;
    return true;
};

export const logAdminAction = async (action_type: string, target_id: string | null = null, details: any = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('admin_actions').insert([{
      admin_id: user.id,
      action_type,
      target_id,
      details
    }]);
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
};

export const fetchAddressRequests = async () => {
  const { data, error } = await supabase
    .from('missing_address_requests')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const updateAddressRequestStatus = async (
  id: number,
  status: 'resolved' | 'rejected',
  assignedSubgroup: string | null = null
) => {
  const { error } = await supabase
    .from('missing_address_requests')
    .update({ 
      status, 
      assigned_subgroup: assignedSubgroup 
    })
    .eq('id', id);
  
  if (error) throw error;
  return true;
};
