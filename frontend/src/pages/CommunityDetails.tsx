import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { getCurrentUser } from "../services/auth";
import CreateEventModal from "../components/CreateEventModal";
import ManageRsvpsModal from "../components/ManageRsvpsModal";
import ActionDetailsModal from "../components/ActionDetailsModal";
import type { Community, EcoAction } from "../types";

export default function CommunityDetails() {
    const { id } = useParams<{ id: string }>();
    const [community, setCommunity] = useState<Community | null>(null);
    const [posts, setPosts] = useState<EcoAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<{ id: string, title: string } | null>(null);
    const [selectedAction, setSelectedAction] = useState<EcoAction | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [userRsvps, setUserRsvps] = useState<Record<string, string>>({}); // eventId -> status

    const user = getCurrentUser();
    const isAdmin = user?.uid === community?.admin_id;

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch community details
            const commRes = await api.get<Community>(`/communities/${id}`);
            setCommunity(commRes.data);

            // Fetch recent actions for this community
            const feedRes = await api.get<{ items: EcoAction[] }>(`/feed/?community_id=${id}`);
            setPosts(feedRes.data.items);

            // Fetch user's RSVPs if any (we'll need a way to check registration status)
            // For now, let's just mark the ones we know about locally or fetch all registrations for this user
            // In a real app, you'd have an endpoint like /users/me/registrations
        } catch (err) {
            console.error("Failed to load community details", err);
            setError("Could not load community details.");
        } finally {
            setLoading(false);
        }
    };

    const handleRsvp = async (eventId: string) => {
        try {
            await api.post(`/events/${eventId}/rsvp`);
            setUserRsvps(prev => ({ ...prev, [eventId]: "pending" }));
            alert("RSVP request sent! The host will review your request.");
        } catch (err: any) {
            alert("Failed to RSVP: " + (err.response?.data?.detail || err.message));
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-terra-500 border-t-transparent" />
            </div>
        );
    }

    if (error || !community) {
        return (
            <div className="p-4 text-center">
                <p className="text-red-500">{error || "Community not found."}</p>
                <Link to="/communities" className="mt-4 inline-block font-bold text-terra-600">
                    &larr; Back to Communities
                </Link>
            </div>
        );
    }

    const foundedDate = new Date(community.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    return (
        <div className="mx-auto max-w-lg pb-24">
            {/* Header / Hero */}
            <div
                className="relative h-64 w-full bg-terra-900 bg-cover bg-center mb-6"
                style={community.image_url ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${community.image_url})` } : {}}
            >
                <Link to="/communities" className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40">
                    &larr;
                </Link>
                <div className="absolute bottom-6 px-6 text-white w-full">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="mb-2 inline-block rounded-full bg-terra-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm ring-1 ring-white/20">
                                {community.type}
                            </span>
                            <h1 className="text-3xl font-black drop-shadow-md">{community.name}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm font-bold text-gray-200 drop-shadow-sm mt-3">
                        <div className="flex items-center gap-1">
                            <span>👥</span>
                            <span>{community.member_count.toLocaleString()}</span>
                        </div>
                        {community.location && (
                            <div className="flex items-center gap-1">
                                <span>📍</span>
                                <span>{community.location}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <span>🗓️</span>
                            <span>Est. {foundedDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="px-5 space-y-6">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">About Us</h2>
                    <p className="text-gray-700 leading-relaxed bg-white p-5 rounded-2xl shadow-sm ring-1 ring-gray-100">
                        {community.description || "No description provided."}
                    </p>
                </div>

                {community.area_of_work.length > 0 && (
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Focus Areas</h2>
                        <div className="flex flex-wrap gap-2">
                            {community.area_of_work.map(area => (
                                <span key={area} className="rounded-xl bg-terra-100 px-3 py-1.5 text-xs font-bold text-terra-800 tracking-wide uppercase">
                                    {area.replace(/_/g, " ")}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Upcoming Events</h2>
                        {isAdmin && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="rounded-full bg-terra-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-terra-600 ring-1 ring-terra-100 transition-all hover:bg-terra-600 hover:text-white"
                            >
                                + Create Event
                            </button>
                        )}
                    </div>
                    {community.upcoming_events && community.upcoming_events.length > 0 ? (
                        <div className="space-y-3">
                            {community.upcoming_events.map((evt, idx) => (
                                <div key={idx} className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md">
                                    <div className="flex gap-4 items-center">
                                        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-terra-50 to-white px-4 py-2 ring-1 ring-gray-100 shadow-sm min-w-[3.5rem]">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-terra-500">
                                                {new Date(evt.date).toLocaleString("default", { month: "short" })}
                                            </span>
                                            <span className="text-lg font-black text-terra-950 leading-none mt-1">
                                                {new Date(evt.date).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-terra-950">{evt.event_name}</p>
                                            <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">
                                                📍 {evt.location}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {isAdmin ? (
                                            <button
                                                onClick={() => {
                                                    const eid = (evt as any).event_id;
                                                    if (eid) {
                                                        setSelectedEvent({ id: eid, title: evt.event_name });
                                                        setIsManageModalOpen(true);
                                                    } else {
                                                        alert("Error: This event has no ID. (Mock events cannot be managed)");
                                                    }
                                                }}
                                                className="rounded-full bg-earth-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-earth-600 ring-1 ring-earth-100 hover:bg-earth-600 hover:text-white transition-all"
                                            >
                                                Manage
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    const eid = (evt as any).event_id;
                                                    if (eid) handleRsvp(eid);
                                                    else alert("Error: This event has no ID.");
                                                }}
                                                disabled={userRsvps[(evt as any).event_id] !== undefined}
                                                className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${userRsvps[(evt as any).event_id]
                                                    ? "bg-gray-100 text-gray-400 cursor-default"
                                                    : "bg-terra-600 text-white shadow-sm hover:bg-terra-700 active:scale-95"
                                                    }`}
                                            >
                                                {userRsvps[(evt as any).event_id] || "RSVP"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-6 text-center">
                            <p className="text-xs text-gray-400 italic">No events scheduled yet.</p>
                        </div>
                    )}
                </div>

                {isCreateModalOpen && (
                    <CreateEventModal
                        communityId={community.id}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={fetchData}
                    />
                )}

                {isManageModalOpen && selectedEvent && (
                    <ManageRsvpsModal
                        eventId={selectedEvent.id}
                        eventTitle={selectedEvent.title}
                        onClose={() => setIsManageModalOpen(false)}
                    />
                )}
            </div>

            <hr className="my-8 border-gray-100 border-2 mx-5" />

            {/* Recent Posts Section */}
            <div className="px-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Recent Activity</h2>
                    <Link
                        to="/log"
                        state={{ community_id: community.id }}
                        className="rounded-full bg-terra-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-terra-600 ring-1 ring-terra-100 transition-all hover:bg-terra-600 hover:text-white"
                    >
                        + Post Activity
                    </Link>
                </div>

                {posts.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center mt-4">
                        <p className="text-gray-500 font-medium">No actions posted yet.</p>
                        <Link to="/log" state={{ community_id: community.id }} className="mt-4 inline-block bg-terra-600 text-white font-bold py-2 px-6 rounded-full text-sm shadow-sm">
                            Be the first to post
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {posts.map(post => {
                            const mediaUrl = post.image_url || post.video_url || "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=400";
                            return (
                                <button
                                    key={post.id}
                                    onClick={() => {
                                        setSelectedAction(post);
                                        setIsActionModalOpen(true);
                                    }}
                                    className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 text-left"
                                >
                                    <img
                                        src={mediaUrl}
                                        alt="Action"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-2 text-white">
                                        <p className="text-[10px] font-bold truncate">{post.category.replace(/_/g, " ")}</p>
                                        <p className="text-[9px] truncate">{post.quantity} {post.quantity_unit}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {isActionModalOpen && selectedAction && (
                <ActionDetailsModal
                    action={selectedAction}
                    onClose={() => setIsActionModalOpen(false)}
                    onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                />
            )}

        </div>
    );
}
