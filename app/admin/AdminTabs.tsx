'use client';

import { useState } from 'react';
import AdminUserList from './AdminUserList';
import AdminAuditLog from './AdminAuditLog';
import AdminDeletedUsers from './AdminDeletedUsers';
import AdminTrades from './AdminTrades';

export default function AdminTabs() {
  const [tab, setTab] = useState<'users' | 'deleted' | 'logs' | 'trades'>('users');

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b border-[#DDD8CC]">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'users'
              ? 'border-[#122A22] text-[#122A22]'
              : 'border-transparent text-[#6B6858]'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setTab('deleted')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'deleted'
              ? 'border-[#122A22] text-[#122A22]'
              : 'border-transparent text-[#6B6858]'
          }`}
        >
          Deleted
        </button>
        <button
          onClick={() => setTab('logs')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'logs'
              ? 'border-[#122A22] text-[#122A22]'
              : 'border-transparent text-[#6B6858]'
          }`}
        >
          Audit Log
        </button>
        <button
          onClick={() => setTab('trades')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'trades'
              ? 'border-[#122A22] text-[#122A22]'
              : 'border-transparent text-[#6B6858]'
          }`}
        >
          Trades
        </button>
      </div>

      {tab === 'users' ? (
        <AdminUserList />
      ) : tab === 'deleted' ? (
        <AdminDeletedUsers />
      ) : tab === 'logs' ? (
        <AdminAuditLog />
      ) : (
        <AdminTrades />
      )}
    </div>
  );
}