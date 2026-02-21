from fastapi import APIRouter, HTTPException, status
from google.cloud import firestore

from app.dependencies import CurrentUser
from app.firebase import get_firestore_client
from app.models.notification import Notification

router = APIRouter()

NOTIFICATIONS_COLLECTION = "notifications"

@router.get("/", response_model=list[Notification])
async def list_notifications(user: CurrentUser):
    """List all notifications for the current user, newest first."""
    db = get_firestore_client()
    
    docs = db.collection(NOTIFICATIONS_COLLECTION) \
        .where("user_id", "==", user["uid"]) \
        .limit(50) \
        .stream()
    
    notifications = []
    async for doc in docs:
        notifications.append(doc.to_dict())
    
    # Sort in memory to avoid needing a composite index
    notifications.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
    return notifications

@router.patch("/{notif_id}/read")
async def mark_notification_as_read(notif_id: str, user: CurrentUser):
    """Mark a notification as read."""
    db = get_firestore_client()
    
    ref = db.collection(NOTIFICATIONS_COLLECTION).document(notif_id)
    doc = await ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    data = doc.to_dict()
    if data["user_id"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    await ref.update({"is_read": True})
    return {"status": "read", "id": notif_id}
