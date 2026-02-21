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
        <div className="mx-auto max-w-lg pb-24 pt-8 px-5">
            <h1 className="text-3xl font-black text-terra-950 mb-6">Activity</h1>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-terra-500 border-t-transparent" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-12 text-center">
                    <p className="text-gray-400 font-bold italic">No activity yet. Go explore!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                            className={`flex items-start gap-4 rounded-3xl p-5 shadow-sm ring-1 transition-all ${notif.is_read ? "bg-white ring-gray-100 opacity-80" : "bg-terra-50 ring-terra-100 shadow-md scale-[1.02]"
                                }`}
                        >
                            <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${notif.is_read ? "bg-gray-200" : "bg-terra-500 shadow-sm"}`} />
                            <div className="flex-1">
                                <p className={`text-sm leading-tight ${notif.is_read ? "text-gray-600" : "text-terra-950 font-black"}`}>
                                    {notif.message}
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {new Date(notif.timestamp).toLocaleDateString()}
                                    </span>
                                    {!notif.is_read && (
                                        <span className="rounded-full bg-terra-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-terra-600">
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
