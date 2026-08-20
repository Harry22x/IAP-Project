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

function AdminDash() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const mobileMenuRef = useRef(null);
    const mobileButtonRef = useRef(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/reports/operations/');
                setStats(res.data);
            } catch (err) {
                console.error("Error fetching admin stats:", err);
            }
        };
        fetchStats();
    }, []);

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

                <main className="p-4 sm:p-8 space-y-6">
                    {/* Header Widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-[#042d6d] transition-colors">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl shrink-0">
                                <FontAwesomeIcon icon="fa-solid fa-hand-holding-heart" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Donors</p>
                                <p className="text-2xl font-extrabold text-[#042d6d]">{stats?.total_donors || 0}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-[#042d6d] transition-colors">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl shrink-0">
                                <FontAwesomeIcon icon="fa-solid fa-bed-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Recipients</p>
                                <p className="text-2xl font-extrabold text-[#042d6d]">{stats?.total_recipients || 0}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-[#042d6d] transition-colors">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl shrink-0">
                                <FontAwesomeIcon icon="fa-solid fa-handshake" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Successful Matches</p>
                                <p className="text-2xl font-extrabold text-[#042d6d]">{stats?.successful_matches || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link to="/users" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-[#042d6d] hover:shadow-md transition-all group flex items-start gap-4">
                            <div className="w-10 h-10 bg-slate-100 text-slate-600 group-hover:bg-[#042d6d] group-hover:text-white rounded-lg flex items-center justify-center shrink-0 transition-colors">
                                <FontAwesomeIcon icon="fa-solid fa-users-gear" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-[#042d6d] transition-colors">Manage Staff Users</h3>
                                <p className="text-xs text-slate-500 mt-1">Approve or deactivate staff accounts across the system.</p>
                            </div>
                        </Link>
                        <Link to="/reports" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-[#042d6d] hover:shadow-md transition-all group flex items-start gap-4">
                            <div className="w-10 h-10 bg-slate-100 text-slate-600 group-hover:bg-[#042d6d] group-hover:text-white rounded-lg flex items-center justify-center shrink-0 transition-colors">
                                <FontAwesomeIcon icon="fa-solid fa-file-invoice" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-[#042d6d] transition-colors">System Reports</h3>
                                <p className="text-xs text-slate-500 mt-1">View comprehensive registry data and operation history.</p>
                            </div>
                        </Link>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AdminDash;