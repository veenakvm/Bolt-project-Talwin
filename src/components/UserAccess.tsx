import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, type UserRole } from '../contexts/AuthContext';
import { UserCheck, UserX, ShieldCheck, Store, Clock, RefreshCw } from 'lucide-react';

interface Profile {
  user_id: string;
  role: UserRole;
  display_name: string;
  company: string;
  phone: string;
  email: string;
  created_at: string;
}

const SECTIONS: { role: UserRole; title: string; icon: typeof Clock; empty: string }[] = [
  { role: 'pending', title: 'Waiting for approval', icon: Clock, empty: 'No vendor registrations waiting.' },
  { role: 'dealer', title: 'Vendors', icon: Store, empty: 'No approved vendors yet.' },
  { role: 'staff', title: 'Staff', icon: ShieldCheck, empty: 'No staff.' },
  { role: 'disabled', title: 'Disabled', icon: UserX, empty: 'No disabled logins.' },
];

const ACTIONS: Record<UserRole, { role: UserRole; label: string; className: string }[]> = {
  pending: [
    { role: 'dealer', label: 'Approve as vendor', className: 'bg-green-600 text-white hover:bg-green-700' },
    { role: 'staff', label: 'Approve as staff', className: 'bg-blue-600 text-white hover:bg-blue-700' },
    { role: 'disabled', label: 'Reject', className: 'bg-red-50 text-red-700 hover:bg-red-100' },
  ],
  dealer: [
    { role: 'staff', label: 'Make staff', className: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { role: 'disabled', label: 'Disable', className: 'bg-red-50 text-red-700 hover:bg-red-100' },
  ],
  staff: [
    { role: 'dealer', label: 'Make vendor', className: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { role: 'disabled', label: 'Disable', className: 'bg-red-50 text-red-700 hover:bg-red-100' },
  ],
  disabled: [
    { role: 'dealer', label: 'Restore as vendor', className: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { role: 'staff', label: 'Restore as staff', className: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  ],
};

/** Staff screen: approve vendor registrations and manage who can log in. */
export default function UserAccess() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase
      .from('user_profiles')
      .select('user_id, role, display_name, company, phone, email, created_at')
      .order('created_at', { ascending: false });
    if (loadError) setError(loadError.message);
    setProfiles((data as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (profile: Profile, role: UserRole, label: string) => {
    const who = profile.display_name || profile.email;
    if (!confirm(`${label}: ${who}?`)) return;
    setBusyId(profile.user_id);
    const { error: rpcError } = await supabase.rpc('set_user_role', { target_user: profile.user_id, new_role: role });
    setBusyId(null);
    if (rpcError) {
      alert('Could not update access: ' + rpcError.message);
      return;
    }
    setProfiles(prev => prev.map(p => (p.user_id === profile.user_id ? { ...p, role } : p)));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Access</h1>
          <p className="text-gray-600 mt-1">
            Vendors register from the login page with "Register here". Approve them here before they can log in.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        SECTIONS.map(section => {
          const rows = profiles.filter(p => p.role === section.role);
          const Icon = section.icon;
          return (
            <div key={section.role} className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Icon className="w-5 h-5" />
                {section.title}
                <span className="text-sm font-normal text-gray-500">({rows.length})</span>
              </h2>
              {rows.length === 0 ? (
                <p className="text-sm text-gray-500">{section.empty}</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {rows.map(profile => (
                    <div key={profile.user_id} className="py-3 flex flex-wrap items-center gap-3 justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900">
                          {profile.display_name || profile.email}
                          {profile.company && <span className="font-normal text-gray-600"> · {profile.company}</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          {profile.email}
                          {profile.phone && ` · ${profile.phone}`}
                          {' · registered '}
                          {new Date(profile.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {profile.user_id === user?.id ? (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <UserCheck className="w-4 h-4" /> This is you
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {ACTIONS[profile.role].map(action => (
                            <button
                              key={action.role}
                              disabled={busyId === profile.user_id}
                              onClick={() => changeRole(profile, action.role, action.label)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${action.className}`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
