import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { logout as authLogout } from "../services/auth";
import type { AuthUser, UserProfile, Community } from "../types";

interface DashboardProps {
  user: AuthUser | null;
  profile: UserProfile | null;
  onRefresh: () => Promise<void>;
}

export default function Dashboard({ user, profile, onRefresh }: DashboardProps) {
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const statCards = [
    {
      label: "Points",
      value: profile?.total_points?.toLocaleString() ?? "0",
      icon: "🌟",
      color: "from-earth-400 to-earth-600",
    },
    {
      label: "Rank",
      value: profile?.rank ? `#${profile.rank}` : "—",
      icon: "🏅",
      color: "from-terra-500 to-terra-700",
    },
    {
      label: "Actions",
      value: profile?.post_count?.toLocaleString() ?? "0",
      icon: "🌱",
      color: "from-terra-600 to-terra-800",
    },
  ];

  const displayName = profile?.name ?? user?.name ?? "Eco Warrior";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold text-terra-950">Profile</h1>
        <button
          onClick={authLogout}
          className="text-sm font-bold text-red-500 hover:text-red-600"
        >
          Sign out
        </button>
      </header>

      <main className="p-4 pb-24">
        {/* Profile Card */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-terra-500 to-earth-400 p-1">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-3xl font-black text-terra-700">
                {initials}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
              <span className="text-sm">✅</span>
            </div>
          </div>
          <h2 className="mt-4 text-xl font-black text-terra-950">{displayName}</h2>
          <p className="text-sm font-medium text-gray-500">📍 {profile?.area || "Nature Lover"}</p>

          {profile?.interests && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {profile.interests.map((i) => (
                <span key={i} className="rounded-full bg-terra-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-terra-700 ring-1 ring-terra-100">
                  {i.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className={`flex flex-col items-center rounded-2xl bg-gradient-to-br ${card.color} p-4 text-white shadow-sm`}>
              <span className="text-lg mb-1">{card.icon}</span>
              <span className="text-lg font-black">{card.value}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">{card.label}</span>
            </div>
          ))}
        </div>

        {/* Section: Badges (Mock) */}
        <div className="mb-8">
          <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-400">Achievements</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {["🌲", "🔋", "♻️", "🚲", "💧"].map((emoji, idx) => (
              <div key={idx} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                <span className="text-2xl">{emoji}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Joined Communities */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Your Communities</h3>
            <Link to="/communities" className="text-[10px] font-bold text-terra-600 uppercase transition hover:text-terra-800">Explore All</Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-4"><div className="h-5 w-5 animate-spin rounded-full border-2 border-terra-500 border-t-transparent" /></div>
          ) : joinedCommunities.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 border border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">You haven't joined any communities yet.</p>
              <Link to="/communities" className="text-xs font-bold text-terra-600">Find a Community</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {joinedCommunities.map(c => (
                <div key={c.id} className="group relative flex flex-col overflow-hidden rounded-xl ring-1 ring-gray-100 hover:shadow-md transition">
                  <Link to={`/communities/${c.id}`} className="flex-1 flex flex-col">
                    <div
                      className="h-16 w-full bg-terra-100 bg-cover bg-center"
                      style={c.image_url ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url(${c.image_url})` } : {}}
                    />
                    <div className="p-3 bg-white flex-1">
                      <p className="text-xs font-bold text-terra-950 truncate group-hover:text-terra-600">{c.name}</p>
                      <p className="text-[10px] text-gray-500">{c.member_count} members</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleLeaveCommunity(c.id)}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-[10px] text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white ring-1 ring-red-100"
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Your Activity</h3>
            <span className="text-[10px] font-bold text-terra-600 uppercase">View All</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-4"><div className="h-5 w-5 animate-spin rounded-full border-2 border-terra-500 border-t-transparent" /></div>
          ) : recentActions.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 border border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">No eco actions logged yet.</p>
              <Link to="/log" className="text-xs font-bold text-terra-600">Log an Action</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {recentActions.slice(0, 9).map((action) => (
                <div key={action.id} className="aspect-square rounded-lg bg-gray-100 overflow-hidden relative group">
                  {action.video_url ? (
                    <div className="h-full w-full bg-black flex items-center justify-center text-white">
                      <span className="text-xs">▶️</span>
                    </div>
                  ) : action.image_url ? (
                    <img src={action.image_url} alt="Action" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-white uppercase text-center px-1">
                      {action.category?.replace(/_/g, " ")}
                    </span>
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={() => handleActionDelete(action.id)}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-500 backdrop-blur-md"
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
    </div>
  );
}
