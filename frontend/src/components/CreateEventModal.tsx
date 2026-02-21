import React, { useState } from "react";
import api from "../services/api";

interface CreateEventModalProps {
    communityId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateEventModal({ communityId, onClose, onSuccess }: CreateEventModalProps) {
    const [formData, setFormData] = useState({
        event_title: "",
        event_description: "",
        location_name: "",
        start_time: "",
        end_time: "",
        max_attendees: 50,
        requires_approval: false,
        event_type: "cleanup",
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Basic validation
            if (new Date(formData.end_time) <= new Date(formData.start_time)) {
                alert("End time must be after start time");
                setLoading(false);
                return;
            }

            await api.post("/events/", {
                ...formData,
                community_id: communityId,
                // Mocking lat/lng/geohash for now as requested by backend structure
                lat: 0,
                lng: 0,
                geohash: "mock",
                is_city_event: false,
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            alert("Failed to create event: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-100 animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-r from-terra-600 to-terra-500 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black tracking-tight">Create Community Event</h3>
                        <button onClick={onClose} className="rounded-full bg-white/20 p-1 hover:bg-white/30 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto pr-4 scrollbar-thin">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Event Title</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Neighborhood Beach Cleanup"
                            value={formData.event_title}
                            onChange={(e) => setFormData({ ...formData, event_title: e.target.value })}
                            className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-terra-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                        <textarea
                            required
                            rows={3}
                            placeholder="What will happen at this event?"
                            value={formData.event_description}
                            onChange={(e) => setFormData({ ...formData, event_description: e.target.value })}
                            className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-terra-500 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Start Time</label>
                            <input
                                required
                                type="datetime-local"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-xs focus:ring-2 focus:ring-terra-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">End Time</label>
                            <input
                                required
                                type="datetime-local"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-xs focus:ring-2 focus:ring-terra-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Location</label>
                        <input
                            required
                            type="text"
                            placeholder="Where is the event meeting point?"
                            value={formData.location_name}
                            onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                            className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-terra-500 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Max RSVPs</label>
                            <input
                                required
                                type="number"
                                min="1"
                                value={formData.max_attendees}
                                onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) })}
                                className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-terra-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Event Type</label>
                            <select
                                value={formData.event_type}
                                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                                className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-terra-500 outline-none transition-all"
                            >
                                <option value="cleanup">Cleanup</option>
                                <option value="tree_planting">Tree Planting</option>
                                <option value="awareness">Awareness</option>
                                <option value="workshop">Workshop</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={formData.requires_approval}
                                onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                                className="peer sr-only"
                            />
                            <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-terra-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-terra-300"></div>
                        </label>
                        <span className="text-xs font-bold text-gray-600 tracking-tight">Require Approval for RSVPs</span>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-2xl bg-gray-100 py-3 text-sm font-black text-gray-500 transition-all hover:bg-gray-200 active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] rounded-2xl bg-terra-600 py-3 text-sm font-black text-white shadow-lg shadow-terra-200 transition-all hover:bg-terra-700 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Event"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
