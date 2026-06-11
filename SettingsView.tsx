
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
import { Users, BookOpen, AlertTriangle, Briefcase, FileCheck, CheckCircle2, ShieldCheck } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center space-x-6 hover:shadow-sm hover:-translate-y-1 transition-all duration-300">
        <div className={`p-4 rounded-2xl ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{title}</p>
            <p className="text-3xl font-black text-slate-900">{value}</p>
        </div>
    </div>
);

export const PrincipalDashboard: React.FC = () => {
    const { students, lecturers, courses, setView } = useAuth();
    
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.registrationStatus === 'Registered').length;
    const pendingStudents = totalStudents - activeStudents;
    const paidStudents = students.filter(s => s.paymentStatus === 'Paid').length;
    
    const pieData = [
        { name: 'Fully Registered', value: activeStudents },
        { name: 'Pending Registration', value: pendingStudents }
    ];
    const COLORS = ['#0891b2', '#f43f5e'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">High-level administration analytics and institutional performance.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Accounts" 
                    value={totalStudents} 
                    icon={<Users className="h-6 w-6" />}
                    colorClass="bg-slate-50 text-slate-400"
                />
                <StatCard 
                    title="Active Students" 
                    value={activeStudents} 
                    icon={<CheckCircle2 className="h-6 w-6" />}
                    colorClass="bg-cyan-50 text-cyan-600"
                />
                <StatCard 
                    title="Pending Reg" 
                    value={pendingStudents} 
                    icon={<AlertTriangle className="h-6 w-6" />}
                    colorClass="bg-rose-50 text-rose-500"
                />
                <StatCard 
                    title="Faculty Staff" 
                    value={lecturers.length} 
                    icon={<Briefcase className="h-6 w-6" />}
                    colorClass="bg-emerald-50 text-emerald-600"
                />
            </div>

            {/* Quick Actions for Principal */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <h3 className="font-black text-xl text-slate-800 mb-6">Quick Actions</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={() => setView('lecturers')}
                        className="flex-1 bg-cyan-600 text-white font-black py-4 px-6 rounded-2xl shadow-sm hover:bg-cyan-700 transition flex items-center justify-center gap-2"
                    >
                        <Users className="w-5 h-5" />
                        Manage Staff
                    </button>
                    <button 
                        onClick={() => setView('leadership')}
                        className="flex-1 bg-emerald-600 text-white font-black py-4 px-6 rounded-2xl shadow-sm hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                    >
                        <ShieldCheck className="w-5 h-5" />
                        Leadership Management
                    </button>
                    <button 
                        onClick={() => setView('announcements')}
                        className="flex-1 bg-cyan-600 text-white font-black py-4 px-6 rounded-2xl shadow-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                        <AlertTriangle className="w-5 h-5" />
                        Broadcast
                    </button>
                    <button 
                        onClick={() => setView('bursary')}
                        className="flex-1 bg-slate-900 text-white font-black py-4 px-6 rounded-2xl shadow-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
                    >
                        <FileCheck className="w-5 h-5" />
                        Finances
                    </button>
                </div>
            </div>
        </div>
    );
};
