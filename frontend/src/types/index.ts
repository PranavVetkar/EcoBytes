// ── Auth user (returned by JWT login/register) ─────────────────
export interface AuthUser {
  uid: string;
  email: string;
  name: string;
}

// ── Primitive / shared types ──────────────────────────────────

export type VerificationStatus = "pending" | "verified" | "rejected" | "manual_review";

export type RegistrationStatus = "pending" | "approved" | "rejected" | "attended";

export type UserChallengeStatus = "in_progress" | "completed" | "failed";

export type ActionCategory =
  | "recycling"
  | "composting"
  | "tree_planting"
  | "energy_saving"
  | "water_conservation"
  | "carpooling"
  | "public_transport"
  | "cycling"
  | "waste_cleanup"
  | "sustainable_purchase"
  | "other";

// ── Firestore document interfaces ─────────────────────────────

export interface LocationData {
  lat: number;
  lng: number;
  geohash: string;
}

export interface AiVerdict {
  category_detected?: string;
  confidence: number;
  reasoning: string;
  approved: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  contact: string;
  area: string;
  bio?: string;
  interests: string[];
  post_count: number;
  follower_count: number;
  following_count: number;
  total_points: number;
  joined_community_ids: string[];
  rank: number;
  trust_score: number;
  created_at: Date;
  /** False until the user completes the onboarding form. Used for routing. */
  onboarding_complete: boolean;
}

export interface EcoAction {
  id: string;
  author_id: string;
  image_url?: string;
  video_url?: string;
  category: ActionCategory;
  timestamp: Date;
  verification_status: VerificationStatus;
  location?: LocationData;
  points_earned: number;
  quantity: number;
  quantity_unit: string;
  community_id?: string;
  event_id?: string;
  ai_confidence: number;
  ai_verdict?: AiVerdict;
  likes_count: number;
  comments_count: number;
  description?: string;
  city?: string;
}

export interface UpcomingCommunityEvent {
  event_id?: string;
  event_name: string;
  date: Date;
  location: string;
}

export interface Community {
  id: string;
  name: string;
  type: string;
  description?: string;
  location?: string;
  area_of_work: string[];
  member_count: number;
  members: string[];
  rating: number;
  admin_id: string;
  coordinator_ids?: string[];
  upcoming_events: UpcomingCommunityEvent[];
  image_url?: string;
  created_at: Date;
}

export interface CoordinatorProfile {
  uid: string;
  name: string;
  area: string;
  bio?: string;
}

export interface Event {
  event_id: string;
  event_title: string;
  event_description: string;
  community_id?: string;
  is_city_event: boolean;
  city?: string;
  location_name: string;
  lat: number;
  lng: number;
  geohash: string;
  event_type: string;
  start_time: Date;
  end_time: Date;
  max_attendees: number;
  current_attendees: number;
  requires_approval: boolean;
  created_by: string;
  created_at: Date;
}

export interface Message {
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  sent_at: Date;
}

export interface Comment {
  id: string;
  action_id: string;
  author_id: string;
  author_name: string;
  content: string;
  timestamp: Date;
}

export interface Reward {
  id: string;
  item_name: string;
  points_required: number;
  stock_count: number;
  description: string;
  image_url?: string;
  redeem_code: string;
  redeemed_at?: Date;
  is_active: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "rsvp_request" | "rsvp_approved" | "rsvp_rejected" | "new_comment" | "general";
  message: string;
  data?: any;
  is_read: boolean;
  timestamp: Date;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  status: RegistrationStatus;
  checked_in_at?: Date;
  registered_at: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ActionCategory;
  target_quantity: number;
  target_unit: string;
  duration_days: number;
  bonus_points: number;
  badge_id?: string;
  is_active: boolean;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  started_at: Date;
  completed_at?: Date;
  status: UserChallengeStatus;
}

export interface PointLedgerEntry {
  txn_id: string;
  action_id?: string;
  /** Positive = earned, negative = redeemed */
  points: number;
  reason: string;
  created_at: Date;
}

export interface ActionCategoryConfig {
  category: ActionCategory;
  base_points_per_unit: number;
  unit: string;
  description: string;
}

// ── API request/response shapes ───────────────────────────────

export interface CreateEcoActionPayload {
  category: ActionCategory;
  quantity: number;
  quantity_unit: string;
  location?: LocationData;
  community_id?: string;
  event_id?: string;
  image_url?: string;
  video_url?: string;
  description?: string;
  city?: string;
}

export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  next_cursor?: string;
  has_more: boolean;
}
