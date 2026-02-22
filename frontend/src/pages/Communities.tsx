import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import type { Community, UserProfile, ActionCategory } from "../types";

const COMMUNITY_TYPES = ["local", "university", "corporate", "ngo", "other"];

const CATEGORIES: ActionCategory[] = [
    "recycling",
    "composting",
    "tree_planting",
    "energy_saving",
    "water_conservation",
    "carpooling",
    "public_transport",
    "cycling",
    "waste_cleanup",
    "sustainable_purchase",
    "other",
];

interface CommunitiesProps {
    profile: UserProfile | null;
    onRefresh: () => Promise<void>;
}

export default function Communities({ profile, onRefresh }: CommunitiesProps) {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    // Form state
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newLocation, setNewLocation] = useState("");
    const [newType, setNewType] = useState("local");
    const [selectedAreas, setSelectedAreas] = useState<ActionCategory[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const fetchCommunities = async () => {
        try {
            setLoading(true);
            const res = await api.get<{ items: Community[] }>("/communities/");
            setCommunities(res.data.items);
        } catch (err: any) {
            setError("Failed to load communities.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;

        setSubmitting(true);
        try {
            await api.post("/communities/", {
                name: newName,
                description: newDescription,
                location: newLocation,
                type: newType,
                area_of_work: selectedAreas,
            });
            setNewName("");
            setNewDescription("");
            setNewLocation("");
            setNewType("local");
            setSelectedAreas([]);
            setShowCreate(false);
            fetchCommunities();
            onRefresh(); // To update user's joined_community_ids
        } catch (err: any) {
            alert("Failed to create community: " + (err.response?.data?.detail || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoinLeave = async (commId: string, isJoining: boolean) => {
        try {
            if (isJoining) {
                await api.post(`/communities/${commId}/join`);
            } else {
                await api.post(`/communities/${commId}/leave`);
            }
            fetchCommunities();
            onRefresh();
        } catch (err: any) {
            alert("Action failed: " + (err.response?.data?.detail || err.message));
        }
    };

    const toggleArea = (area: ActionCategory) => {
        if (selectedAreas.includes(area)) {
            setSelectedAreas(selectedAreas.filter((a) => a !== area));
        } else {
            setSelectedAreas([...selectedAreas, area]);
        }
    };

    return (
        <div className="w-full">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-garden-olive tracking-tight font-creative italic">Communities</h1>
                    <p className="text-sm text-garden-olive/60 font-medium mt-2">Find your tribe and grow together.</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className={`rounded-2xl px-6 py-2.5 text-xs font-black transition-all shadow-md active:scale-95 ${showCreate
                        ? "bg-garden-cream text-garden-olive border border-garden-lavender"
                        : "bg-garden-olive text-garden-cream hover:bg-garden-olive/90"
                        }`}
                >
                    {showCreate ? "Close" : "Start New"}
                </button>
            </header>

            <div className="p-4">
                {showCreate && (
                    <form
                        onSubmit={handleCreate}
                        className="mb-12 overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-garden-olive/5 border border-garden-lavender"
                    >
                        <h2 className="mb-6 text-2xl font-black text-garden-olive font-creative italic">Start a Community</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    Community Name
                                </label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="mt-2 w-full rounded-2xl border-none bg-garden-cream/50 px-4 py-3.5 text-sm focus:ring-2 focus:ring-garden-olive placeholder:text-garden-olive/30"
                                    placeholder="e.g. Green Valley Residents"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    Description
                                </label>
                                <textarea
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="mt-2 w-full rounded-2xl border-none bg-garden-cream/50 px-4 py-3.5 text-sm focus:ring-2 focus:ring-garden-olive placeholder:text-garden-olive/30"
                                    placeholder="What is this community about?"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={newLocation}
                                        onChange={(e) => setNewLocation(e.target.value)}
                                        className="mt-1 w-full rounded-xl border-none bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-terra-500"
                                        placeholder="City, Country"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Type
                                    </label>
                                    <select
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value)}
                                        className="mt-2 w-full rounded-2xl border-none bg-garden-cream/50 px-4 py-3.5 text-sm focus:ring-2 focus:ring-garden-olive"
                                    >
                                        {COMMUNITY_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {t.charAt(0).toUpperCase() + t.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                    Areas of Focus
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => toggleArea(cat)}
                                            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${selectedAreas.includes(cat)
                                                ? "bg-garden-olive text-garden-cream shadow-md shadow-garden-olive/20"
                                                : "bg-garden-cream/50 text-garden-olive/60 hover:bg-garden-cream"
                                                }`}
                                        >
                                            {cat.replace(/_/g, " ")}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-2xl bg-garden-olive py-4 font-black text-garden-cream transition-all hover:bg-garden-olive/90 disabled:opacity-50 active:scale-95 shadow-lg shadow-garden-olive/20"
                            >
                                {submitting ? "Launching..." : "Launch Community"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="flex justify-center py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-garden-olive border-t-transparent" />
                </div>

                {error && <p className="text-center text-sm text-red-500">{error}</p>}

                {!loading && communities.length === 0 && (
                    <div className="py-20 text-center">
                        <p className="text-gray-400">No communities found. Be the first to create one!</p>
                    </div>
                )}

                <div className="space-y-6 pb-24">
                    {communities.map((c) => {
                        const isMember = profile?.joined_community_ids.includes(c.id);
                        const isAdmin = profile?.uid === c.admin_id;

                        return (
                            <div
                                key={c.id}
                                className="group flex flex-col overflow-hidden rounded-[2.5rem] bg-white border border-garden-lavender shadow-xl shadow-garden-olive/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-garden-olive/10"
                            >
                                {/* Community Hero */}
                                <div
                                    className="relative h-44 w-full bg-gradient-to-br from-garden-olive via-garden-purple to-garden-olive/80 p-6 flex flex-col justify-between bg-cover bg-center"
                                    style={c.image_url ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url(${c.image_url})` } : {}}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <span className="rounded-full bg-white/20 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/30">
                                                {c.type}
                                            </span>
                                            {isAdmin && (
                                                <span className="rounded-full bg-garden-purple/90 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        {c.rating > 0 && (
                                            <div className="flex items-center gap-1 rounded-full bg-black/20 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                                                <span>★</span>
                                                <span>{c.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-black tracking-tight text-garden-olive group-hover:text-garden-purple transition-all font-creative italic">{c.name}</h3>
                                            <div className="mt-1 flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="h-5 w-5 rounded-full border-2 border-white bg-gray-200" />
                                                    ))}
                                                </div>
                                                <p className="text-[11px] font-bold text-gray-400">
                                                    {c.member_count.toLocaleString()} members
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleJoinLeave(c.id, !isMember)}
                                                className={`w-full rounded-2xl px-6 py-3 text-xs font-black shadow-lg transition-all active:scale-95 ${isMember
                                                    ? "bg-garden-cream text-garden-olive/60 border border-garden-lavender"
                                                    : "bg-garden-olive text-garden-cream shadow-garden-olive/20 hover:shadow-garden-olive/40 translate-y-0 hover:-translate-y-0.5"
                                                    }`}
                                            >
                                                {isMember ? "Joined" : "Join Now"}
                                            </button>
                                            <Link
                                                to={`/communities/${c.id}`}
                                                className="w-full text-center rounded-2xl border border-garden-lavender/50 bg-garden-cream/30 px-6 py-2.5 text-xs font-black text-garden-olive hover:bg-white transition-all shadow-sm active:scale-95"
                                            >
                                                About Us
                                            </Link>
                                        </div>
                                    </div>

                                    {c.area_of_work.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {c.area_of_work.map((area) => (
                                                <span key={area} className="rounded-lg bg-terra-50 px-2 py-1 text-[9px] font-bold text-terra-700 uppercase tracking-wide">
                                                    {area.replace(/_/g, " ")}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {c.upcoming_events && c.upcoming_events.length > 0 && (
                                        <div className="mt-5 rounded-2xl bg-garden-lavender/30 p-4 text-center border border-garden-lavender/50">
                                            <p className="text-xs font-black text-garden-olive">
                                                📅 {c.upcoming_events.length} upcoming event{c.upcoming_events.length > 1 ? "s" : ""} this month!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
