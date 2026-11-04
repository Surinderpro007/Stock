'use client';

import { useState, useEffect } from 'react';

interface DeletedUser {
  _id: string;
  name: string;
  email: string;
  profileImage: string;
  deletionScheduledAt: string | null;
}

export default function AdminDeletedUsers() {
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmPermanentId, setConfirmPermanentId] = useState<string | null>(null);

  async function fetchDeletedUsers() {
    setLoading(true);
    const res = await fetch('/api/admin/users?status=deleted', { cache: 'no-store' });
    const data = await res.json();
    if (res.ok) {
      setUsers(data.users);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDeletedUsers();
  }, []);

  async function handleRestore(user: DeletedUser) {
    setActionError('');
    setActionLoadingId(user._id);

    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      });
      const data = await res.json();
      setActionLoadingId(null);

      if (!res.ok) {
        setActionError(data.error);
        return;
      }

      await fetchDeletedUsers();
    } catch {
      setActionError('Something went wrong');
      setActionLoadingId(null);
    }
  }

  async function handlePermanentDelete(user: DeletedUser) {
    setActionError('');
    setActionLoadingId(user._id);

    try {
      const res = await fetch(`/api/admin/users/${user._id}?permanent=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setActionLoadingId(null);

      if (!res.ok) {
        setActionError(data.error);
        return;
      }

      setConfirmPermanentId(null);
      await fetchDeletedUsers();
    } catch {
      setActionError('Something went wrong');
      setActionLoadingId(null);
    }
  }

  return (
    <div>
      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
          {actionError}
        </p>
      )}

      <div className="bg-white border border-[#DDD8CC] rounded-lg overflow-hidden">
        {loading ? (
          <p className="text-center text-[#6B6858] py-10">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-[#6B6858] py-10">No deleted users</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#DDD8CC] text-left">
                  <th className="px-4 py-3 text-[#6B6858] font-medium">User</th>
                  <th className="px-4 py-3 text-[#6B6858] font-medium">Email</th>
                  <th className="px-4 py-3 text-[#6B6858] font-medium">Deleted On</th>
                  <th className="px-4 py-3 text-[#6B6858] font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-[#EFEDE4] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#DDD8CC] overflow-hidden flex items-center justify-center shrink-0">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-serif text-[#6B6858]">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-[#14140F]">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6B6858]">{u.email}</td>
                    <td className="px-4 py-3 text-[#6B6858]">
                      {u.deletionScheduledAt
                        ? new Date(u.deletionScheduledAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {confirmPermanentId === u._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-red-700">Delete forever?</span>
                          <button
                            onClick={() => handlePermanentDelete(u)}
                            disabled={actionLoadingId === u._id}
                            className="text-xs text-red-700 font-medium underline hover:no-underline disabled:opacity-50"
                          >
                            {actionLoadingId === u._id ? 'Deleting...' : 'Yes, delete'}
                          </button>
                          <button
                            onClick={() => setConfirmPermanentId(null)}
                            className="text-xs text-[#6B6858] underline hover:no-underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleRestore(u)}
                            disabled={actionLoadingId === u._id}
                            className="text-xs text-[#122A22] underline hover:no-underline disabled:opacity-50"
                          >
                            {actionLoadingId === u._id ? 'Restoring...' : 'Restore'}
                          </button>
                          <button
                            onClick={() => setConfirmPermanentId(u._id)}
                            className="text-xs text-red-700 underline hover:no-underline"
                          >
                            Delete Permanently
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}