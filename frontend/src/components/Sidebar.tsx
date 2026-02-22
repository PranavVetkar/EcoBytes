import { useAuthProfile } from "../hooks/useAuthProfile";

export default function Sidebar() {
    const { profile, loading } = useAuthProfile();

    return (
        <aside className="w-80 border-r border-garden-lavender bg-white/40 backdrop-blur-sm h-screen overflow-y-auto hidden lg:block">
            <div className="p-6 space-y-8">
                {/* Search */}
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search EcoBytes..."
                        className="w-full pl-10 pr-4 py-3 bg-garden-cream/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-garden-olive transition-all outline-none placeholder:text-garden-olive/40"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-garden-olive/40 group-focus-within:text-garden-olive transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                </div>

                {/* User Stats Card */}
                <div className="bg-garden-cream/80 backdrop-blur-md rounded-[2.5rem] p-6 shadow-xl shadow-garden-olive/5 border border-white/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-garden-purple rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity" />

                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-garden-olive/40 mb-6 relative">My Impact</h3>

                    <div className="space-y-4 relative">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-garden-olive/60">Total Points</span>
                            <span className="text-sm font-black text-garden-olive">{loading ? "..." : profile?.total_points?.toLocaleString() || "0"}</span>
                        </div>
                        <div className="h-1.5 w-full bg-garden-olive/10 rounded-full overflow-hidden">
                            <div className="h-full bg-garden-olive rounded-full w-2/3 shadow-[0_0_8px_rgba(128,128,52,0.3)]" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-garden-olive/40 uppercase">Rank</p>
                                <p className="text-sm font-black text-garden-olive">{loading ? "..." : profile?.rank ? `#${profile.rank}` : "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-garden-olive/40 uppercase">Actions</p>
                                <p className="text-sm font-black text-garden-olive">{loading ? "..." : profile?.post_count || "0"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Suggested Communities (Placeholder) */}
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-garden-olive/40 mb-4 ml-1">Suggested for you</h3>
                    <div className="space-y-3">
                        {[
                            { name: "Urban Forestry", members: "1.2k", icon: "🌳" },
                            { name: "Solar Enthusiasts", members: "850", icon: "☀️" },
                            { name: "Zero Waste City", members: "3.4k", icon: "♻️" }
                        ].map((comm, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-md border border-transparent hover:border-garden-lavender">
                                <div className="h-10 w-10 rounded-xl bg-garden-cream/60 flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform">
                                    {comm.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-garden-olive">{comm.name}</p>
                                    <p className="text-[10px] text-garden-olive/40 font-medium">{comm.members} members</p>
                                </div>
                                <button className="h-7 w-7 rounded-full bg-garden-lavender/40 text-garden-olive flex items-center justify-center text-xs font-black hover:bg-garden-olive hover:text-white transition-colors">
                                    +
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer info */}
                <div className="pt-8 px-1">
                    <p className="text-[9px] font-bold text-garden-olive/30 uppercase tracking-widest leading-loose">
                        EB © 2026 • About • Help • Privacy • Terms
                    </p>
                </div>
            </div>
        </aside>
    );
}
