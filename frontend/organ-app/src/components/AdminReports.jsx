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

function AdminReports() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const mobileMenuRef = useRef(null);
    const mobileButtonRef = useRef(null);

    const [activeTab, setActiveTab] = useState('patients');
    const [patients, setPatients] = useState([]);
    const [matches, setMatches] = useState([]);

    const fetchReportsData = async () => {
        try {
            const [patientsRes, matchesRes] = await Promise.all([
                api.get('/unified-patients/'),
                api.get('/matching/')
            ]);
            setPatients(patientsRes.data);
            setMatches(matchesRes.data);
        } catch (err) {
            console.error("Error fetching reports data", err);
        }
    };

    useEffect(() => {
        fetchReportsData();
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

                <main className="p-4 sm:p-8 space-y-6 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="font-extrabold text-2xl text-[#042d6d]">System Reports</h2>
                            <p className="text-sm text-slate-500">View comprehensive registry data across all hospitals.</p>
                        </div>
                        
                    </div>

                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="flex border-b border-slate-200 bg-slate-50">
                            <button 
                                onClick={() => setActiveTab('patients')}
                                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'patients' ? 'text-[#042d6d] border-b-2 border-[#042d6d] bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                Registered Patients
                            </button>
                            <button 
                                onClick={() => setActiveTab('matches')}
                                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'matches' ? 'text-[#042d6d] border-b-2 border-[#042d6d] bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                Match Operations
                            </button>
                        </div>

                        <div className="p-0 overflow-x-auto">
                            {activeTab === 'patients' ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                            <th className="px-6 py-4 font-bold">Patient ID</th>
                                            <th className="px-6 py-4 font-bold">Name</th>
                                            <th className="px-6 py-4 font-bold">Type</th>
                                            <th className="px-6 py-4 font-bold">Organ</th>
                                            <th className="px-6 py-4 font-bold">Blood Type</th>
                                            <th className="px-6 py-4 font-bold">Hospital</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {patients.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 text-xs font-mono text-slate-500">{p.id}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-[#042d6d]">{p.name}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-600">{p.patient_type}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{p.organ}</td>
                                                <td className="px-6 py-4 text-sm font-mono">{p.blood_type}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{p.hospital_name || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                            <th className="px-6 py-4 font-bold">Match ID</th>
                                            <th className="px-6 py-4 font-bold">Donor</th>
                                            <th className="px-6 py-4 font-bold">Recipient</th>
                                            <th className="px-6 py-4 font-bold">Organ</th>
                                            <th className="px-6 py-4 font-bold">Status</th>
                                            <th className="px-6 py-4 font-bold">Date Logged</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {matches.map((m, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 text-xs font-mono text-slate-500">#{m.match_id}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-[#042d6d]">{m.donor_name}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-[#042d6d]">{m.recipient_name}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{m.organ}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                        m.match_status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                        m.match_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                        m.match_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {m.match_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{new Date(m.match_date).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

export default AdminReports;