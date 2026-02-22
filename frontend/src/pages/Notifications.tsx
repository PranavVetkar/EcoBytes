import { useEffect, useState } from "react";
import api from "../services/api";
import type { Notification } from "../types";

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get<Notification[]>("/notifications/");
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    return (
        <div className="w-full">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-garden-olive tracking-tight font-creative italic">Activity</h1>
                <p className="text-sm text-garden-olive/60 font-medium mt-2">Stay updated with your eco-sphere.</p>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-garden-olive border-t-transparent" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="rounded-[2.5rem] border-2 border-dashed border-garden-lavender bg-garden-cream/50 p-12 text-center">
                    <p className="text-garden-olive/40 font-black italic uppercase tracking-widest text-xs">No activity yet. Go explore!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                            className={`flex items-start gap-4 rounded-[2rem] p-6 shadow-xl transition-all duration-300 border ${notif.is_read
                                ? "bg-white border-garden-lavender opacity-80 shadow-garden-olive/5"
                                : "bg-gradient-to-br from-garden-cream to-white border-garden-lavender shadow-garden-olive/10 scale-[1.02]"
                                }`}
                        >
                            <div className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${notif.is_read ? "bg-garden-olive/10" : "bg-garden-purple shadow-lg animate-pulse"}`} />
                            <div className="flex-1">
                                <p className={`text-sm leading-relaxed ${notif.is_read ? "text-garden-olive/60" : "text-garden-olive font-black"}`}>
                                    {notif.message}
                                </p>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-garden-olive/30 uppercase tracking-[0.2em]">
                                        {new Date(notif.timestamp).toLocaleDateString()}
                                    </span>
                                    {!notif.is_read && (
                                        <span className="rounded-full bg-garden-purple px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white shadow-md">
                                            New
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
