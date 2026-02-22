from datetime import datetime
import uuid
from fastapi import APIRouter, HTTPException, status
from google.cloud import firestore

from app.dependencies import CurrentUser
from app.firebase import get_firestore_client
from app.models.community import Community, CommunityCreate

router = APIRouter()

COMMUNITIES_COLLECTION = "communities"

@router.get("/")
async def list_communities(user: CurrentUser):
    """List all communities, ordered by created_at desc."""
    db = get_firestore_client()
    docs = db.collection(COMMUNITIES_COLLECTION).order_by("created_at", direction=firestore.Query.DESCENDING).stream()
    
    communities = []
    async for doc in docs:
        communities.append(doc.to_dict())
    
    return {"items": communities}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_community(body: CommunityCreate, user: CurrentUser):
    """Create a new community. The creating user becomes admin."""
    db = get_firestore_client()
    
    community_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_community = Community(
        id=community_id,
        name=body.name,
        type=body.type,
        area_of_work=body.area_of_work,
        description=body.description,
        location=body.location,
        image_url=body.image_url,
        member_count=1,
        members=[user["uid"]],
        admin_id=user["uid"],
        created_at=now
    )
    
    await db.collection(COMMUNITIES_COLLECTION).document(community_id).set(new_community.model_dump())
    
    # Update user's joined communities
    user_ref = db.collection("users").document(user["uid"])
    await user_ref.update({
        "joined_community_ids": firestore.ArrayUnion([community_id])
    })
    
    return new_community


@router.post("/{community_id}/join")
async def join_community(community_id: str, user: CurrentUser):
    """Add the current user to a community's members array."""
    db = get_firestore_client()
    comm_ref = db.collection(COMMUNITIES_COLLECTION).document(community_id)
    comm_doc = await comm_ref.get()
    
    if not comm_doc.exists:
        raise HTTPException(status_code=404, detail="Community not found")
    
    batch = db.batch()
    batch.update(comm_ref, {
        "members": firestore.ArrayUnion([user["uid"]]),
        "member_count": firestore.Increment(1)
    })
    
    user_ref = db.collection("users").document(user["uid"])
    batch.update(user_ref, {
        "joined_community_ids": firestore.ArrayUnion([community_id])
    })
    
    await batch.commit()
    return {"status": "joined", "community_id": community_id}


@router.post("/{community_id}/leave")
async def leave_community(community_id: str, user: CurrentUser):
    """Remove the current user from a community."""
    db = get_firestore_client()
    comm_ref = db.collection(COMMUNITIES_COLLECTION).document(community_id)
    
    batch = db.batch()
    batch.update(comm_ref, {
        "members": firestore.ArrayRemove([user["uid"]]),
        "member_count": firestore.Increment(-1)
    })
    
    user_ref = db.collection("users").document(user["uid"])
    batch.update(user_ref, {
        "joined_community_ids": firestore.ArrayRemove([community_id])
    })
    
    await batch.commit()
    return {"status": "left", "community_id": community_id}


@router.get("/{community_id}")
async def get_community(community_id: str, user: CurrentUser):
    """Return a single community by ID."""
    db = get_firestore_client()
    doc = await db.collection(COMMUNITIES_COLLECTION).document(community_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Community not found")
        
    return doc.to_dict()


@router.post("/{community_id}/coordinators")
async def add_coordinator(community_id: str, payload: dict, user: CurrentUser):
    """Add a coordinator to the community by email (Admin only)."""
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    db = get_firestore_client()
    
    # 1. Verify community and admin status
    comm_ref = db.collection(COMMUNITIES_COLLECTION).document(community_id)
    comm_doc = await comm_ref.get()
    if not comm_doc.exists:
        raise HTTPException(status_code=404, detail="Community not found")
        
    comm_data = comm_doc.to_dict()
    if comm_data.get("admin_id") != user["uid"]:
        raise HTTPException(status_code=403, detail="Only the community host can add coordinators")
        
    # 2. Lookup user by email
    users_ref = db.collection("users").where("contact", "==", email).limit(1).get()
    query_results = await users_ref
    if not query_results:
        raise HTTPException(status_code=404, detail="User with this email not found")
        
    coord_user = query_results[0].to_dict()
    coord_uid = query_results[0].id
    
    # 3. Add to coordinators
    if coord_uid in comm_data.get("coordinator_ids", []):
        raise HTTPException(status_code=400, detail="User is already a coordinator")
        
    await comm_ref.update({
        "coordinator_ids": firestore.ArrayUnion([coord_uid])
    })
    
    return {"status": "success", "message": f"Added {coord_user.get('name')} as coordinator"}


@router.get("/{community_id}/coordinators")
async def list_coordinators(community_id: str, user: CurrentUser):
    """List profiles of all coordinators in the community."""
    db = get_firestore_client()
    
    comm_doc = await db.collection(COMMUNITIES_COLLECTION).document(community_id).get()
    if not comm_doc.exists:
        raise HTTPException(status_code=404, detail="Community not found")
        
    coord_ids = comm_doc.to_dict().get("coordinator_ids", [])
    if not coord_ids:
        return []
        
    # Fetch profiles for these UIDs
    profiles = []
    for uid in coord_ids:
        user_doc = await db.collection("users").document(uid).get()
        if user_doc.exists:
            u_data = user_doc.to_dict()
            profiles.append({
                "uid": uid,
                "name": u_data.get("name"),
                "area": u_data.get("area"),
                "bio": u_data.get("bio")
            })
            
    return profiles


@router.get("/{community_id}/leaderboard")
async def get_community_leaderboard(community_id: str, user: CurrentUser):
    """
    Return the leaderboard for a specific community, ranking members
    based on the points they've earned from verified actions within this community.
    """
    db = get_firestore_client()
    
    # Verify the community exists
    comm_ref = db.collection(COMMUNITIES_COLLECTION).document(community_id)
    comm_doc = await comm_ref.get()
    
    if not comm_doc.exists:
        raise HTTPException(status_code=404, detail="Community not found")
        
    # Query all verified actions for this community
    actions_ref = db.collection("eco_actions")\
        .where("community_id", "==", community_id)\
        .where("verification_status", "==", "verified")
        
    docs = actions_ref.stream()
    
    # Aggregate points per user
    user_points = {}
    user_names = {}
    
    async for doc in docs:
        action_data = doc.to_dict()
        author_id = action_data.get("author_id")
        points = float(action_data.get("points_earned", 0.0))
        author_name = action_data.get("author_name", "Unknown User")
        
        if author_id:
            user_points[author_id] = user_points.get(author_id, 0.0) + points
            # Store name on first encounter
            if author_id not in user_names:
                user_names[author_id] = author_name
                
    # Format into a sorted list
    leaderboard = []
    for uid, points in user_points.items():
        leaderboard.append({
            "uid": uid,
            "name": user_names.get(uid, "Eco Warrior"),
            "points": points
        })
        
    # Sort descending by points
    leaderboard.sort(key=lambda x: x["points"], reverse=True)
    
    return leaderboard

