import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

library.add(fas, far, fab);

const navigation = [
    { name: 'Dashboard', href: '/tc', icon: 'fa-solid fa-table-columns' }, // 5 recent matches and pending patient verification requests
    { name: 'Register Patients', href: '/patients', icon: 'fa-solid fa-user-plus' }, // show the registration form and patients list at the bottom
    { name: 'Matching Results', href: '/matches', icon: 'fa-solid fa-table-list' }, // show the registration form and patients list at the bottom
];

function TCPatients() {
    const [mobileMenuOpen] = useState(false);

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState('User');
    
    const [formData, setFormData] = useState({
        name: '',
        patient_type: 'Donor',
        organ: 'Kidney',
        blood_group: 'A',     
        rhesus_factor: '+',    
        medical_state: 'Living', 
        weight: '',
        height: '',
        blood_pressure: '',
        lab_date: new Date().toISOString().split('T')[0]
    });

    const location = useLocation();
    const mobileMenuRef = useRef(null);

    // Calculate Min Date for Lab Test (2 weeks ago)
    const minLabDate = () => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return d.toISOString().split('T')[0];
    };

    const fetchPatients = async () => {
        try {
            const res = await api.get('/unified-patients/');
            setPatients(res.data);
        } catch (err) {
            console.error("Error fetching patients", err);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const submissionData = {
            ...formData,
            blood_type: `${formData.blood_group}${formData.rhesus_factor}`,
            organ: formData.organ, 
        };

        try {
            await api.post('/unified-patients/', submissionData);
            alert("Patient registered successfully!");
            setFormData({
                name: '',
                patient_type: 'Donor',
                organ: 'Kidney',
                blood_group: 'A',     
                rhesus_factor: '+',    
                medical_state: 'Living', 
                weight: '',
                height: '',
                blood_pressure: '',
                lab_date: new Date().toISOString().split('T')[0]
            })
            fetchPatients();
        } catch (err) {
            console.error(err);
            alert("Registration failed.");
        } finally {
            setLoading(false);
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
            {/* Sidebar */}
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
                <main className="p-4 sm:p-8 space-y-8">   
                    {/* Registration Form */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 p-4 bg-slate-50/50">
                            <h2 className="font-bold text-slate-700">New Patient Registration</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#042d6d] outline-none" placeholder="John Doe" />
                            </div> 

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Patient Type</label>
                                <select value={formData.patient_type} onChange={(e) => setFormData({...formData, patient_type: e.target.value})} className="border border-slate-200 rounded-lg p-2 text-sm">
                                    <option value="Donor">Donor</option>
                                    <option value="Recipient">Recipient</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Organ</label>
                                <select value={formData.organ} onChange={(e) => setFormData({...formData, organ: e.target.value})} className="border border-slate-200 rounded-lg p-2 text-sm">
                                    <option value="Kidney">Kidney</option>
                                    <option value="Liver">Liver</option>
                                    <option value="Heart">Heart</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Medical State</label>
                                <select value={formData.medical_state} onChange={(e) => setFormData({...formData, medical_state: e.target.value})} className="border border-slate-200 rounded-lg p-2 text-sm">
                                    <option value="Living">Living</option>
                                    <option value="Deceased">Deceased</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Lab Test Date</label>
                                <input required type="date" min={minLabDate()} max={new Date().toISOString().split('T')[0]} value={formData.lab_date} onChange={(e) => setFormData({...formData, lab_date: e.target.value})} className="border border-slate-200 rounded-lg p-2 text-sm" />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Blood Group</label>
                                <select value={formData.blood_group} onChange={(e) => setFormData({...formData, blood_group: e.target.value})} className="border border-slate-200 rounded-lg p-2 text-sm">
                                    {['A', 'B', 'AB', 'O'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Rhesus Factor</label>
                                <select 
                                    value={formData.rhesus_factor} 
                                    onChange={(e) => setFormData({...formData, rhesus_factor: e.target.value})} 
                                    className="border border-slate-200 rounded-lg p-2 text-sm"
                                >
                                    {['+', '-'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="lg:col-span-3 flex justify-end pt-4 border-t border-slate-100">
                                <button disabled={loading} type="submit" className="bg-[#042d6d] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#154696] transition-all">
                                    {loading ? 'Processing...' : 'Register Patient'}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Patient List Table */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 p-4 flex justify-between items-center bg-slate-50/50">
                            <h2 className="font-bold text-slate-700">Patients</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                        <th className="px-6 py-4 font-bold">Name</th>
                                        <th className="px-6 py-4 font-bold">Type</th>
                                        <th className="px-6 py-4 font-bold">Organ</th>
                                        <th className="px-6 py-4 font-bold">Blood Group</th>
                                        <th className="px-6 py-4 font-bold">Medical State</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {patients.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-[#042d6d]">{p.name}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${p.patient_type === 'Donor' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {p.patient_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{p.organ}</td>
                                            <td className="px-6 py-4 text-sm font-mono">{p.blood_type}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{p.medical_state}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

export default TCPatients;