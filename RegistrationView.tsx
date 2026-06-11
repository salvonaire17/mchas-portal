
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StudentDetails, Announcement, Payment, FeeStructure } from '../types';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion } from 'motion/react';
import { SubmitComplaint } from '../components/SubmitComplaint';
import { 
    User, 
    ClipboardCheck, 
    CreditCard, 
    Bell, 
    ChevronRight,
    GraduationCap,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar
} from 'lucide-react';

export const ParentDashboard: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [studentData, setStudentData] = useState<StudentDetails | null>(null);
    const [fees, setFees] = useState<FeeStructure | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        let unsubStudent: (() => void) | null = null;
        let unsubFees: (() => void) | null = null;
        let unsubAnnouncements: (() => void) | null = null;

        const setupStudentSync = (studentId: string) => {
            const studentRef = doc(db, 'users', studentId);
            unsubStudent = onSnapshot(studentRef, (docSnap) => {
                if (docSnap.exists()) {
                    const student = docSnap.data() as StudentDetails;
                    setStudentData(student);

                    // Fetch fees for student course
                    if (student.courseId) {
                        const q = query(collection(db, 'feeStructures'), where('courseId', '==', student.courseId));
                        unsubFees = onSnapshot(q, (snap) => {
                            if (!snap.empty) {
                                setFees({ id: snap.docs[0].id, ...snap.docs[0].data() } as FeeStructure);
                            } else {
                                setFees(null);
                            }
                        }, (err) => console.warn("Fees snapshot error", err.message));
                    }
                }
                setLoading(false);
            }, (err) => console.warn("Student snapshot error", err.message));
        };

        const initialize = async () => {
            if (user.linkedStudentId) {
                setupStudentSync(user.linkedStudentId);
            } else if (user.linkedStudentName) {
                // Try one-time check to see if student exists now
                try {
                    const studentsRef = collection(db, 'users');
                    const q = query(studentsRef, where('role', '==', 'Student'), where('name', '==', user.linkedStudentName));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const studentId = snap.docs[0].id;
                        // Update parent profile with linked ID for future
                        updateUser(user.id, { linkedStudentId: studentId });
                        setupStudentSync(studentId);
                    } else {
                        setLoading(false);
                    }
                } catch (err) {
                    console.error("Error finding student for parent:", err);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }

            // Fetch announcements
            const qAnn = query(collection(db, 'announcements'), where('date', '>=', '2024-01-01'));
            unsubAnnouncements = onSnapshot(qAnn, (snapshot) => {
                const data: Announcement[] = [];
                snapshot.forEach(d => data.push({ id: d.id, ...d.data() } as Announcement));
                setAnnouncements(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            }, (err) => console.warn("Announcements snapshot error", err.message));
        };

        initialize();

        return () => {
            if (unsubStudent) unsubStudent();
            if (unsubFees) unsubFees();
            if (unsubAnnouncements) unsubAnnouncements();
        };
    }, [user?.id, user?.linkedStudentId, user?.linkedStudentName]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user?.linkedStudentId) {
        return (
            <div className="p-8 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm max-w-md mx-auto mt-10">
                <div className="w-20 h-20 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-amber-500">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight text-slate-900 leading-tight">Identity Linking Pending</h2>
                {user?.linkedStudentName ? (
                    <div className="mt-4 space-y-4">
                        <p className="text-slate-500 font-medium">
                            We are looking for a student profile matched with <span className="text-slate-900 font-bold">"{user.linkedStudentName}"</span>. 
                        </p>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] text-slate-400 font-medium">
                            Status: System is monitoring for student account activation...
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Once your child creates their account using this exact name, your profiles will be automatically synchronized.
                        </p>
                    </div>
                ) : (
                    <p className="text-slate-500 mt-4 font-medium leading-relaxed">
                        Your parent account is not yet linked to a student. Please ensure you have provided the correct student name during registration.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6 pb-20">
            {/* Child Profile Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-6 text-white shadow-sm shadow-blue-600/20 relative overflow-hidden"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <img 
                            src={studentData?.avatar || `https://ui-avatars.com/api/?name=${studentData?.name}`} 
                            className="w-16 h-16 rounded-2xl border-2 border-white/20 object-cover"
                            alt="Student" 
                        />
                        <div>
                            <p className="text-sm font-bold text-white/70 uppercase tracking-widest">Child's Profile</p>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight tracking-tight">{studentData?.name}</h2>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
                            <p className="text-[10px] font-black uppercase text-white/60 mb-1">Course</p>
                            <p className="text-sm font-bold truncate">{studentData?.courseId || 'N/A'}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
                            <p className="text-[10px] font-black uppercase text-white/60 mb-1">Reg. Number</p>
                            <p className="text-sm font-bold truncate">{studentData?.admissionNumber || studentData?.nactvetRegNo || 'Pending'}</p>
                        </div>
                    </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-600/20 rounded-full blur-3xl"></div>
            </motion.div>

            {/* Reporting Status */}
            <div className="grid grid-cols-1 gap-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Academic Status</h3>
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-[2.5rem] p-5 border border-slate-100 shadow-sm flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            studentData?.reportingStatus === 'Reported' ? 'bg-emerald-50 text-emerald-600' :
                            studentData?.reportingStatus === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                            'bg-amber-50 text-amber-600'
                        }`}>
                            <ClipboardCheck size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Reporting Status</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5 ${
                                studentData?.reportingStatus === 'Reported' ? 'text-emerald-500' :
                                studentData?.reportingStatus === 'Rejected' ? 'text-rose-500' :
                                'text-amber-500'
                            }`}>{studentData?.reportingStatus || 'Pending'}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Fees Status */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <CreditCard size={20} className="text-cyan-700" />
                        Fee Summary
                    </h3>
                    <span className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-[10px] font-black uppercase">
                        {fees ? fees.courseName : 'Standard Rates'}
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tuition</p>
                            <p className="text-lg font-black text-slate-900">
                                {fees ? fees.tuitionAmount.toLocaleString() : '1,200,000'} <span className="text-[10px] text-slate-400">TZS</span>
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Accommodation</p>
                            <p className="text-lg font-black text-slate-900">
                                {fees ? fees.hostelAmount.toLocaleString() : '350,000'} <span className="text-[10px] text-slate-400">TZS</span>
                            </p>
                        </div>
                    </div>
                    
                    {fees?.description && (
                        <div className="p-4 border-2 border-dashed border-slate-100 rounded-2xl">
                            <p className="text-[10px] font-black text-cyan-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Bell size={12} />
                                Bursar's Note
                            </p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                                "{fees.description}"
                            </p>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-medium">Status</span>
                        <span className={`font-black uppercase text-[10px] ${
                            studentData?.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                            {studentData?.paymentStatus || 'Pending Verification'}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Announcements Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Updates</h3>
                    <button className="text-cyan-700 text-[10px] font-black uppercase tracking-widest">View All</button>
                </div>
                
                <div className="space-y-3">
                    {announcements.slice(0, 3).map((ann, idx) => (
                        <motion.div 
                            key={ann.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + (idx * 0.1) }}
                            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-blue-200 transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-700 flex-shrink-0 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                                    <Bell size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-cyan-700 uppercase tracking-wide">College Notice</p>
                                        <span className="text-[10px] text-slate-400 font-bold">{new Date(ann.date).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800 mt-1 truncate">{ann.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ann.content}</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-cyan-700 transition-colors self-center" />
                            </div>
                        </motion.div>
                    ))}
                    
                    {announcements.length === 0 && (
                        <div className="text-center py-10 text-slate-400 italic text-sm">No recent announcements found.</div>
                    )}
                </div>
            </div>

            {/* Quick Actions / Notifications */}
            <div className="grid grid-cols-1 gap-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Submit Feedback</h3>
                <SubmitComplaint />
            </div>

            <div className="grid grid-cols-1 gap-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Daily Reminders</h3>
                <div className="bg-emerald-50 rounded-2xl px-5 py-4 flex items-center gap-4">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <p className="text-xs font-bold text-emerald-800">Your child has successfully completed reporting for Academic Year 2024!</p>
                </div>
            </div>
        </div>
    );
};
