import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Users, BookOpen, Bell, AlertTriangle, FileText, CheckCircle2, XCircle, TrendingDown, TrendingUp, Sparkles, MessageSquare, Video, FileCog, Send, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { SubmitComplaint } from '../components/SubmitComplaint';
import { StaffWorkflowLayout } from '../components/StaffWorkflowLayout';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

import PremiumDropdown from '../components/PremiumDropdown';

export const LecturerWorkbench: React.FC = () => {
    const { user, courses, students, announcements, setView } = useAuth();
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [attendanceFilter, setAttendanceFilter] = useState('all'); // all, weak
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    if (!user || !['Lecturer', 'HOD', 'Warden', 'Admission Officer', 'Principal'].includes(user.role)) return null;

    // Derived Data
    const myCourses = courses.filter(c => c.departmentId === user.departmentId);
    
    // All students in my department (even if not yet registered)
    const departmentalStudents = useMemo(() => {
        return students.filter(s => 
            (s.departmentId === user.departmentId) || 
            (s.courseId && myCourses.some(c => c.id === s.courseId))
        );
    }, [students, myCourses, user.departmentId]);

    // Registered students for specific course stats
    const enrolledStudents = useMemo(() => {
        return departmentalStudents.filter(s => s.registrationStatus === 'Registered' && (selectedCourseId ? s.courseId === selectedCourseId : true));
    }, [departmentalStudents, selectedCourseId]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header & Quick Analytics */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Lecturer Workbench</h1>
                    <p className="text-slate-500 font-medium">Welcome back, {user.name}. Here is your academic overview.</p>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Accounts" 
                    value={departmentalStudents.length} 
                    icon={<Users className="w-5 h-5 text-slate-400" />} 
                    gradient="from-slate-500 to-slate-600"
                />
                <StatCard 
                    title="Registered Students" 
                    value={enrolledStudents.length} 
                    icon={<CheckCircle className="w-5 h-5 text-emerald-500" />} 
                    gradient="from-emerald-500 to-teal-500"
                />
                <StatCard 
                    title="Assigned Courses" 
                    value={myCourses.length} 
                    icon={<BookOpen className="w-5 h-5 text-cyan-700" />} 
                    gradient="from-indigo-500 to-violet-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - 2 spans */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Empty left column for future widgets */}
                </div>

                {/* Right Column - 1 span */}
                <div className="space-y-8">
                    
                    {/* Communication Center */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 shadow-sm text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl group-hover:bg-cyan-600/40 transition-all duration-700"></div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-1 relative z-10">Communication Center</h2>
                        <p className="text-indigo-200 text-sm mb-6 relative z-10">Broadcast updates to your classes.</p>
                        
                        <div className="space-y-4 relative z-10">
                            <button 
                                onClick={() => setView('announcements')}
                                className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left border border-white/5 transition-all flex items-center gap-4"
                            >
                                <div className="w-10 h-10 rounded-full bg-cyan-600/30 flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-indigo-300" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">Send Announcement</p>
                                    <p className="text-[10px] text-indigo-200 mt-0.5 uppercase tracking-widest">Notify specific classes</p>
                                </div>
                            </button>
                            <button className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left border border-white/5 transition-all flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-cyan-500/30 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-cyan-300" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">Message Student</p>
                                    <p className="text-[10px] text-cyan-200 mt-0.5 uppercase tracking-widest">Direct communication</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Anonymous Feedback */}
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Direct Feedback</h3>
                        <SubmitComplaint />
                    </div>

                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, gradient: string, trend?: string }> = ({ title, value, icon, gradient, trend }) => (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-2 h-full bg-gradient-to-b ${gradient} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            {trend && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest text-slate-400 tracking-widest rounded-lg">{trend}</span>}
        </div>
        <div>
            <h3 className="text-3xl font-black text-slate-800 mb-1">{value}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        </div>
    </div>
);
