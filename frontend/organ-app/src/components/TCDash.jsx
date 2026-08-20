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
    { name: 'Dashboard', href: '/tc', icon: ['fas', 'table-columns'] }, 
    { name: 'Register Patients', href: '/patients', icon: 'fa-solid fa-user-plus' }, 
    { name: 'Matching Results', href: '/matches', icon: 'fa-solid fa-table-list' }, 
];

function TCDash() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const mobileMenuRef = useRef(null);
    const mobileButtonRef = useRef(null);
    const [stats, setStats] = useState(null);
    const [displayName, setDisplayName] = useState('User');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [scheduledDate, setScheduledDate] = useState('');

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/tc/stats/');
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
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

    useEffect(() => {
        const savedName = localStorage.getItem('user_name');

        if (savedName) {
            setDisplayName(savedName);
        }

        fetchStats();
    }, []);

    useEffect(() => {
        const handleClick = (e) => {
            if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && !mobileButtonRef.current.contains(e.target)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [mobileMenuOpen]);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const payload = { match_status: selectedMatch.status };
            if (selectedMatch.status === 'APPROVED' && scheduledDate) {
                payload.scheduled_date = scheduledDate;
            }
            await api.patch(`/matching/${selectedMatch.id}/`, payload);
            await fetchStats();
            setIsEditModalOpen(false);
            showNotification(`Successfully updated match status to ${selectedMatch.status}`);
        } catch (err) {
            console.error('Update failed:', err);
            showNotification("Failed to update status. Please check your permissions.", "error");
        } finally {
            setIsUpdating(false);
        }
    };

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

                <main className="p-4 sm:p-8 space-y-6 pt-4">
                    {/* Header Widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl shrink-0">
                                <FontAwesomeIcon icon="fa-solid fa-hand-holding-heart" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Donors</p>
                                <p className="text-2xl font-extrabold text-[#042d6d]">{stats?.total_donors || 0}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl shrink-0">
                                <FontAwesomeIcon icon="fa-solid fa-bed-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Recipients</p>
                                <p className="text-2xl font-extrabold text-[#042d6d]">{stats?.total_recipients || 0}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl shrink-0">
                                <FontAwesomeIcon icon={['fas', 'handshake']} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Matches</p>
                                <p className="text-2xl font-extrabold text-[#042d6d]">{stats?.pending_matches || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link to="/patients" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-[#042d6d] hover:shadow-md transition-all group flex items-start gap-4 cursor-pointer">
                            <div className="w-10 h-10 bg-slate-100 text-slate-600 group-hover:bg-[#042d6d] group-hover:text-white rounded-lg flex items-center justify-center shrink-0 transition-colors">
                                <FontAwesomeIcon icon="fa-solid fa-user-plus" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-[#042d6d] transition-colors">Register New Patient</h3>
                                <p className="text-xs text-slate-500 mt-1">Add a new donor or recipient to the waiting list.</p>
                            </div>
                        </Link>
                        <Link to="/matches" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-[#042d6d] hover:shadow-md transition-all group flex items-start gap-4 cursor-pointer">
                            <div className="w-10 h-10 bg-slate-100 text-slate-600 group-hover:bg-[#042d6d] group-hover:text-white rounded-lg flex items-center justify-center shrink-0 transition-colors">
                                <FontAwesomeIcon icon="fa-solid fa-microscope" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-[#042d6d] transition-colors">Run Match Algorithm</h3>
                                <p className="text-xs text-slate-500 mt-1">Find compatible donors for your active recipients.</p>
                            </div>
                        </Link>
                    </div>

                    {/* Recent Matches Table */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-700">Recent Matches</h2>
                            <Link to="/matches" className="text-xs font-bold text-[#042d6d] hover:underline">View All</Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                        <th className="px-6 py-4 font-bold">Match ID</th>
                                        <th className="px-6 py-4 font-bold">Donor</th>
                                        <th className="px-6 py-4 font-bold">Recipient</th>
                                        <th className="px-6 py-4 font-bold">Organ</th>
                                        <th className="px-6 py-4 font-bold">Score</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold text-right">Date</th>
                                        <th className="px-6 py-4 font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {stats?.recent_matches?.map((m, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-slate-500">#{m.id}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-[#042d6d]">{m.donor_name}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-[#042d6d]">{m.recipient_name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{m.organ}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="text-green-600 font-bold">{m.score}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                    m.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    m.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    m.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 text-right">{m.date}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <button className="text-slate-400 hover:text-[#042d6d]" 
                                                onClick={ () => {
                                                    setSelectedMatch(m); 
                                                    setScheduledDate(new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16));
                                                    setIsEditModalOpen(true);
                                                }}>
                                                    <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats?.recent_matches || stats.recent_matches.length === 0) && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-slate-500 text-sm">
                                                No recent matches found. Start matching recipients and donors!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
            </div>
            
            {isEditModalOpen && selectedMatch && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-[#042d6d]">Update Match Status</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <FontAwesomeIcon icon="fa-solid fa-xmark" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Editing Match</p>
                                <p className="text-sm font-medium text-slate-700">
                                    {selectedMatch.donor_name} → {selectedMatch.recipient_name}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Matching Phase</label>
                                <select 
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#042d6d] outline-none"
                                    value={selectedMatch.status}
                                    onChange={(e) => setSelectedMatch({...selectedMatch, status: e.target.value})}
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                            </div>

                            {selectedMatch.status === 'APPROVED' && (
                                <div className="mt-4">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Scheduled Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#042d6d] outline-none"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Specify when the operation is expected to occur.</p>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 bg-slate-300 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-[#042d6d] hover:bg-[#154696] rounded-lg shadow-md transition-all disabled:opacity-50"
                                >
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TCDash;