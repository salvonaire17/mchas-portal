
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { StudentDetails, LecturerDetails } from '../types';

const ProfileField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div className="group">
        <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-cyan-600 transition-colors">{label}</dt>
        <dd className="text-sm font-bold text-slate-900">{value || 'N/A'}</dd>
    </div>
);

import PremiumDropdown from '../components/PremiumDropdown';
import { DeleteAccountSection } from '../components/DeleteAccountSection';

export const ProfileView: React.FC = () => {
    const { user, departments, courses, updateUser, handleTerminateAccount } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState<'Male'|'Female'>('Female');
    const [avatar, setAvatar] = useState('');
    const [level, setLevel] = useState<string>('NTA 4');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setPhone(user.phone || '');
            setGender(user.gender || 'Female');
            setAvatar(user.avatar);
            setSelectedDeptId(user.departmentId || '');
            if (user.role === 'Student') {
                setLevel((user as StudentDetails).level as unknown as string || 'NTA 4');
                setSelectedCourseId((user as StudentDetails).courseId || '');
            }
            if ('modules' in user) {
                setSelectedModules((user as LecturerDetails).modules || []);
            }
        }
    }, [user, isEditing]);

    if (!user) return null;

    const departmentName = departments.find(d => d.id === user.departmentId)?.name;
    const isFaculty = user.role === 'Lecturer' || user.role === 'HOD' || user.role === 'Principal';

    const handleSave = () => {
        const updates: any = {
            name,
            email,
            phone,
            gender,
            avatar
        };

        if (isFaculty) {
            updates.modules = selectedModules;
            updates.departmentId = selectedDeptId;
        }

        if (user.role === 'Student') {
            updates.courseId = selectedCourseId;
            updates.level = level;
        }

        updateUser(user.id, updates);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
    };

    const handleDeleteAccount = async () => {
        try {
            await handleTerminateAccount();
            toast.success("Your account has been permanently deleted.");
        } catch (err: any) {
            console.error("Account deletion failed:", err);
            toast.error(err.message || "Failed to delete account.");
            throw err;
        }
    };

    const toggleModule = (moduleId: string) => {
        setSelectedModules(prev => 
            prev.includes(moduleId) 
                ? prev.filter(id => id !== moduleId) 
                : [...prev, moduleId]
        );
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const MAX_HEIGHT = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    setAvatar(dataUrl);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                {/* Profile Header Banner */}
                <div className="h-32 bg-gradient-to-r from-slate-900 to-cyan-900 relative">
                    <div className="absolute -bottom-12 left-10">
                        <div className="relative group">
                            <img 
                                className="h-32 w-32 rounded-[2.5rem] border-4 border-white shadow-sm object-cover bg-white" 
                                src={isEditing ? avatar : user.avatar} 
                                alt={user.name} 
                            />
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <label className="cursor-pointer text-white text-[10px] font-black uppercase tracking-widest text-center px-2 w-full h-full flex flex-col justify-center items-center">
                                        Change Photo
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            )}
                            {!isEditing && user.role === 'Student' && (user as StudentDetails).reportingStatus === 'Reported' ? (
                                <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-emerald-500 border-[3.5px] border-white rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-emerald-400 to-emerald-600" title="Admission Approved">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : !isEditing && (
                                <div className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-12 px-6 md:px-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div className="text-center md:text-left">
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight bg-slate-50 border-b-2 border-cyan-500 outline-none px-2 w-full md:w-auto"
                                />
                            ) : (
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{user.name}</h3>
                            )}
                            <div className="flex items-center justify-center md:justify-start mt-2 space-x-3">
                                <span className="bg-cyan-50 text-cyan-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-cyan-100">
                                    {user?.role === 'HOD' ? `HOD - ${user?.departmentId || user?.courseId || 'DEPARTMENT'}` : user.role}
                                </span>
                                {user.title && (
                                    <>
                                        <span className="text-slate-200 text-xs">•</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.title}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            {isEditing ? (
                                <>
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest text-slate-400 tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95 duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        className="w-full sm:w-auto px-6 py-3 bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest text-slate-400 tracking-widest rounded-2xl hover:bg-cyan-700 transition-all active:scale-95 duration-200 shadow-sm shadow-cyan-100"
                                    >
                                        Save Changes
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest text-slate-400 tracking-widest rounded-2xl hover:bg-black transition-all active:scale-95 duration-200 shadow-sm shadow-slate-200"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 border-t border-slate-50 pt-10">
                        <div className="space-y-8">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-cyan-500 pl-4">Personal Information</h4>
                            <div className="grid grid-cols-1 gap-6 ml-5">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                            <input 
                                                type="email" 
                                                value={email} 
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:bg-white font-semibold text-slate-700 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                            <input 
                                                type="tel" 
                                                value={phone} 
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:bg-white font-semibold text-slate-700 outline-none transition-all"
                                            />
                                        </div>
                                        <PremiumDropdown 
                                            label="Gender"
                                            placeholder="Select Gender"
                                            options={[
                                                { id: 'Male', label: 'Male' },
                                                { id: 'Female', label: 'Female' }
                                            ]}
                                            selectedId={gender}
                                            onSelect={setGender as any}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <ProfileField label="Full Name" value={user.name} />
                                        <ProfileField label="Gender" value={user.gender || 'Not Provided'} />
                                        <ProfileField label="Email Address" value={user.email} />
                                        <ProfileField label="Phone Number" value={user.phone} />
                                        <ProfileField label="Member ID" value={user.id} />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-emerald-500 pl-4">Academic Placement</h4>
                            <div className="grid grid-cols-1 gap-6 ml-5">
                                {isEditing && isFaculty ? (
                                    <PremiumDropdown 
                                        label="Primary Department"
                                        placeholder="Select Department"
                                        options={departments.map(d => ({ id: d.id, label: d.name }))}
                                        selectedId={selectedDeptId}
                                        onSelect={(id) => {
                                            setSelectedDeptId(id);
                                            // Reset selected modules to only ones matching the new department
                                            setSelectedModules(prev => prev.filter(modId => {
                                                const c = courses.find(course => course.id === modId);
                                                return c?.departmentId === id;
                                            }));
                                        }}
                                    />
                                ) : (
                                    <ProfileField label="Department" value={departmentName} />
                                )}
                                
                                {user.role === 'Student' && (
                                    <>
                                        {isEditing ? (
                                            <>
                                                <PremiumDropdown 
                                                    label="Degree Program"
                                                    placeholder="Select Program"
                                                    options={courses.map(c => ({ id: c.id, label: c.title }))}
                                                    selectedId={selectedCourseId}
                                                    onSelect={setSelectedCourseId}
                                                />
                                                <PremiumDropdown 
                                                    label="Current Level"
                                                    placeholder="Select Level"
                                                    options={['NTA 4', 'NTA 5', 'NTA 6'].map(l => ({ id: l, label: l }))}
                                                    selectedId={level}
                                                    onSelect={setLevel}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <ProfileField label="Degree Program" value={(user as StudentDetails).courseId} />
                                                <ProfileField label="Current Level" value={(user as StudentDetails).level as unknown as string} />
                                                <ProfileField label="Registration" value={(user as StudentDetails).registrationStatus} />
                                            </>
                                        )}
                                    </>
                                )}

                                {isFaculty && (
                                    <>
                                        {user.role === 'HOD' && (
                                            <ProfileField 
                                                label="Leadership Role" 
                                                value={`Head of ${courses.find(c => c.id === user.courseId)?.title || 'Assigned Course'}`} 
                                            />
                                        )}
                                        <div className="group">
                                            <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-cyan-600 transition-colors">Teaching Assignments</dt>
                                            {isEditing ? (
                                                <div className="space-y-3 mt-4">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select Modules to Teach</p>
                                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                                                        {courses.filter(c => c.departmentId === selectedDeptId).map(course => (
                                                            <button
                                                                key={course.id}
                                                                onClick={() => toggleModule(course.id)}
                                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                                    selectedModules.includes(course.id)
                                                                        ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
                                                                        : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <div className="text-left">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest">{course.code}</p>
                                                                    <p className="text-xs font-bold">{course.title}</p>
                                                                </div>
                                                                {selectedModules.includes(course.id) && (
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <dd className="flex flex-wrap gap-2 mt-2">
                                                    {(user as LecturerDetails).modules && (user as LecturerDetails).modules.length > 0 ? (
                                                        (user as LecturerDetails).modules.map(modId => {
                                                            const course = courses.find(c => c.id === modId);
                                                            return (
                                                                <span key={modId} className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest text-slate-400 tracking-widest rounded-lg border border-slate-100 shadow-sm">
                                                                    {course ? `${course.code}: ${course.title}` : modId}
                                                                </span>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400 italic">No modules assigned yet</span>
                                                    )}
                                                </dd>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {user.role === 'Student' && (
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Financial Status</p>
                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ${(user as StudentDetails).registrationStatus === 'Registered' || (user as StudentDetails).paymentStatus === 'Completed' || (user as StudentDetails).paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {((user as StudentDetails).registrationStatus === 'Registered' || (user as StudentDetails).paymentStatus === 'Completed' || (user as StudentDetails).paymentStatus === 'Paid') && <CheckCircle2 size={16} />}
                                    <p>{(user as StudentDetails).registrationStatus === 'Registered' ? 'Approved' : (user as StudentDetails).paymentStatus}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hostel Status</p>
                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ${(user as StudentDetails).hostelStatus === 'Completed' ? 'text-emerald-600' : 'text-slate-700'}`}>
                                    {(user as StudentDetails).hostelStatus === 'Completed' && <CheckCircle2 size={16} />}
                                    <p>{(user as StudentDetails).hostelStatus}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">NHIF Status</p>
                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ${(user as StudentDetails).registrationStatus === 'Registered' || (user as StudentDetails).nhifStatus === 'Completed' || (user as StudentDetails).nhifStatus === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {((user as StudentDetails).registrationStatus === 'Registered' || (user as StudentDetails).nhifStatus === 'Completed' || (user as StudentDetails).nhifStatus === 'Active') && <CheckCircle2 size={16} />}
                                    <p>{(user as StudentDetails).registrationStatus === 'Registered' ? 'Active' : (user as StudentDetails).nhifStatus}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Danger Zone: Account Deletion */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <DeleteAccountSection onConfirmDelete={handleDeleteAccount} />
                    </div>
                </div>
            </div>

            <div className="mt-8 px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest gap-2">
                <p>Profile Managed by MCHAS Digital Registry</p>
                <p>Last Verified: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};
