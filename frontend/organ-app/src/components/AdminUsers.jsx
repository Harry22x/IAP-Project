import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';
/* import all the icons and dependencies*/
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: 'fa-solid fa-table-columns' },
    { name: 'Users', href: '/users', icon: 'fa-solid fa-users' }, // user profiles for pending approval, current user profiles, new notifs show up here
    { name: 'Reports', href: '/reports', icon: 'fa-solid fa-chart-line' }, //has the patients info, matches and the report generation button 
];

function AdminUsers() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const mobileMenuRef = useRef(null);
    const mobileButtonRef = useRef(null);
    const [users, setUsers] = useState([]);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/');
            setUsers(res.data);
        } catch (err) {
            console.error("Error fetching users:", err);
            showNotification("Failed to fetch users", "error");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await api.patch(`/users/${userId}/`, { is_active: !currentStatus });
            showNotification(`User account successfully ${!currentStatus ? 'activated' : 'deactivated'}.`);
            fetchUsers(); // Refresh data
        } catch (err) {
            console.error("Error updating user status:", err);
            showNotification("Failed to update user status.", "error");
        }
    };

    useEffect(() => {
        const handleClick = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !mobileButtonRef.current.contains(event.target)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [mobileMenuOpen]);

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">

            <aside
                ref={mobileMenuRef}
                className={`fixed top-0 left-0 z-50 h-screen w-64 flex flex-col bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="p-6 flex justify-between items-center">
                    <div>
                        <h1 className="font-extrabold text-xl tracking-tighter text-[#042d6d]">Administrator Panel</h1>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Organ Donation Matching System</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isCurrent = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isCurrent
                                    ? 'bg-[#042d6d] text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#042d6d]'
                                    }`}
                            >
                                <FontAwesomeIcon icon={item.icon} className="w-5 h-5 opacity-75" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto">
                    {/* User Actions & Notifications */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full border-2 border-slate-200 overflow-hidden shrink-0">
                                <img src="src/assets/admin.png" alt="pfp" />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                                <span className="text-xs font-bold text-slate-700 truncate">Administrator</span>
                                <Link 
                                    to="/" 
                                    className="px-3 py-1.5 bg-[#042d6d] text-white rounded-md text-[10px] font-bold shadow-sm hover:bg-[#154696] hover:shadow transition-all whitespace-nowrap w-fit"
                                    onClick={() => {
                                        localStorage.removeItem('access_token');
                                        localStorage.removeItem('refresh_token');
                                        localStorage.removeItem('user_role');
                                        localStorage.removeItem('user_name');
                                    }}
                                >
                                    Log Out
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

                {/* Smaller screen navbar */}
                <div className="lg:hidden flex items-center justify-between bg-[#042d6d] p-4 text-white z-40 sticky top-0 shadow-md">
                    <span className="font-extrabold text-lg tracking-tighter">Organ Donation Matching System</span>
                    <button
                        ref={mobileButtonRef}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 hover:bg-white/10 rounded-md transition-colors"
                    >
                        <span className="material-symbols-outlined">{mobileMenuOpen ? <FontAwesomeIcon icon="fa-solid fa-xmark" /> : <FontAwesomeIcon icon="fa-solid fa-bars" />}</span>
                    </button>
                </div>

                {/* Onscreen Notification Toast */}
                {notification.show && (
                    <div className={`m-4 p-4 rounded-lg shadow-md border flex items-center gap-3 transition-all ${
                        notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
                    }`}>
                        <FontAwesomeIcon icon={notification.type === 'error' ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check"} className="text-lg" />
                        <span className="font-medium text-sm">{notification.message}</span>
                        <button onClick={() => setNotification({ show: false, message: '', type: 'success' })} className="ml-auto opacity-70 hover:opacity-100">
                            <FontAwesomeIcon icon="fa-solid fa-xmark" />
                        </button>
                    </div>
                )}

                <main className="p-4 sm:p-8 space-y-6 pt-4">
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-slate-700">Staff Account Management</h2>
                                <p className="text-xs text-slate-500 mt-1">Approve new registrations and manage system access.</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                        <th className="px-6 py-4 font-bold">Name</th>
                                        <th className="px-6 py-4 font-bold">Email</th>
                                        <th className="px-6 py-4 font-bold">Role</th>
                                        <th className="px-6 py-4 font-bold">Hospital</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((user) => (
                                        <tr key={user.user_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-[#042d6d]">{user.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-mono">{user.email}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{user.role}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{user.hospital_name || 'System'}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                    user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                <button 
                                                    onClick={() => toggleUserStatus(user.user_id, user.is_active)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                                        user.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-600 text-white hover:bg-green-700'
                                                    }`}
                                                >
                                                    {user.is_active ? 'Deactivate' : 'Activate User'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-sm">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

export default AdminUsers;