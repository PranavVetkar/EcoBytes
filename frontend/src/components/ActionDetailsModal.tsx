import { useEffect, useState } from "react";
import api from "../services/api";
import { getCurrentUser } from "../services/auth";
import type { EcoAction, Comment } from "../types";

interface ActionDetailsModalProps {
    action: EcoAction;
    onClose: () => void;
    onDelete?: (id: string) => void;
    onStatusUpdate?: (id: string, newStatus: string) => void;
}

export default function ActionDetailsModal({ action, onClose, onDelete, onStatusUpdate }: ActionDetailsModalProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [canReview, setCanReview] = useState(false);

    const user = getCurrentUser();
    const isAuthor = user?.uid === action.author_id;

    const fetchComments = async () => {
        try {
            setLoadingComments(true);
            const res = await api.get<Comment[]>(`/comments/${action.id}`);
            setComments(res.data);
        } catch (err) {
            console.error("Failed to fetch comments", err);
        } finally {
            setLoadingComments(false);
        }
    };

    const checkReviewPermissions = async () => {
        if (!action.community_id || !user) return;
        try {
            // Fetch community and user profile to check roles
            const [commRes, userRes] = await Promise.all([
                api.get(`/communities/${action.community_id}`),
                api.get(`/users/me`)
            ]);

            const comm = commRes.data;
            const prof = userRes.data;

            const isCommCoord = comm.coordinator_ids?.includes(user.uid);

            if (isCommCoord) {
                // Coordinator can review only if city matches their area
                if (prof.area === action.city) {
                    setCanReview(true);
                }
            }
        } catch (err) {
            console.error("Failed to check review permissions", err);
        }
    };

    useEffect(() => {
        fetchComments();
        checkReviewPermissions();
    }, [action.id]);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            setSubmittingComment(true);
            const res = await api.post<Comment>(`/comments/${action.id}`, {
                content: newComment,
                action_id: action.id
            });
            setComments(prev => [...prev, res.data]);
            setNewComment("");
        } catch (err) {
            console.error("Failed to post comment", err);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleUpdateStatus = async (status: "verified" | "rejected") => {
        try {
            setReviewing(true);
            const res = await api.patch(`/actions/${action.id}/status`, { status });
            alert(res.data.message);
            if (onStatusUpdate) onStatusUpdate(action.id, status);
            onClose();
        } catch (err: any) {
            console.error("Failed to update status", err);
            alert("Error: " + (err.response?.data?.detail || "Failed to update action status."));
        } finally {
            setReviewing(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await api.delete(`/actions/${action.id}`);
            if (onDelete) onDelete(action.id);
            onClose();
        } catch (err) {
            console.error("Failed to delete post", err);
            alert("Failed to delete post.");
        }
    };

    const formattedDate = new Date(action.timestamp).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    const mediaUrl = action.image_url || action.video_url || "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=800";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex w-full max-w-4xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh]">

                {/* Left: Image */}
                <div className="hidden md:block w-3/5 bg-gray-100 relative">
                    <img src={mediaUrl} alt="Action" className="h-full w-full object-cover" />
                    <div className="absolute top-6 left-6">
                        <span className="rounded-full bg-black/30 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white ring-1 ring-white/20">
                            {action.category.replace(/_/g, " ")}
                        </span>
                    </div>
                </div>

                {/* Right: Details & Comments */}
                <div className="flex w-full md:w-2/5 flex-col bg-white">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-50 p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terra-100 text-terra-700 font-black text-sm">
                                {(action as any).author_name?.charAt(0) || "E"}
                            </div>
                            <div>
                                <p className="text-sm font-black text-terra-950">
                                    {(action as any).author_name || "Eco Warrior"}
                                    {isAuthor && <span className="ml-1.5 text-[9px] font-black uppercase text-terra-500">(You)</span>}
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formattedDate}</p>
                                    {action.city && (
                                        <>
                                            <span className="text-gray-300">•</span>
                                            <p className="text-[10px] font-black text-terra-500 uppercase tracking-widest">📍 {action.city}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {isAuthor && (
                                <button onClick={handleDelete} className="rounded-full bg-red-50 p-2 text-red-500 hover:bg-red-100 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                </button>
                            )}
                            <button onClick={onClose} className="rounded-full bg-gray-50 p-2 text-gray-400 hover:bg-gray-100 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content Summary */}
                    <div className="bg-gray-50/50 p-6 border-b border-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-terra-500 mb-1">Impact</span>
                                <p className="text-2xl font-black text-terra-950">
                                    {action.quantity} <span className="text-sm font-bold text-gray-400 text-lowercase">{action.quantity_unit}</span>
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-2 shadow-sm ring-1 ring-gray-100 text-center">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Points</span>
                                <span className="text-lg font-black text-terra-600">+{action.points_earned}</span>
                            </div>
                        </div>

                        {/* Coordinator Controls */}
                        {canReview && action.verification_status === "pending" && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleUpdateStatus("verified")}
                                    disabled={reviewing}
                                    className="flex-1 rounded-xl bg-terra-600 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-terra-700 active:scale-95 disabled:opacity-50"
                                >
                                    {reviewing ? "Processing..." : "Approve"}
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus("rejected")}
                                    disabled={reviewing}
                                    className="flex-1 rounded-xl bg-red-50 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 ring-1 ring-red-100 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50"
                                >
                                    Reject
                                </button>
                            </div>
                        )}

                        {/* Status Badge (if not pending) */}
                        {action.verification_status !== "pending" && (
                            <div className="mt-2 flex items-center justify-center">
                                <span className={`rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest ${action.verification_status === "verified" ? "bg-terra-50 text-terra-600 ring-1 ring-terra-100" : "bg-red-50 text-red-600 ring-1 ring-red-100"
                                    }`}>
                                    {action.verification_status}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 pr-4 scrollbar-thin">
                        {loadingComments ? (
                            <div className="flex justify-center py-4">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-terra-500 border-t-transparent" />
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-xs text-gray-400 italic">No comments yet. Start the conversation!</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-black text-[10px]">
                                        {comment.author_name.charAt(0)}
                                    </div>
                                    <div className="flex-1 rounded-2xl bg-gray-50 px-4 py-2.5">
                                        <p className="text-[11px] font-black text-terra-950">{comment.author_name}</p>
                                        <p className="mt-0.5 text-xs text-gray-700 leading-normal">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Comment Input */}
                    <div className="border-t border-gray-50 p-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                                className="w-full rounded-full bg-gray-50 py-3 pl-5 pr-12 text-sm font-medium text-gray-700 ring-1 ring-gray-100 transition-all focus:bg-white focus:outline-none focus:ring-terra-300"
                            />
                            <button
                                onClick={handlePostComment}
                                disabled={submittingComment || !newComment.trim()}
                                className="absolute right-2 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-terra-600 text-white shadow-sm transition-all hover:bg-terra-700 active:scale-95 disabled:opacity-50 disabled:scale-100"
                            >
                                {submittingComment ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="m5 12 7-7 7 7M12 19V5" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
