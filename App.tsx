import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StudentDetails } from '../types';
import { Search, Monitor } from 'lucide-react';
import { motion } from 'motion/react';

export const SessionWatcherView: React.FC = () => {
    const { users } = useAuth();
    
    const activeUsers = users.filter(u => 
        u.isOnline || (u.lastActive && (new Date().getTime() - new Date(u.lastActive).getTime() < 60000))
    );

    const offlineUsers = users.filter(u => 
        !u.isOnline && (!u.lastActive || (new Date().getTime() - new Date(u.lastActive).getTime() >= 60000))
    );

    const displayedUsers = [...activeUsers, ...offlineUsers];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-cyan-400 shadow-sm shadow-slate-200">
                            <Monitor size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Session Watcher</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Live monitoring of active portal user sessions.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 px-6 py-4 rounded-[2.5rem] border border-emerald-100 text-center">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Active Now</p>
                            <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tight text-emerald-700 leading-none">{activeUsers.length}</p>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 rounded-[2.5rem] border border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
                            <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tight text-slate-900 leading-none">{users.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live active user sessions monitoring card */}
            <div className="bg-slate-950 text-white p-10 rounded-[2.5rem] shadow-sm border border-white/5 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-black uppercase text-cyan-400 tracking-widest flex items-center gap-3">
                            <span className="w-3 h-3 bg-cyan-400 rounded-full animate-ping inline-block" />
                            Live Network Stream
                        </h3>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-2">Real-time authentication activity and portal interaction tracing</p>
                    </div>
                    <div className="hidden md:flex gap-1.5">
                        <div className="w-1.5 h-6 bg-cyan-400/20 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-8 bg-cyan-400/40 rounded-full animate-bounce [animation-delay:-0.1s]" />
                        <div className="w-1.5 h-5 bg-cyan-400/60 rounded-full animate-bounce [animation-delay:-0.4s]" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {displayedUsers.length === 0 ? (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-600">
                                <Search size={40} />
                            </div>
                            <p className="text-sm text-slate-500 font-black uppercase tracking-widest leading-relaxed">
                                No user sessions currently detected.<br/>
                                <span className="text-[10px] text-slate-600">System is monitoring for incoming authentication packets...</span>
                            </p>
                        </div>
                    ) : (
                        displayedUsers.map((iterUser, idx) => {
                            const isOnline = activeUsers.some(u => u.id === iterUser.id);
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={iterUser.id} 
                                    className={`group p-5 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center gap-4 transition-all hover:bg-white/10 hover:shadow-sm cursor-pointer ${isOnline ? 'hover:border-cyan-500/30 hover:shadow-cyan-500/10' : 'hover:border-slate-500/30 hover:shadow-slate-500/10 opacity-60 hover:opacity-100'}`}
                                >
                                    <div className="relative">
                                        <img 
                                            referrerPolicy="no-referrer" 
                                            src={iterUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(iterUser.name)}`} 
                                            alt={iterUser.name} 
                                            className={`w-12 h-12 rounded-2xl bg-slate-800 object-cover border-2 border-transparent transition-all ${isOnline ? 'group-hover:border-cyan-400/50' : 'group-hover:border-slate-400/50 grayscale group-hover:grayscale-0'}`} 
                                        />
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-slate-900 rounded-full shadow-sm ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} title={isOnline ? 'Online' : 'Offline'} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-[13px] font-black truncate transition-colors leading-tight ${isOnline ? 'text-white group-hover:text-cyan-400' : 'text-slate-300 group-hover:text-white'}`}>{iterUser.name}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-cyan-400/80' : 'text-slate-500'}`}>{iterUser.role}</span>
                                        </div>
                                        {iterUser.role === 'Student' && (iterUser as StudentDetails).registrationWorkflow?.indexNumber && (
                                            <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between">
                                                <p className="text-[8px] text-slate-500 font-mono font-bold tracking-tighter truncate uppercase">
                                                    ID: {(iterUser as StudentDetails).registrationWorkflow?.indexNumber}
                                                </p>
                                                <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-white/20' : 'bg-slate-700'}`} />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Footer informational sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Security Protocol</h4>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        Session monitoring tracks real-time heartbeats from connected nodes. 
                        Users are flagged as 'Active' if a system pulse has been received within the last 60 seconds.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Traffic Insights</h4>
                    <div className="flex items-end gap-1 h-12">
                        {[40, 70, 45, 90, 65, 30, 85, 45, 95, 60].map((h, i) => (
                            <div key={i} className="flex-1 bg-slate-900 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
