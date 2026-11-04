'use client';

import { useState, useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  provider: string;
  role: string;
  isVerified: boolean;
  isSuspended: boolean;
  isDeactivated: boolean;
  pendingDeletion: boolean;
  deletionScheduledAt: string | null;
  twoFAEnabled: boolean;
  createdAt: string;
  profileImage: string;
}
const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';

export default function AdminUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('joined');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionError, setActionError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    const params = new URLSearchParams({ search, page: String(page), sortBy });
    const res = await fetch(`/api/admin/users?${params}`, { cache: 'no-store' });
    const data = await res.json();
    if (res.ok) {
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    }
    setLoading(false);
  }

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search, page, sortBy]);

  async function handleRoleToggle(user: User) {
    setActionError('');
    setActionLoading(true);
    const newRole = user.role === 'admin' ? 'user' : 'admin';

    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      setActionLoading(false);

      if (!res.ok) {
        setActionError(data.error);
        return;
      }

      await fetchUsers();
      setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : prev));
    } catch {
      setActionError('Something went wrong');
      setActionLoading(false);
    }
  }

  async function handleSuspendToggle(user: User) {
    setActionError('');
    setActionLoading(true);
    const newValue = !user.isSuspended;

    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend: newValue }),
      });
      const data = await res.json();
      setActionLoading(false);

      if (!res.ok) {
        setActionError(data.error);
        return;
      }

      await fetchUsers();
      setSelectedUser((prev) => (prev ? { ...prev, isSuspended: newValue } : prev));
    } catch {
      setActionError('Something went wrong');
      setActionLoading(false);
    }
  }

    async function handleDeactivateToggle(user: User) {
    setActionError('');
    setActionLoading(true);
    const newValue = !user.isDeactivated;

    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deactivate: newValue }),
      });
      const data = await res.json();
      setActionLoading(false);

      if (!res.ok) {
        setActionError(data.error);
        return;
      }

      await fetchUsers();
      setSelectedUser((prev) => (prev ? { ...prev, isDeactivated: newValue } : prev));
    } catch {
      setActionError('Something went wrong');
      setActionLoading(false);
    }
  }

  async function handleDelete(user: User) {
    setActionError('');
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${user._id}`, { method: 'DELETE' });
      const data = await res.json();
      setActionLoading(false);

      if (!res.ok) {
        setActionError(data.error);
        return;
      }

      setSelectedUser(null);
      setConfirmDelete(false);
      await fetchUsers();
    } catch {
      setActionError('Something went wrong');
      setActionLoading(false);
    }
  }

  return (
    <div>
            <div className="flex items-center justify-between mb-5 gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email..."
          className="w-full max-w-xs px-4 py-2 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
        />

        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors cursor-pointer"
          >
            <option value="joined">Sort: Date Joined</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="status">Sort: Status</option>
          </select>
          <span className="text-sm text-[#6B6858] whitespace-nowrap">{total} user(s)</span>
        </div>
      </div>

      <div className="bg-white border border-[#DDD8CC] rounded-lg overflow-hidden">
        {loading ? (
          <p className="text-center text-[#6B6858] py-10">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-[#6B6858] py-10">No users found</p>
        ) : (
        //    on small screens, we can make the table scrollable horizontally
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F5EF] border-b border-[#DDD8CC] text-left">
                <th className="px-4 py-3 text-[#6B6858] font-medium">User</th>
                <th className="px-4 py-3 text-[#6B6858] font-medium">Email</th>
                <th className="px-4 py-3 text-[#6B6858] font-medium">Role</th>
                <th className="px-4 py-3 text-[#6B6858] font-medium">Status</th>
                <th className="px-4 py-3 text-[#6B6858] font-medium">Joined</th>
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
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        u.role === 'admin'
                          ? 'bg-[#122A22] text-[#F7F5EF]'
                          : 'bg-[#EFEDE4] text-[#6B6858]'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                                    <td className="px-4 py-3">
                    {u.pendingDeletion ? (
                      <span className="text-xs text-red-600">
                        Pending Deletion
                        {u.deletionScheduledAt
                          ? ` (${new Date(u.deletionScheduledAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })})`
                          : ''}
                      </span>
                    ) : u.isDeactivated ? (
                      <span className="text-xs text-[#6B6858]">Deactivated</span>
                    ) : u.isSuspended ? (
                      <span className="text-xs text-red-600">Suspended</span>
                    ) : u.isVerified ? (
                      <span className="text-xs text-[#122A22]">Active</span>
                    ) : (
                      <span className="text-xs text-[#B8935F]">Unverified</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#6B6858]">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                                    <td className="px-4 py-3 text-right">
                    {u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? (
                      <span className="text-xs text-[#B8935F]">Super Admin</span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setActionError('');
                          setConfirmDelete(false);
                        }}
                        className="text-xs text-[#122A22] underline hover:no-underline"
                      >
                        Manage
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <span className="text-sm text-[#6B6858]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-[#DDD8CC] rounded-md text-[#14140F] disabled:opacity-40 hover:bg-white transition-colors"
          >
            Next
          </button>
        </div>
      )}

            {/* User detail / manage panel */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-lg max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-[#DDD8CC] overflow-hidden flex items-center justify-center shrink-0">
                {selectedUser.profileImage ? (
                  <img src={selectedUser.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-serif text-[#6B6858]">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-serif text-lg text-[#14140F]">{selectedUser.name}</p>
                <p className="text-sm text-[#6B6858]">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-[#6B6858]">Mobile</span>
                <span className="text-[#14140F]">{selectedUser.mobile || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6858]">Provider</span>
                <span className="text-[#14140F] capitalize">{selectedUser.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6858]">2FA</span>
                <span className="text-[#14140F]">{selectedUser.twoFAEnabled ? 'On' : 'Off'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6858]">Verified</span>
                <span className="text-[#14140F]">{selectedUser.isVerified ? 'Yes' : 'No'}</span>
              </div>
              {selectedUser.pendingDeletion && (
                <div className="flex justify-between">
                  <span className="text-[#6B6858]">Scheduled deletion</span>
                  <span className="text-red-600">
                    {selectedUser.deletionScheduledAt
                      ? new Date(selectedUser.deletionScheduledAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                </div>
              )}
            </div>

            {actionError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
                {actionError}
              </p>
            )}

            {!confirmDelete ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleRoleToggle(selectedUser)}
                  disabled={actionLoading}
                  className="w-full border border-[#DDD8CC] text-[#14140F] py-2 rounded-md text-sm hover:bg-[#F7F5EF] disabled:opacity-50 transition-colors"
                >
                  {selectedUser.role === 'admin' ? 'Remove Admin Role' : 'Make Admin'}
                </button>
                <button
                  onClick={() => handleSuspendToggle(selectedUser)}
                  disabled={actionLoading}
                  className="w-full border border-[#DDD8CC] text-[#14140F] py-2 rounded-md text-sm hover:bg-[#F7F5EF] disabled:opacity-50 transition-colors"
                >
                  {selectedUser.isSuspended ? 'Unsuspend User' : 'Suspend User'}
                </button>
                <button
                  onClick={() => handleDeactivateToggle(selectedUser)}
                  disabled={actionLoading}
                  className="w-full border border-[#DDD8CC] text-[#14140F] py-2 rounded-md text-sm hover:bg-[#F7F5EF] disabled:opacity-50 transition-colors"
                >
                  {selectedUser.isDeactivated ? 'Reactivate User' : 'Deactivate User'}
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full border border-red-300 text-red-700 py-2 rounded-md text-sm hover:bg-red-50 transition-colors"
                >
                  Delete User
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-full text-sm text-[#6B6858] py-2 hover:underline"
                >
                  Close
                </button>
              </div>
            ) : (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-3">
                <p className="text-sm text-red-700">
                  Move {selectedUser.name} to Deleted Users? Account access will be blocked
                  immediately, but you can still restore or permanently delete it from the
                  &quot;Deleted&quot; tab.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 border border-[#DDD8CC] text-[#14140F] py-2 rounded-md text-sm hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(selectedUser)}
                    disabled={actionLoading}
                    className="flex-1 bg-red-700 text-white py-2 rounded-md text-sm hover:bg-red-800 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading ? 'Moving...' : 'Move to Deleted'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
    