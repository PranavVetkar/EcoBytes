import { useEffect, useState } from "react";
import api from "../services/api";

interface Registration {
    id: string;
    user_id: string;
    user_name: string;
    status: "pending" | "approved" | "rejected";
    registered_at: string;
}

interface ManageRsvpsModalProps {
    eventId: string;
    eventTitle: string;
    onClose: () => void;
}

export default function ManageRsvpsModal({ eventId, eventTitle, onClose }: ManageRsvpsModalProps) {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRsvps = async () => {
        try {
            setLoading(true);
            const res = await api.get<Registration[]>(`/events/${eventId}/rsvps`);
            setRegistrations(res.data);
        } catch (err) {
            console.error("Failed to fetch RSVPs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRsvps();
    }, [eventId]);

    const handleUpdateStatus = async (regId: string, status: "approved" | "rejected") => {
        try {
            await api.patch(`/registrations/${regId}?status_update=${status}`);
            setRegistrations(prev =>
                prev.map(r => (r.id === regId ? { ...r, status } : r))
            );
        } catch (err: any) {
            alert("Failed to update status: " + (err.response?.data?.detail || err.message));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-100 animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-r from-earth-600 to-earth-500 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black tracking-tight">Manage RSVPs</h3>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-earth-100">{eventTitle}</p>
                        </div>
                        <button onClick={onClose} className="rounded-full bg-white/20 p-1 hover:bg-white/30 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto pr-4 scrollbar-thin">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-earth-500 border-t-transparent" />
                        </div>
                    ) : registrations.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm text-gray-400 font-medium italic">No RSVP requests yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {registrations.map((reg) => (
                                <div key={reg.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-earth-100 flex items-center justify-center text-earth-700 font-black text-xs">
                                            {reg.user_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-terra-950">{reg.user_name}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${reg.status === "pending" ? "text-amber-500" :
                                                reg.status === "approved" ? "text-green-500" : "text-red-500"
                                                }`}>
                                                {reg.status}
                                            </p>
                                        </div>
                                    </div>

                                    {reg.status === "pending" && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(reg.id, "rejected")}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-red-50 active:scale-95"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                    <path d="M18 6 6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(reg.id, "approved")}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-green-500 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-green-50 active:scale-95"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full rounded-2xl bg-gray-100 py-3 text-sm font-black text-gray-500 transition-all hover:bg-gray-200 active:scale-95"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
