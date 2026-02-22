import type { UserProfile } from "../types";

interface Reward {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
}

const REWARDS_LIST: Reward[] = [
    {
        id: "r1",
        name: "Bamboo Toothbrush Set",
        price: 500,
        description: "4-pack of eco-friendly, biodegradable bamboo toothbrushes.",
        image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: "r2",
        name: "Organic Composting Bin",
        price: 1200,
        description: "Compact indoor composter for your kitchen scraps.",
        image: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: "r3",
        name: "Native Tree Sapling",
        price: 300,
        description: "We'll plant a native tree in your name or ship one to you.",
        image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: "r4",
        name: "Reusable Produce Bags",
        price: 250,
        description: "Set of 5 cotton mesh bags for plastic-free grocery shopping.",
        image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80",
    },
];

export default function Rewards({ profile }: { profile: UserProfile | null }) {
    const points = profile?.total_points ?? 0;

    return (
        <div className="w-full">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-garden-olive tracking-tight font-creative italic">Rewards</h1>
                    <p className="text-sm text-garden-olive/60 font-medium mt-2">Redeem your impact for nature's gifts.</p>
                </div>
                <div className="flex items-center gap-3 rounded-[2rem] bg-gradient-to-br from-garden-olive to-garden-purple px-6 py-3 text-white shadow-xl shadow-garden-olive/20 active:scale-95 transition-transform cursor-pointer">
                    <span className="text-xl">🌟</span>
                    <span className="font-black text-lg tracking-tighter">{points.toLocaleString()}</span>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-6">
                {REWARDS_LIST.map((reward) => (
                    <div
                        key={reward.id}
                        className="group flex flex-col overflow-hidden rounded-[2.5rem] bg-white border border-garden-lavender shadow-xl shadow-garden-olive/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-garden-olive/10"
                    >
                        <div className="relative aspect-square overflow-hidden">
                            <img
                                src={reward.image}
                                alt={reward.name}
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute top-4 right-4 rounded-2xl bg-white/90 px-3 py-1.5 text-[10px] font-black text-garden-olive backdrop-blur-md shadow-lg border border-white">
                                {reward.price} pts
                            </div>
                        </div>
                        <div className="flex flex-1 flex-col p-6">
                            <h3 className="text-lg font-black text-garden-olive line-clamp-1 font-creative italic">{reward.name}</h3>
                            <p className="mt-2 text-[11px] leading-relaxed text-garden-olive/60 font-medium line-clamp-2 italic">
                                {reward.description}
                            </p>
                            <button
                                disabled={points < reward.price}
                                className={`mt-6 w-full rounded-2xl py-3 text-[10px] font-black tracking-widest uppercase shadow-md transition-all active:scale-95 ${points >= reward.price
                                    ? "bg-garden-olive text-garden-cream hover:bg-garden-olive/90 shadow-garden-olive/20"
                                    : "bg-garden-cream text-garden-olive/30 cursor-not-allowed border border-garden-lavender"
                                    }`}
                            >
                                {points >= reward.price ? "Redeem" : "Locked"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12">
                <div className="rounded-[3rem] bg-gradient-to-br from-garden-olive to-garden-purple p-8 text-white shadow-2xl shadow-garden-olive/20 relative overflow-hidden group">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black font-creative italic tracking-tight">Earn more?</h2>
                        <p className="mt-3 text-sm text-garden-cream opacity-90 font-medium leading-relaxed italic">
                            Complete eco-actions, lead challenges, and invite friends to grow your impact and unlock more rewards.
                        </p>
                        <button className="mt-8 w-full rounded-2xl bg-white/20 backdrop-blur-md py-4 text-xs font-black uppercase tracking-[0.2em] text-white border border-white/20 transition-all hover:bg-white hover:text-garden-olive shadow-xl shadow-black/5 active:scale-95">
                            View Challenges
                        </button>
                    </div>
                    {/* Decorative Circle */}
                    <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-700" />
                </div>
            </div>
        </div>
    );
}
