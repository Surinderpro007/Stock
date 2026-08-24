'use client';

import { useState, useEffect } from 'react';

interface Log {
  _id: string;
  adminName: string;
  action: string;
  targetUserEmail: string;
  details: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  ROLE_CHANGE: 'Changed Role',
  SUSPEND: 'Suspended User',
  UNSUSPEND: 'Unsuspended User',
  DELETE_USER: 'Deleted User',
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const res = await fetch(`/api/admin/audit-logs?page=${page}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      }
      setLoading(false);
    }
    fetchLogs();
  }, [page]);

  return (
    <div>
      <div className="bg-white border border-[#DDD8CC] rounded-lg overflow-hidden">
        {loading ? (
          <p className="text-center text-[#6B6858] py-10">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-[#6B6858] py-10">No admin actions yet</p>
        ) : (
          <div className="divide-y divide-[#EFEDE4]">
            {logs.map((log) => (
              <div key={log._id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[#14140F]">
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  <span className="text-xs text-[#6B6858]">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-[#6B6858]">
                  <span className="text-[#122A22]">{log.adminName}</span> — {log.details}
                  {log.targetUserEmail && (
                    <span className="text-[#B8935F]"> ({log.targetUserEmail})</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-[#DDD8CC] rounded-md text-[#14140F] disabled:opacity-40 hover:bg-white transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-[#6B6858]">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-[#DDD8CC] rounded-md text-[#14140F] disabled:opacity-40 hover:bg-white transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}