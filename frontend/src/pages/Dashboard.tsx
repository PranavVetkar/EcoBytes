import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { logout as authLogout } from "../services/auth";
import ActionDetailsModal from "../components/ActionDetailsModal";
import type { AuthUser, UserProfile, Community, EcoAction } from "../types";

interface DashboardProps {
  user: AuthUser | null;
  profile: UserProfile | null;
  onRefresh: () => Promise<void>;
}

export default function Dashboard({ user, profile, onRefresh }: DashboardProps) {
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<EcoAction | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.uid) return;

      try {
        setLoading(true);
        // Fetch communities to filter out the ones this user joined
        const commRes = await api.get<{ items: Community[] }>("/communities/");
        const userComms = commRes.data.items.filter(c => profile.joined_community_ids.includes(c.id));
        setJoinedCommunities(userComms);

        // Fetch user's recent actions directly
        const actionsRes = await api.get<{ items: any[] }>("/actions/");
        setRecentActions(actionsRes.data.items);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

  const handleLeaveCommunity = async (commId: string) => {
    if (!window.confirm("Are you sure you want to leave this community?")) return;
    try {
      await api.post(`/communities/${commId}/leave`);
      // Update local state for immediate feedback
      setJoinedCommunities(prev => prev.filter(c => c.id !== commId));
      // Refresh global profile to update joined_community_ids
      onRefresh();
    } catch (err: any) {
      alert("Failed to leave community: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleActionDelete = async (actionId: string) => {
    if (!window.confirm("Are you sure you want to delete this eco-action?")) return;
    try {
      await api.delete(`/actions/${actionId}`);
      // Update local state
      setRecentActions(prev => prev.filter(a => a.id !== actionId));
      onRefresh(); // Refresh profile stats (post_count)
    } catch (err: any) {
      alert("Failed to delete action: " + (err.response?.data?.detail || err.message));
    }
  };

  const activeDaysCount = new Set(
    recentActions.map((a) => {
      const d = new Date(a.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  ).size;

  const statCards = [
    {
      label: "Points",
      value: profile?.total_points?.toLocaleString() ?? "0",
      icon: "🌟",
      color: "from-garden-olive to-garden-purple",
    },
    {
      label: "Rank",
      value: profile?.rank ? `#${profile.rank}` : "—",
      icon: "🏅",
      color: "from-garden-purple to-garden-lavender",
    },
    {
      label: "Active Days",
      value: activeDaysCount.toString(),
      icon: "📅",
      color: "from-garden-olive/80 to-garden-purple/80",
    },
    {
      label: "Actions",
      value: profile?.post_count?.toLocaleString() ?? "0",
      icon: "🌱",
      color: "from-garden-olive to-garden-olive/80",
    },
  ];

  const displayName = profile?.name ?? user?.name ?? "Eco Warrior";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="w-full">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-garden-olive tracking-tight font-creative italic">My Profile</h1>
          <p className="text-sm text-garden-olive/60 font-medium mt-2">Your eco-journey at a glance.</p>
        </div>
        <button
          onClick={authLogout}
          className="rounded-2xl px-6 py-2.5 text-xs font-black text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all shadow-md active:scale-95 border border-red-100"
        >
          Sign out
        </button>
      </header>

      <main className="pb-24">
        {/* Profile Card */}
        <div className="mb-12 flex flex-col items-center">
          <div className="relative group">
            <div className="flex h-32 w-32 items-center justify-center rounded-[3rem] bg-gradient-to-tr from-garden-olive to-garden-purple p-1 shadow-2xl shadow-garden-olive/20 group-hover:rotate-6 transition-transform duration-500">
              <div className="flex h-full w-full items-center justify-center rounded-[2.8rem] bg-white text-4xl font-black text-garden-olive border-4 border-garden-cream">
                {initials}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-xl ring-1 ring-garden-lavender rotate-12">
              <span className="text-lg">🌵</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-black text-garden-olive tracking-tighter font-creative italic">{displayName}</h2>
          <p className="mt-1 text-sm font-black text-garden-purple uppercase tracking-[0.2em]">📍 {profile?.area || "Nature Lover"}</p>

          {profile?.interests && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {profile.interests.map((i) => (
                <span key={i} className="rounded-xl bg-garden-lavender/40 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-garden-olive border border-garden-lavender shadow-sm">
                  {i.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-12 grid grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className={`flex flex-col items-center rounded-3xl bg-gradient-to-br ${card.color} p-5 text-white shadow-xl shadow-garden-olive/10 group hover:-translate-y-1 transition-transform duration-300`}>
              <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">{card.icon}</span>
              <span className="text-xl font-black">{card.value}</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">{card.label}</span>
            </div>
          ))}
        </div>

        {/* Section: Daily Streaks */}
        <div className="mb-12">
          <h3 className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-garden-olive/40 ml-1">Daily Streaks</h3>
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide justify-between">
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const currentDay = today.getDay();
              const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() + diffToMonday);

              const activeDays = new Set<number>();
              recentActions.forEach(action => {
                if (!action.timestamp) return;
                const timestampStr = String(action.timestamp);
                const tzDate = new Date(timestampStr.endsWith('Z') ? timestampStr : timestampStr + 'Z');

                if (tzDate >= startOfWeek) {
                  let dayIdx = tzDate.getDay() - 1;
                  if (dayIdx === -1) dayIdx = 6;
                  activeDays.add(dayIdx);
                }
              });

              return [0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                const dayName = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dayIdx];
                const isActive = activeDays.has(dayIdx);
                const isToday = dayIdx === (currentDay === 0 ? 6 : currentDay - 1);

                return (
                  <div
                    key={dayIdx}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[3.2rem] transition-all duration-500 shadow-xl border ${isActive
                      ? "bg-gradient-to-br from-garden-olive to-garden-purple text-white border-transparent shadow-garden-olive/20 scale-110 font-black z-10"
                      : isToday
                        ? "bg-garden-cream/80 text-garden-olive ring-2 ring-garden-lavender border-transparent"
                        : "bg-white text-garden-olive/30 border-garden-lavender shadow-garden-olive/5"
                      }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider mb-2">{dayName}</span>
                    <div className={`h-7 w-7 rounded-2xl flex items-center justify-center ${isActive ? "bg-white/20" : "bg-garden-cream/30"}`}>
                      {isActive ? (
                        <span className="text-sm">🌿</span>
                      ) : (
                        <span className="text-sm opacity-30">🌱</span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Section: Badges (Mock) */}
        <div className="mb-12">
          <h3 className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-garden-olive/40 ml-1">Achievements</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {["🌲", "🔋", "♻️", "🚲", "💧"].map((emoji, idx) => (
              <div key={idx} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white shadow-xl shadow-garden-olive/5 border border-garden-lavender hover:-rotate-6 transition-transform">
                <span className="text-3xl">{emoji}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Joined Communities */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-garden-olive/40">Your Communities</h3>
            <Link to="/communities" className="text-[10px] font-black text-garden-purple uppercase tracking-widest hover:underline decoration-2">Explore All</Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-4"><div className="h-6 w-6 animate-spin rounded-full border-4 border-garden-olive border-t-transparent" /></div>
          ) : joinedCommunities.length === 0 ? (
            <div className="rounded-[2.5rem] bg-garden-cream/50 border border-dashed border-garden-lavender p-8 text-center">
              <p className="text-sm text-garden-olive/60 mb-3 font-medium">You haven't joined any communities yet.</p>
              <Link to="/communities" className="text-xs font-black text-garden-olive uppercase tracking-widest">Find a Community</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {joinedCommunities.map(c => (
                <div key={c.id} className="group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white border border-garden-lavender hover:shadow-2xl transition-all duration-500">
                  <Link to={`/communities/${c.id}`} className="flex-1 flex flex-col">
                    <div
                      className="h-20 w-full bg-garden-lavender/30 bg-cover bg-center"
                      style={c.image_url ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.2)), url(${c.image_url})` } : {}}
                    />
                    <div className="p-4 bg-white flex-1">
                      <p className="text-sm font-black text-garden-olive truncate group-hover:text-garden-purple transition-colors font-creative italic">{c.name}</p>
                      <p className="text-[10px] font-black text-garden-olive/40 uppercase tracking-widest">{c.member_count.toLocaleString()} members</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleLeaveCommunity(c.id)}
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-2xl bg-white/80 text-[10px] text-red-500 shadow-md backdrop-blur-sm transition-all hover:bg-red-500 hover:text-white"
                    title="Leave Community"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-garden-olive/40">Your Activity</h3>
            <span className="text-[10px] font-black text-garden-purple uppercase tracking-widest">View All</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-4"><div className="h-6 w-6 animate-spin rounded-full border-4 border-garden-olive border-t-transparent" /></div>
          ) : recentActions.length === 0 ? (
            <div className="rounded-[2.5rem] bg-garden-cream/50 border border-dashed border-garden-lavender p-8 text-center">
              <p className="text-sm text-garden-olive/60 mb-3 font-medium">No eco actions logged yet.</p>
              <Link to="/log" className="text-xs font-black text-garden-olive uppercase tracking-widest">Log an Action</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {recentActions.slice(0, 9).map((action) => (
                <div
                  key={action.id}
                  className="aspect-square rounded-3xl bg-garden-cream/50 overflow-hidden relative group cursor-pointer border border-garden-lavender transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  onClick={() => setSelectedAction(action)}
                >
                  {action.video_url ? (
                    <div className="h-full w-full bg-garden-olive/20 flex items-center justify-center">
                      <span className="text-lg">▶️</span>
                    </div>
                  ) : action.image_url ? (
                    <img src={action.image_url} alt="Action" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-garden-olive/20">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-garden-olive/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="text-[9px] font-black text-white uppercase text-center px-2 tracking-widest leading-tight">
                      {action.category?.replace(/_/g, " ")}
                    </span>
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionDelete(action.id);
                    }}
                    className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-500 backdrop-blur-md"
                    title="Delete Action"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Action Details Modal */}
      {selectedAction && (
        <ActionDetailsModal
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          onDelete={(id) => {
            setRecentActions(prev => prev.filter(a => a.id !== id));
            onRefresh();
            setSelectedAction(null);
          }}
        />
      )}
    </div>
  );
}
