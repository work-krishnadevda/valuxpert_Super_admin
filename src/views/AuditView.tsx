import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { ApiAuditLog } from '../types';
import { superAdminApi } from '../services/superAdminApi';
import { TableSkeleton } from '../components/SkeletonLoaders';

export function AuditView() {
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminApi.auditLogs()
      .then((data) => setLogs(data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-5xl">
       <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2 text-pine">Audit Logs</h1>
        <p className="text-pine/70 font-medium text-base md:text-lg">Global activity monitoring across all tenants.</p>
      </div>
      <div className="bg-butter-light border-2 border-pine/10 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-pine/10 text-pine/60 uppercase text-xs tracking-wider">
                <th className="p-6 font-bold">Event</th>
                <th className="p-6 font-bold">Resource</th>
                <th className="p-6 font-bold">Actor</th>
                <th className="p-6 font-bold text-right">Time</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton columns={4} />
            ) : (
            <tbody className="divide-y divide-pine/5">
              {!loading && logs.map((log) => (
                <tr key={log._id} className="hover:bg-pine/[0.02] transition-colors">
                  <td className="p-6 font-bold text-pine">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={17} className="text-pine/60" />
                      {log.action}
                    </div>
                    <p className="text-xs text-pine/50 font-bold mt-1">{log.description}</p>
                  </td>
                  <td className="p-6 font-mono text-xs text-pine/80">{log.entity_type}:{log.entity_id || log.tenant_id || '-'}</td>
                  <td className="p-6 text-sm font-medium text-pine/80">{log.actor_email || 'system'}</td>
                  <td className="p-6 text-sm font-medium text-pine/60 text-right">{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-pine/50 font-bold">No audit logs found.</td>
                </tr>
              )}
            </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
