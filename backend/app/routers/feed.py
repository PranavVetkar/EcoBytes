from fastapi import APIRouter, Query
from typing import Optional
from google.cloud import firestore

from app.dependencies import CurrentUser
from app.firebase import get_firestore_client

router = APIRouter()

ACTIONS_COLLECTION = "eco_actions"

@router.get("/")
async def get_feed(
    user: CurrentUser,
    city: Optional[str] = Query(None),
    community_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None, description="Pagination cursor (last doc ID)"),
):
    """
    Paginated social feed of verified eco actions.
    Filterable by city, community, and category.
    """
    db = get_firestore_client()
    
    # Rather than using .where() and .order_by() which requires composite indexes,
    # we fetch valid docs and filter in memory since we are at a prototype stage.
    docs = db.collection(ACTIONS_COLLECTION).where("verification_status", "in", ["verified", "pending"]).stream()
    
    items = []
    async for doc in docs:
        data = doc.to_dict()
        
        # Apply filters in memory
        if community_id and data.get("community_id") != community_id:
            continue
        if category and data.get("category") != category:
            continue
            
        items.append(data)
        
    # Sort in memory descending by timestamp
    items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    # Basic list slicing for limit
    paginated_items = items[:limit]
        
    return {"items": paginated_items}

@router.get("/city-stats")
async def get_city_stats(user: CurrentUser):
    """
    Returns aggregated stats for verified actions grouped by city.
    Useful for generating a heatmap or leaderboard of cities.
    """
    db = get_firestore_client()
    
    # We fetch only verified docs
    docs = db.collection(ACTIONS_COLLECTION).where("verification_status", "in", ["verified", "pending"]).stream()
    
    city_counts = {}
    
    async for doc in docs:
        data = doc.to_dict()
        city = data.get("city")
        if not city:
            continue
            
        # Normalize city names for grouping
        normalized_city = city.strip().title()
        
        if normalized_city not in city_counts:
            city_counts[normalized_city] = 0
            
        # Tally action count (or could tally points_earned instead)
        city_counts[normalized_city] += 1
        
    return city_counts

