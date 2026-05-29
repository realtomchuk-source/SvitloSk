import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { Fingerprint } from 'lucide-react';
import { clsx } from 'clsx';

type AdminAction = {
  id: string;
  admin_id: string;
  action_type: string;
  target_id: string;
  details: any;
  created_at: string;
};

export function AuditLogsViewer() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin', 'audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as AdminAction[];
    },
  });

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'block_user': 'USER_BLOCK',
      'unblock_user': 'USER_ENABLE',
      'update_user_profile': 'PROFILE_MOD',
      'publish_announcement': 'BROADCAST_LIVE',
      'draft_announcement': 'BROADCAST_DRAFT',
      'delete_announcement': 'BROADCAST_DEL',
      'update_announcement_status': 'BROADCAST_MOD',
      'trigger_parser': 'PARSER_RELOAD',
      'APPROVE_RESULT': 'SCHEDULE_AUTH'
    };
    return labels[type] || type.toUpperCase();
  };

  const getActionColor = (type: string) => {
    if (type.includes('DEL') || type.includes('block') || type.includes('delete')) return 'text-red-500 border-red-950 bg-red-950/20';
    if (type.includes('LIVE') || type.includes('unblock') || type.includes('APPROVE')) return 'text-emerald-500 border-emerald-950 bg-emerald-950/20';
    return 'text-blue-500 border-blue-950 bg-blue-950/20';
  };

  if (isLoading) return <div className="py-20 text-center text-zinc-600 font-mono text-[10px] uppercase tracking-widest animate-pulse">Accessing Audit Vault...</div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-800 rounded border border-zinc-700">
            <Fingerprint size={16} className="text-zinc-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Operation Ledger</h3>
            <p className="text-[9px] text-zinc-600 font-mono">Full immutable audit trail</p>
          </div>
        </div>
      </header>

      <div className="border border-zinc-800 bg-[#0d0d0d] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800">
                <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Timestamp</th>
                <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Operation</th>
                <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Target Identity</th>
                <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-zinc-500 text-right">Parameter Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {logs?.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-zinc-700 font-mono text-[9px] uppercase tracking-widest">Vault is empty</td></tr>
              ) : (
                logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-all group border-b border-zinc-800/30">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-zinc-300 font-bold text-[10px] font-mono">
                           {new Date(log.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] text-zinc-600 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                        getActionColor(log.action_type)
                      )}>
                        {getActionLabel(log.action_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                         <span className="text-[9px] font-mono text-zinc-600 truncate max-w-[120px]">{log.target_id || 'SYSTEM_CORE'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                       <div className="flex flex-col items-end gap-0.5">
                          {log.details && Object.entries(log.details).map(([key, val]) => (
                            <div key={key} className="text-[8px] font-mono text-zinc-700">
                               <span className="text-zinc-500 uppercase">{key}:</span> {String(val)}
                            </div>
                          ))}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
