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
  const [confirmLogId, setConfirmLogId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function handleDelete(logId: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/audit-logs/${logId}`, { method: 'DELETE' });
      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l._id !== logId));
      }
    } finally {
      setDeleting(false);
      setConfirmLogId(null);
    }
  }

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
              <div key={log._id} className="px-4 py-3 text-sm group">
                {confirmLogId === log._id ? (
                  <div className="flex items-center justify-between bg-red-50 -mx-4 -my-3 px-4 py-3">
                    <span className="text-red-700">Delete this log entry?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmLogId(null)}
                        className="text-xs px-3 py-1.5 rounded-md border border-[#DDD8CC] text-[#14140F] hover:bg-white transition-colors"
                      >
                        No
                      </button>
                      <button
                        onClick={() => handleDelete(log._id)}
                        disabled={deleting}
                        className="text-xs px-3 py-1.5 rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 transition-colors"
                      >
                        {deleting ? 'Deleting...' : 'Yes, delete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[#14140F]">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                        <span className="text-xs text-[#6B6858] shrink-0 ml-2">
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
                                        <button
                      onClick={() => setConfirmLogId(log._id)}
                      className="shrink-0 text-red-600 hover:text-red-800 opacity-1 group-hover:opacity-100 transition-opacity p-1"
                      aria-label="Delete log entry"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
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