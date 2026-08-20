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
    { name: 'Dashboard', href: '/hp', icon: 'fa-solid fa-table-columns' }, //only show the 2 most recent upcoming operations
    { name: 'History', href: '/history', icon: 'fa-solid fa-clock-rotate-left' }, // show the past 5 operations
];

function HPDash() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const mobileMenuRef = useRef(null);
    const mobileButtonRef = useRef(null);
    const [displayName, setDisplayName] = useState('User');
    const [upcomingMatches, setUpcomingMatches] = useState([]);

    useEffect(() => {
        const handleClick = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !mobileButtonRef.current.contains(event.target)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [mobileMenuOpen]);

    useEffect(() => {
        const savedName = localStorage.getItem('user_name');

        if (savedName) {
            setDisplayName(savedName);
        }
    }, []); 

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await api.get('/matching/');
                const today = new Date();
                const filtered = res.data
                .filter(m => m.match_status === 'APPROVED')
                .filter(m => !m.scheduled_date || new Date(m.scheduled_date) >= today)
                .sort((x, y) => new Date(x.scheduled_date || x.match_date) - new Date(y.scheduled_date || y.match_date))
                .slice(0, 5);

                setUpcomingMatches(filtered);
            } catch (err) {
                console.error('Failed to fetch upcoming operations', err);
            }
        };
        fetchMatches();
    }, []);

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">

            <aside
                ref={mobileMenuRef}
                className={`fixed top-0 left-0 z-50 h-screen w-64 flex flex-col bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="p-6 flex justify-between items-center">
                    <div>
                        <h1 className="font-extrabold text-xl tracking-tighter text-[#042d6d]">Healthcare Professional Interface</h1>
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
                                <span className="text-xs font-bold text-slate-700 truncate">{displayName}</span>
                                <Link 
                                to="/" 
                                className="px-3 py-1.5 bg-[#042d6d] text-white rounded-md text-[10px] font-bold shadow-sm hover:bg-[#154696] hover:shadow transition-all whitespace-nowrap w-fit"
                                onClick={() => {
                                    localStorage.removeItem('access_token');
                                    localStorage.removeItem('refresh_token');
                                    localStorage.removeItem('user_role');
                                    localStorage.removeItem('user_name');
                                }}>
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

                <main className="p-6 lg:p-8 flex-1">
                    <div className="max-w-4xl">
                        {/* Header Section */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Upcoming Operations</h2>
                        </div>

                        {/* Content Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {upcomingMatches.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {upcomingMatches.map((op) => (
                                        <div 
                                            key={op.id} 
                                            className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-[#042d6d] shrink-0">
                                                    <FontAwesomeIcon icon="fa-solid fa-hospital-user" className="text-lg" />
                                                </div>

                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg">
                                                        {op.organ} <span className="text-[#042d6d] font-medium text-sm ml-1">Transplant</span>
                                                    </h3>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                            <FontAwesomeIcon icon="fa-regular fa-calendar" className="opacity-70" />
                                                            <span>Scheduled: <span className="font-semibold text-slate-700">{op.scheduled_date ? new Date(op.scheduled_date).toLocaleString() : 'TBD'}</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                            <FontAwesomeIcon icon="fa-solid fa-user-injured" className="opacity-70" />
                                                            <span>Patient: <span className="font-semibold text-slate-700">{op.recipient_name}</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                    
                                            <div className="flex items-center">
                                                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 uppercase tracking-tighter">
                                                    {op.match_status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <FontAwesomeIcon icon="fa-solid fa-calendar-xmark" className="text-2xl" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No upcoming operations scheduled.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default HPDash;