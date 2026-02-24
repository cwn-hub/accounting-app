import React from 'react';
import { Users, Plus, Mail, Shield, MoreVertical } from 'lucide-react';
import { FieldTooltip } from '../components/ContextualHelp';

const UserManagement = () => {
  const users = [
    {
      id: 1,
      name: 'Anna Müller',
      email: 'anna@acme.ch',
      role: 'Admin',
      status: 'Active',
      lastActive: '2 hours ago',
    },
    {
      id: 2,
      name: 'Hans Weber',
      email: 'hans@acme.ch',
      role: 'Accountant',
      status: 'Active',
      lastActive: '1 day ago',
    },
    {
      id: 3,
      name: 'Maria Schmidt',
      email: 'maria@acme.ch',
      role: 'Viewer',
      status: 'Invited',
      lastActive: '-',
    },
  ];

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-purple-50 text-purple-700';
      case 'Accountant': return 'bg-blue-50 text-blue-700';
      case 'Viewer': return 'bg-slate-50 text-slate-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700';
      case 'Invited': return 'bg-amber-50 text-amber-700';
      case 'Inactive': return 'bg-slate-50 text-slate-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Users & Access</h1>
        <p className="text-slate-600">Manage team members and permissions</p>
      </div>

      {/* Invite Button */}
      <div className="mb-6">
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Role
                    <FieldTooltip content="Admin: Full access. Accountant: Can create/edit transactions. Viewer: Read-only access." />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-indigo-600 font-medium">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      <Shield className="w-3 h-3" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {user.lastActive}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-purple-900">Admin</h4>
          </div>
          <p className="text-sm text-purple-800">
            Full access to all features including user management, settings, and all financial data.
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Accountant</h4>
          </div>
          <p className="text-sm text-blue-800">
            Can create and edit transactions, view reports, and manage the chart of accounts.
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-slate-600" />
            <h4 className="font-semibold text-slate-900">Viewer</h4>
          </div>
          <p className="text-sm text-slate-700">
            Read-only access to view transactions and reports. Cannot create or edit data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
