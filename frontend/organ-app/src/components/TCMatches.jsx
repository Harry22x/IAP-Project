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
    { name: 'Dashboard', href: '/tc', icon: 'fa-solid fa-table-columns' }, 
    { name: 'Register Patients', href: '/patients', icon: 'fa-solid fa-user-plus' }, 
    { name: 'Matching Results', href: '/matches', icon: 'fa-solid fa-table-list' }, 
];

function TCMatches() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const mobileMenuRef = useRef(null);
    const mobileButtonRef = useRef(null);

    const [recipients, setRecipients] = useState([]);
    const [matching, setMatching] = useState(null);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [matchResults, setMatchResults] = useState([]);
    const [displayName, setDisplayName] = useState('User');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [scheduleModal, setScheduleModal] = useState({ isOpen: false, matchId: null, status: null, date: '' });

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
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

    useEffect(() => {
        const fetchRecipients = async () => {
            try {
                // Get all unified patients and filter only Recipients
                const res = await api.get('/unified-patients/');
                const activeRecipients = res.data.filter(p => p.patient_type === 'Recipient');
                setRecipients(activeRecipients);
            } catch (err) {
                console.error("Error fetching recipients", err);
            }
        };
        fetchRecipients();
    }, []);

    const runMatch = async (patientId, patientName) => {
        setMatching(patientId);
        setSelectedRecipient(patientName);
        try {
            const res = await api.post('/matching/run/', { recipient_id: patientId });
            setMatchResults(res.data);
            showNotification(`Algorithm execution complete. Found ${res.data.length} potential matches.`);
        } catch (err) {
            console.error("Error running match", err);
            showNotification("An error occurred while running the match operation.", "error");
        } finally {
            setMatching(null);
        }
    };

    const confirmStatusUpdate = async (matchId, newStatus, scheduledDate = null) => {
        try {
            const payload = { match_status: newStatus };
            if (scheduledDate) payload.scheduled_date = scheduledDate;
            
            await api.patch(`/matching/${matchId}/`, payload);
            showNotification(`Match status successfully updated to ${newStatus}`);
            
            // Update local state
            setMatchResults(prev => prev.map(m => m.match_id === matchId ? { ...m, match_status: newStatus } : m));
            setScheduleModal({ isOpen: false, matchId: null, status: null, date: '' });
        } catch (err) {
            console.error("Failed to update match status", err);
            showNotification("Update failed. Please check your permissions.", "error");
        }
    };

    const updateMatchStatus = (matchId, newStatus) => {
        if (newStatus === 'APPROVED') {
            // Open modal to pick a date
            const defaultDate = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16);
            setScheduleModal({ isOpen: true, matchId, status: newStatus, date: defaultDate });
        } else {
            // Immediately execute for reject/complete
            confirmStatusUpdate(matchId, newStatus);
        }
    };

    useEffect(() => {
        const savedName = localStorage.getItem('user_name');

        if (savedName) {
            setDisplayName(savedName);
        }
    }, []);

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">

            <aside
                ref={mobileMenuRef}
                className={`fixed top-0 left-0 z-50 h-screen w-64 flex flex-col bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="p-6 flex justify-between items-center">
                    <div>
                        <h1 className="font-extrabold text-xl tracking-tighter text-[#042d6d]">Transplant Coordinator Dashboard</h1>
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

                <main className="p-4 sm:p-8 space-y-8 pt-4">
                    {/* Active Recipients Section */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 p-4 bg-slate-50/50">
                            <h2 className="font-bold text-slate-700">Active Recipients Waiting for Match</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                        <th className="px-6 py-4 font-bold">Recipient Name</th>
                                        <th className="px-6 py-4 font-bold">Organ Needed</th>
                                        <th className="px-6 py-4 font-bold">Blood Type</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recipients.map((r, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-[#042d6d]">{r.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{r.organ}</td>
                                            <td className="px-6 py-4 text-sm font-mono">{r.blood_type}</td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                <button 
                                                    onClick={() => runMatch(r.patient_id, r.name)}
                                                    disabled={matching === r.patient_id}
                                                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition"
                                                >
                                                    {matching === r.patient_id ? 'Running...' : 'Run Match Algorithm'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {recipients.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-sm">
                                                No active recipients found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Match Results Section */}
                    {selectedRecipient && matchResults.length > 0 && (
                        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden border-t-4 border-t-green-500">
                            <div className="border-b border-slate-100 p-4 bg-green-50 flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-green-800">Top Matches for {selectedRecipient}</h2>
                                    <p className="text-xs text-green-700 mt-1">Showing compatible donors ordered by highest compatibility score.</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                            <th className="px-6 py-4 font-bold">Match ID</th>
                                            <th className="px-6 py-4 font-bold">Donor Name</th>
                                            <th className="px-6 py-4 font-bold">Compatibility Score</th>
                                            <th className="px-6 py-4 font-bold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {matchResults.map((m, idx) => (
                                            <tr key={idx} className="hover:bg-green-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-mono text-slate-500">#{m.match_id}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-[#042d6d]">{m.donor_name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[100px]">
                                                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(m.compatibility_score, 100)}%` }}></div>
                                                        </div>
                                                        <span className="text-sm font-bold text-green-700">{m.compatibility_score}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm flex items-center gap-2">
                                                    {m.match_status === 'PENDING' && (
                                                        <>
                                                            <button 
                                                                onClick={() => updateMatchStatus(m.match_id, 'APPROVED')}
                                                                className="px-2 py-1 bg-green-600 text-white rounded text-[10px] font-bold hover:bg-green-700"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button 
                                                                onClick={() => updateMatchStatus(m.match_id, 'REJECTED')}
                                                                className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {m.match_status === 'APPROVED' && (
                                                        <button 
                                                            onClick={() => updateMatchStatus(m.match_id, 'COMPLETED')}
                                                            className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700"
                                                        >
                                                            Complete
                                                        </button>
                                                    )}
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                        m.match_status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                        m.match_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                        m.match_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {m.match_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                    
                    {selectedRecipient && matchResults.length === 0 && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" />
                            No compatible donors found for {selectedRecipient} at this time.
                        </div>
                    )}
                </main>
            </div>

            {/* Schedule Match Modal */}
            {scheduleModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-[#042d6d]">Schedule Operation</h3>
                            <button onClick={() => setScheduleModal({ isOpen: false, matchId: null, status: null, date: '' })} className="text-slate-400 hover:text-slate-600">
                                <FontAwesomeIcon icon="fa-solid fa-xmark" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">You are approving this match. Please set a scheduled operation date to notify the healthcare professionals.</p>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Scheduled Date & Time</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#042d6d] outline-none"
                                    value={scheduleModal.date}
                                    onChange={(e) => setScheduleModal({ ...scheduleModal, date: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => setScheduleModal({ isOpen: false, matchId: null, status: null, date: '' })}
                                    className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 bg-slate-300 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => confirmStatusUpdate(scheduleModal.matchId, scheduleModal.status, scheduleModal.date)}
                                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md transition-all"
                                >
                                    Confirm Approval
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TCMatches;