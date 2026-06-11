import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, addDoc, onSnapshot, deleteDoc, doc, updateDoc, increment, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { MediaItem, EventItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Search, Upload, FileText, Image as ImageIcon, Video, Calendar, Bell, Folder, Share2, Heart, Eye, Trash2, X, AlertCircle, Trophy, BookOpen, Megaphone, Star } from 'lucide-react';

const CATEGORIES_RAW = [
    { label: 'All', value: 'All' },
    { label: '📚 Study Materials', value: 'Study Materials' },
    { label: '🎥 Videos', value: 'Videos' },
    { label: '📸 Photos', value: 'Photos' },
    { label: '🏀 Sports', value: 'Sports' },
    { label: '🎉 Events', value: 'Events' },
    { label: '📢 Announcements', value: 'Announcements' },
    { label: '🏫 Campus Life', value: 'Campus Life' }
];

interface MediaCenterViewProps {
    initialCategory?: string;
}

import PremiumDropdown from '../components/PremiumDropdown';

export const MediaCenterView: React.FC<MediaCenterViewProps> = ({ initialCategory }) => {
    const { user } = useAuth();
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadMode, setUploadMode] = useState<'Media' | 'Event'>('Media');
    
    // Media form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<MediaItem['type']>('Note');
    const [category, setCategory] = useState<MediaItem['category']>('Study Materials');
    const [url, setUrl] = useState(''); // Keep URL for external links if file is not uploaded
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [linkedEventId, setLinkedEventId] = useState('');

    // Event form
    const [eventDate, setEventDate] = useState('');
    const eventCoverRef = useRef<HTMLInputElement>(null);
    const [eventCoverFile, setEventCoverFile] = useState<File | null>(null);

    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
    const [activeTab, setActiveTab] = useState<'Discover' | 'Study Materials'>('Discover');
    
    // Auto-switch to events category if prop changes
    useEffect(() => {
        if (initialCategory) {
            setSelectedCategory(initialCategory);
            if (initialCategory === 'Study Materials') {
                setActiveTab('Study Materials');
            } else {
                setActiveTab('Discover');
            }
        }
    }, [initialCategory]);
    
    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const [usersMap, setUsersMap] = useState<Record<string, any>>({});

    useEffect(() => {
        const fetchUsers = async () => {
            const usersQ = query(collection(db, 'users'));
            const snap = await getDocs(usersQ);
            const umap: any = {};
            snap.forEach(d => { umap[d.id] = d.data(); });
            setUsersMap(umap);
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const qMedia = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
        const unsubMedia = onSnapshot(qMedia, (snapshot) => {
            const items: MediaItem[] = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as MediaItem);
            });
            setMediaItems(items);
        }, (err) => console.warn("Media snapshot error", err.message));

        const qEvents = query(collection(db, 'events'));
        const unsubEvents = onSnapshot(qEvents, (snapshot) => {
            const items: EventItem[] = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as EventItem);
            });
            setEvents(items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setLoading(false);
        }, (err) => console.warn("Events snapshot error", err.message));

        return () => {
            unsubMedia();
            unsubEvents();
        };
    }, []);

    const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                }, 
                (error) => reject(error), 
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    };

    const handleUploadMedia = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setIsUploading(true);
        let finalUrl = url;
        
        try {
            if (uploadFile) {
                finalUrl = await uploadFileToStorage(uploadFile, 'media');
            } else if (!url) {
                alert("Please provide a file or a URL.");
                setIsUploading(false);
                return;
            }

            await addDoc(collection(db, 'media'), {
                title,
                description,
                type,
                category,
                url: finalUrl,
                thumbnailUrl: thumbnailUrl || null,
                eventId: linkedEventId || null,
                uploadedBy: user.id,
                uploadedAt: new Date().toISOString(),
                views: 0,
                likes: 0
            });
            
            if (linkedEventId && (type === 'Image' || type === 'Video')) {
                // Increment event counts
                const field = type === 'Image' ? 'photoCount' : 'videoCount';
                await updateDoc(doc(db, 'events', linkedEventId), {
                    [field]: increment(1)
                });
            }

            setShowUploadModal(false);
            resetForm();
        } catch (error) {
            console.error("Error creating media", error);
            alert("Upload failed. Check permissions.");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleUploadEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        let finalCover = '';
        try {
            if (eventCoverFile) {
                finalCover = await uploadFileToStorage(eventCoverFile, 'events/covers');
            } else {
                alert("Please upload a cover image for the event.");
                setIsUploading(false);
                return;
            }

            await addDoc(collection(db, 'events'), {
                title,
                description,
                date: eventDate,
                coverImage: finalCover,
                photoCount: 0,
                videoCount: 0,
                featured: false
            });
            setShowUploadModal(false);
            resetForm();
        } catch (error) {
            console.error("Error creating event", error);
            alert("Failed to create event.");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setUrl('');
        setThumbnailUrl('');
        setEventDate('');
        setUploadFile(null);
        setEventCoverFile(null);
        setLinkedEventId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (eventCoverRef.current) eventCoverRef.current.value = '';
    }

    const handleDelete = async (id: string, uploadedBy: string, col: 'media' | 'events') => {
        if (user?.role !== 'Admin' && user?.id !== uploadedBy && user?.role !== 'HOD' && user?.role !== 'Principal') return;
        if (window.confirm("Are you sure you want to delete this?")) {
            await deleteDoc(doc(db, col, id));
        }
    }

    const handleLike = async (id: string, currentLikes: number = 0) => {
        try {
            await updateDoc(doc(db, 'media', id), {
                likes: increment(1)
            });
        } catch (err) {
            console.error(err);
        }
    }

    const handleView = async (item: MediaItem) => {
        if (item.url) window.open(item.url, '_blank');
        try {
            await updateDoc(doc(db, 'media', item.id), {
                views: increment(1)
            });
        } catch (err) {}
    }

    const canUpload = !!user && user.role !== 'Parent';

    const feedItems = useMemo(() => {
        let combined = [
            ...mediaItems.map(m => ({ ...m, feedType: 'media' as const, sortDate: m.uploadedAt })),
            ...events.map(e => ({ ...e, feedType: 'event' as const, sortDate: e.date }))
        ];

        if (selectedCategory && selectedCategory !== 'All') {
            if (selectedCategory === 'Events') {
                combined = combined.filter(i => i.feedType === 'event' || i.category === 'Events');
            } else {
                combined = combined.filter(i => i.feedType === 'media' && i.category === selectedCategory);
            }
        }

        if (searchQuery) {
            const sq = searchQuery.toLowerCase();
            combined = combined.filter(i => {
                if (i.feedType === 'media') {
                    return i.title.toLowerCase().includes(sq) || (i.description && i.description.toLowerCase().includes(sq));
                } else {
                    return i.title.toLowerCase().includes(sq) || (i.description && i.description.toLowerCase().includes(sq));
                }
            });
        }

        return combined.sort((a,b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());
    }, [mediaItems, events, selectedCategory, searchQuery]);

    const NEW_CATEGORIES = [
        { label: 'All', value: 'All', icon: <Star className="w-4 h-4 md:w-5 md:h-5" /> },
        { label: 'Photos', value: 'Photos', icon: <ImageIcon className="w-4 h-4 md:w-5 md:h-5" /> },
        { label: 'Videos', value: 'Videos', icon: <Video className="w-4 h-4 md:w-5 md:h-5" /> },
        { label: 'Sports', value: 'Sports', icon: <Trophy className="w-4 h-4 md:w-5 md:h-5" /> },
        { label: 'Events', value: 'Events', icon: <Calendar className="w-4 h-4 md:w-5 md:h-5" /> },
        { label: 'Notes', value: 'Study Materials', icon: <BookOpen className="w-4 h-4 md:w-5 md:h-5" /> },
        { label: 'Notices', value: 'Announcements', icon: <Megaphone className="w-4 h-4 md:w-5 md:h-5" /> },
    ];

    const activeEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 relative">
            
            {/* EVENT GALLERY HEADER */}
            {selectedEventId && activeEvent && (
                <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center mx-4 md:mx-0">
                    <div className="w-full md:w-1/3 aspect-video rounded-[2.5rem] overflow-hidden shadow-sm">
                        <img src={activeEvent.coverImage} className="w-full h-full object-cover" alt="Event Cover" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <button onClick={() => setSelectedEventId(null)} className="flex items-center gap-2 text-cyan-700 font-bold hover:text-blue-700 transition-colors text-sm mb-2">
                            <ChevronLeft className="w-4 h-4" /> Back to Feed
                        </button>
                        <h2 className="text-4xl font-black text-slate-900">{activeEvent.title}</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">{activeEvent.description}</p>
                        <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-300" /> {new Date(activeEvent.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-slate-300" /> {activeEvent.photoCount || 0} Photos</span>
                            <span className="flex items-center gap-1.5"><Video className="w-4 h-4 text-slate-300" /> {activeEvent.videoCount || 0} Videos</span>
                        </div>
                    </div>
                </div>
            )}

            {/* SEARCH BAR (Floating, Instagram/TikTok style) */}
            {!selectedEventId && (
                <div className="sticky top-4 z-40 px-4 md:px-0">
                    <div className="max-w-xl mx-auto backdrop-blur-xl bg-white/75 p-1 rounded-[1.5rem] border border-slate-200/50 shadow-sm shadow-slate-200/20 flex items-center">
                        <div className="pl-4 pr-2">
                            <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search events, videos, campus news..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-sm font-bold text-slate-700 placeholder:text-slate-400" 
                        />
                        {searchInput && (
                            <button onClick={() => { setSearchInput(''); setSearchQuery(''); }} className="pr-2 text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        {canUpload && (
                            <button 
                                onClick={() => setShowUploadModal(true)}
                                className="mr-1 bg-cyan-600 hover:bg-cyan-600 text-white p-2.5 rounded-2xl shadow-sm shadow-blue-500/20 transition-all active:scale-95 duration-200"
                                title="Upload"
                            >
                                <Upload className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* QUICK ICON CATEGORIES (Horizontal Stories-like row) */}
            {!selectedEventId && (
                <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-2 px-4 no-scrollbar md:justify-center">
                    {NEW_CATEGORIES.map(cat => (
                        <button 
                            key={cat.label}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`flex flex-col items-center justify-center gap-1.5 min-w-[50px] transition-all group ${
                                selectedCategory === cat.value 
                                ? 'opacity-100 scale-105' 
                                : 'opacity-70 hover:opacity-100'
                            }`}
                        >
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-sm transition-all p-1 border-2 ${
                                selectedCategory === cat.value 
                                ? 'border-blue-500 bg-white text-cyan-700 ring-2 ring-blue-50' 
                                : 'bg-white text-slate-600 group-hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                            }`}>
                               <div className={`w-full h-full rounded-full flex items-center justify-center ${selectedCategory === cat.value ? 'bg-cyan-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                    {cat.icon}
                               </div>
                            </div>
                            <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${selectedCategory === cat.value ? 'text-cyan-700' : 'text-slate-400'}`}>
                                {cat.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* CAMPUS FEED */}
            {selectedEventId && <div className="space-y-6 px-4"></div> /* Placeholder for event gallery content, reusing bottom part generally */}
            
            <div className="px-4">
                {loading ? (
                    <div className="py-20 text-center flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : feedItems.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center bg-white/60 rounded-[2.5rem] border border-white max-w-xl mx-auto shadow-sm backdrop-blur-md">
                        <div className="w-24 h-24 bg-cyan-50 flex items-center justify-center rounded-[2.5rem] mb-6 shadow-inner">
                            <Star className="w-10 h-10 text-blue-300" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight text-slate-800 tracking-tight mb-2">No posts yet</h3>
                        <p className="text-slate-500 font-medium">Be the first to share something amazing with the campus.</p>
                        {canUpload && (
                            <button onClick={() => setShowUploadModal(true)} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-[1.5rem] font-bold shadow-sm shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 active:scale-95 duration-200 transition-all">
                                Create Post
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8">
                        {feedItems.map((item: any) => (
                            <motion.div 
                                layout 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                key={item.id} 
                                className="group cursor-pointer"
                            >
                                {/* Media Thumbnail area */}
                                <div 
                                    className="relative aspect-video rounded-[1.25rem] overflow-hidden bg-slate-100 mb-4 transition-all group-hover:shadow-sm group-hover:shadow-blue-500/10"
                                    onClick={() => item.feedType === 'event' ? setSelectedEventId(item.id) : handleView(item)}
                                >
                                    {item.feedType === 'event' || item.type === 'Image' || item.type === 'Video' || item.thumbnailUrl ? (
                                        <div className="w-full h-full">
                                            <img 
                                                src={item.coverImage || item.thumbnailUrl || item.url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80'} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                alt={item.title} 
                                                loading="lazy" 
                                            />
                                            {item.type === 'Video' && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/20">
                                                    <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-sm">
                                                        <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm bg-white ${
                                                item.type === 'PDF' || item.type === 'Note' ? 'text-rose-500' :
                                                item.type === 'Announcement' ? 'text-amber-500' :
                                                'text-cyan-700'
                                            }`}>
                                                {item.type === 'PDF' && <FileText className="w-6 h-6 outline-none" />}
                                                {item.type === 'Announcement' && <Bell className="w-6 h-6 outline-none" />}
                                                {(item.type === 'Note' || item.type === 'Assignment' || item.type === 'Lecture') && <FileText className="w-6 h-6 outline-none" />}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Duration or Type Badge */}
                                    <div className="absolute bottom-3 right-3 z-20">
                                        <span className="px-2 py-1 bg-black/70 backdrop-blur-md rounded-md text-white text-[10px] font-black uppercase tracking-widest text-slate-400 tracking-widest">
                                            {item.feedType === 'event' ? 'Event' : item.type}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Info Section */}
                                <div className="flex gap-3 px-1">
                                    {item.feedType === 'media' && (
                                        <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 shadow-sm border border-white mt-1">
                                            <img src={(usersMap[item.uploadedBy]?.avatar) || `https://ui-avatars.com/api/?name=${item.uploadedBy}&background=0D8ABC&color=fff`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 text-xs md:text-sm leading-tight line-clamp-2 transition-colors mb-1 group-hover:text-cyan-700" onClick={() => item.feedType === 'event' ? setSelectedEventId(item.id) : handleView(item)}>
                                            {item.title}
                                        </h3>
                                        
                                        <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] md:text-xs text-slate-400 font-medium tracking-tight">
                                            {item.feedType === 'media' && <span className="truncate max-w-[80px]">{usersMap[item.uploadedBy]?.name || 'Admin'}</span>}
                                            {item.feedType === 'media' && <span className="w-1 h-1 rounded-full bg-slate-300"></span>}
                                            
                                            {item.feedType === 'media' ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span>{item.views || 0} views</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span>{new Date(item.sortDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <span>{item.photoCount || 0} photos</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span>{new Date(item.sortDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {item.feedType === 'media' && (
                                                    <button className="flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors" onClick={(e) => { e.stopPropagation(); handleLike(item.id, item.likes); }}>
                                                        <Heart className={`w-3 h-3 ${item.likes > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
                                                        <span className="text-[9px] font-black">{item.likes || 0}</span>
                                                    </button>
                                                )}
                                                {item.feedType === 'event' && (
                                                    <button onClick={() => setSelectedEventId(item.id)} className="text-[9px] font-bold text-cyan-700 uppercase tracking-widest hover:text-blue-700">
                                                        View Event
                                                    </button>
                                                )}
                                            </div>

                                            {(user?.id === item.uploadedBy || user?.role === 'Admin' || user?.role === 'Principal' || user?.role === 'HOD') && (
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.uploadedBy, item.feedType === 'event' ? 'events' : 'media'); }} className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* FLOATING ACTION BUTTON */}
            {canUpload && (
                <button 
                    onClick={() => setShowUploadModal(true)}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-cyan-600 hover:bg-cyan-600 text-white rounded-[2.5rem] shadow-sm shadow-blue-500/40 flex items-center justify-center hover:scale-105 active:scale-95 duration-200 transition-all z-50 group"
                >
                    <Upload className="w-8 h-8 transform group-hover:-translate-y-1 transition-transform" />
                </button>
            )}

            {/* UPLOAD MODAL */}
            <AnimatePresence>
                {showUploadModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl transition-all">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-sm max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-8 sticky top-0 bg-white z-10 py-2 border-b border-slate-50">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight text-slate-800 tracking-tight">Upload Content</h2>
                                    <p className="text-slate-500 font-medium text-sm mt-1">Add new media, resources, or events</p>
                                </div>
                                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex p-1.5 bg-slate-50 rounded-2xl mb-8">
                                <button onClick={() => setUploadMode('Media')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${uploadMode === 'Media' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Media / Video</button>
                                {['Admin', 'HOD', 'Principal', 'Teacher'].includes(user?.role || '') && (
                                    <button onClick={() => setUploadMode('Event')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${uploadMode === 'Event' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Campus Event</button>
                                )}
                            </div>

                            {uploadMode === 'Media' ? (
                                <form onSubmit={handleUploadMedia} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Title</label>
                                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 border-none outline-none font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400" placeholder="e.g. Introduction to Anatomy PDF" />
                                        </div>
                                        <div>
                                            <PremiumDropdown 
                                                label="Format Type"
                                                placeholder="Select Type"
                                                options={[
                                                    { id: 'Note', label: 'Note / Text' },
                                                    { id: 'PDF', label: 'PDF Document' },
                                                    { id: 'Image', label: 'Image / Photo' },
                                                    { id: 'Video', label: 'Video' },
                                                    { id: 'Lecture', label: 'Lecture Recording' },
                                                    { id: 'Assignment', label: 'Assignment' },
                                                    { id: 'Announcement', label: 'Announcement' }
                                                ]}
                                                selectedId={type}
                                                onSelect={(id) => setType(id as any)}
                                            />
                                        </div>
                                        <div>
                                            <PremiumDropdown 
                                                label="Category Section"
                                                placeholder="Select Category"
                                                options={CATEGORIES_RAW.filter(c => c.value !== 'All').map(c => ({ id: c.value, label: c.label }))}
                                                selectedId={category}
                                                onSelect={(id) => setCategory(id as any)}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <PremiumDropdown 
                                                label="Link Event (Optional)"
                                                placeholder="None"
                                                options={events.map(ev => ({ id: ev.id, label: ev.title }))}
                                                selectedId={linkedEventId}
                                                onSelect={setLinkedEventId}
                                            />
                                        </div>
                                        <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">File Upload</label>
                                            <input type="file" ref={fileInputRef} onChange={e => setUploadFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-cyan-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer" />
                                            <p className="text-xs text-slate-400 mt-3 font-medium">Leave this blank if you prefer providing a URL instead.</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Drive/Storage Link (URL)</label>
                                            <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 border-none outline-none font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400" placeholder="https://..." />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Description</label>
                                            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 border-none outline-none font-medium text-slate-700 resize-none h-32 transition-all placeholder:text-slate-400" placeholder="Brief description of the content..." />
                                        </div>
                                    </div>
                                    
                                    {isUploading && (
                                        <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                                            <div className="bg-cyan-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                                        <button disabled={isUploading} type="submit" className="px-8 py-4 bg-cyan-600 hover:bg-cyan-600 text-white font-black rounded-2xl transition-all active:scale-95 duration-200 text-sm shadow-sm shadow-blue-500/30 disabled:opacity-50">
                                            {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Publish Media'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleUploadEvent} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Event Title</label>
                                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 border-none outline-none font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400" placeholder="e.g. Annual Sports Day 2026" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Event Date</label>
                                            <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 border-none outline-none font-bold text-slate-700 transition-all" />
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Cover Image Upload</label>
                                            <input type="file" accept="image/*" ref={eventCoverRef} onChange={e => setEventCoverFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-cyan-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Description</label>
                                            <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 border-none outline-none font-medium text-slate-700 resize-none h-32 transition-all placeholder:text-slate-400" placeholder="Details about the event..." />
                                        </div>
                                    </div>
                                    
                                    {isUploading && (
                                        <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                                            <div className="bg-cyan-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                                        <button disabled={isUploading} type="submit" className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all active:scale-95 duration-200 text-sm shadow-sm shadow-slate-900/20 disabled:opacity-50">
                                            {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Create Event Target'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
};
