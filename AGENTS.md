
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SubmitComplaint } from '../components/SubmitComplaint';
import type { StudentDetails, Grade } from '../types';
import { Users, Table, BookOpen, ChevronRight, ShieldCheck } from 'lucide-react';

const InfoCard: React.FC<{ title: string, value: string, statusColor: string }> = ({ title, value, statusColor }) => (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className={`text-lg font-bold mt-1 ${statusColor}`}>{value}</p>
    </div>
);

const GradeCard: React.FC<{ grade: Grade, courses: any[] }> = ({ grade, courses }) => {
    const course = courses.find(c => c.id === grade.courseId);
    const isFinalized = grade.status === 'finalized';
    
    return (
        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-cyan-200 transition-all">
            <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{grade.moduleId}</p>
                <p className="text-xs font-bold text-slate-700 mt-1">{course?.title || 'Unknown Course'}</p>
            </div>
            <div className="text-right">
                {isFinalized ? (
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-cyan-600">{grade.totalScore}%</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-[10px]">
                            {grade.grade}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        🔒 Under Review
                    </div>
                )}
            </div>
        </div>
    );
};

export const StudentDashboard: React.FC = () => {
    const { user, setView, announcements, courses, registrationData } = useAuth();
    if (user?.role !== 'Student') return null;

    const student = user as StudentDetails;
    const latestAnnouncement = announcements.length > 0 ? announcements[0] : null;

    // Room Allocation Logic
    const isNewHostel = student.hostelId === 'New Hostel';
    const floor = student.roomId ? student.roomId.charAt(0) : 'N/A';
    const room = student.roomId || 'N/A';
    
    const allocationDisplay = student.hostelStatus === 'Allocated' 
        ? (isNewHostel 
            ? `Floor ${floor} | Room ${room}`
            : `Block ${(student as any).blockAssigned || 'A'} | Room ${room}`)
        : (student.hostelStatus === 'Off-Campus' ? 'Off-Campus' : 'Not Allocated');

    // Financial Status Logic - checking across multiple paid points
    const financialStatus = student.paymentStatus === 'Completed' || (student.paymentStatus === 'Paid' && student.balanceDue <= 0)
        ? 'Clear'
        : 'Approved';

    const financialColor = financialStatus === 'Clear' ? 'text-emerald-600' : 'text-emerald-700';

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Top Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-50 rounded-bl-full opacity-40 pointer-events-none z-0" />
                    <div className="relative z-10">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Users size={60} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Financial Standing</p>
                        <p className={`text-xl md:text-2xl font-black text-slate-900 tracking-tight ${financialColor}`}>{financialStatus}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">All registration fees confirmed.</p>
                    </div>
                </div>

                <div className="bg-cyan-600 rounded-[2.5rem] p-6 text-white shadow-sm shadow-cyan-100 relative overflow-hidden group col-span-1 lg:col-span-2">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Table size={100} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-2">Accommodation Detail</p>
                    <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{allocationDisplay}</p>
                    <div className="mt-3 flex items-center gap-3">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                            {student.hostelId || 'Residence'}
                        </span>
                        {student.gender && (
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {student.gender} Wing
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group text-right flex flex-col items-end">
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-50 rounded-tr-full opacity-40 pointer-events-none z-0" />
                    <div className="relative z-10 text-right flex flex-col items-end w-full">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Registration</p>
                        <p className={`text-xl md:text-2xl font-black tracking-tight ${student.registrationStatus === 'Registered' ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {student.registrationStatus}
                        </p>
                        <button 
                            onClick={() => setView('registration')}
                            className="mt-3 text-[10px] font-black text-cyan-700 uppercase tracking-widest hover:underline"
                        >
                            Review Workflow →
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Communication & Actions */}
                <div className="space-y-8">
                     <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative group">
                        <div className="p-8 pb-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-pulse" />
                                Official Notice
                            </h3>
                            {latestAnnouncement ? (
                                 <div className="space-y-4">
                                    <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-cyan-700 transition-colors uppercase">{latestAnnouncement.title}</h4>
                                    <p className="text-xs font-medium text-slate-500 line-clamp-4 leading-relaxed italic border-l-2 border-cyan-100 pl-4">
                                        "{latestAnnouncement.content}"
                                    </p>
                                    <div className="pt-4 flex items-center justify-between">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {latestAnnouncement.authorRole || 'Admin'}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {new Date(latestAnnouncement.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-xs font-bold">Waiting for institutional updates...</p>
                            )}
                        </div>
                        <div className="p-2">
                             <button 
                                onClick={() => setView('announcements')}
                                className="w-full py-4 bg-slate-900 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                            >
                                Open Bulletin Board <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={() => setView('registration')}
                            className="w-full bg-white border border-slate-100 p-6 rounded-[2.5rem] flex flex-col items-center gap-3 hover:border-indigo-200 transition-all group shadow-sm"
                        >
                            <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-cyan-700 transition-colors">
                                <ShieldCheck size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Formal Registration Portal</span>
                        </button>
                        <SubmitComplaint />
                    </div>
                </div>
            </div>
        </div>
    );
};
