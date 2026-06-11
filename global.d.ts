import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Settings, Eye, AlertTriangle, LogOut } from 'lucide-react';

export const SettingsView: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { handleTerminateAccount, user } = useAuth();

    const onTerminate = async () => {
        const confirmMsg = `DANGER: You are about to permanently delete your account (${user?.email}). All your personal data, records, and access will be IRREVERSIBLY removed from the system. Do you wish to proceed?`;
        if (window.confirm(confirmMsg)) {
            const finalConfirm = window.prompt("To confirm deletion, please type 'DELETE' in the box below:");
            if (finalConfirm === "DELETE") {
                await handleTerminateAccount();
            }
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto mt-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10 flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight text-slate-900 tracking-tight">App Settings</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Your Preferences</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-100 text-cyan-700 rounded-xl flex items-center justify-center">
                                <Eye size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Visual Theme</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Toggle high contrast dark mode for accessibility</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-cyan-600' : 'bg-slate-300'}`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-slate-50 shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-8' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>

                    <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100 mt-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-rose-900">Danger Zone</h3>
                                <p className="text-[11px] font-black text-rose-400 uppercase tracking-widest mt-0.5">Permanent Actions</p>
                                <p className="text-xs text-rose-700 mt-2 leading-relaxed">
                                    Terminating your account will permanently remove all your access and institutional data. Ensure you have backed up any necessary personal records before proceeding.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onTerminate}
                            className="w-full py-4 bg-white border-2 border-rose-100 text-rose-600 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <LogOut size={14} />
                            Terminate My Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
