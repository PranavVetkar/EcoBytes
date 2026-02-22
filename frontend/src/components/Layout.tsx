import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import Sidebar from "./Sidebar";
import { Flower, RiverWave } from "./GardenElements";

export default function Layout() {
    return (
        <div className="flex h-screen bg-garden-cream overflow-hidden text-garden-olive font-sans">
            {/* Decoration: Top Left Flower */}
            <div className="absolute top-4 left-4 z-[60] text-garden-purple/20 pointer-events-none">
                <Flower className="h-12 w-12 rotate-12" />
            </div>

            {/* Left Nav (Fixed) */}
            <div className="w-20 bg-garden-cream border-r border-garden-lavender shadow-lg z-50">
                <Navigation />
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Middle Small Column */}
                <div className="w-80 bg-garden-lavender border-r border-garden-olive/10 hidden lg:block relative">
                    {/* Decoration: Bottom Flower in Sidebar */}
                    <div className="absolute bottom-10 left-10 text-garden-purple/10 pointer-events-none">
                        <Flower className="h-32 w-32 -rotate-12" />
                    </div>
                    <Sidebar />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 h-screen overflow-y-auto scroll-smooth bg-garden-cream relative">
                    {/* Decoration: River Wave at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 text-garden-lavender/40 pointer-events-none translate-y-1/2">
                        <RiverWave className="h-40 w-full" />
                    </div>

                    <div className="max-w-xl mx-auto p-4 lg:p-10 relative z-10 bg-white/20 backdrop-blur-sm rounded-[3rem] shadow-2xl shadow-garden-olive/5 my-10 border border-white/40">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
