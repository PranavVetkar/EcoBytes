import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from google.cloud import firestore

from app.dependencies import CurrentUser
from app.firebase import get_firestore_client
from app.models.comment import Comment, CommentCreate

router = APIRouter()

COMMENTS_COLLECTION = "comments"
ACTIONS_COLLECTION = "eco_actions"

@router.post("/{action_id}", response_model=Comment, status_code=status.HTTP_201_CREATED)
async def create_comment(action_id: str, payload: CommentCreate, user: CurrentUser):
    """Create a new comment on an eco action."""
    db = get_firestore_client()
    
    # Verify action exists
    action_doc = await db.collection(ACTIONS_COLLECTION).document(action_id).get()
    if not action_doc.exists:
        raise HTTPException(status_code=404, detail="Eco action not found")
    
    # Fetch author name
    user_doc = await db.collection("users").document(user["uid"]).get()
    author_name = user_doc.to_dict().get("name") if user_doc.exists else "EcoWarrior"
    
    comment_id = str(uuid.uuid4())
    new_comment = Comment(
        id=comment_id,
        action_id=action_id,
        author_id=user["uid"],
        author_name=author_name,
        content=payload.content,
        timestamp=datetime.utcnow()
    )
    
    await db.collection(COMMENTS_COLLECTION).document(comment_id).set(new_comment.model_dump())
    
    # Increment comment count in action
    await db.collection(ACTIONS_COLLECTION).document(action_id).update({
        "comments_count": firestore.Increment(1)
    })
    
    return new_comment

@router.get("/{action_id}", response_model=list[Comment])
async def list_comments(action_id: str, user: CurrentUser):
    """List all comments for a specific eco action."""
    db = get_firestore_client()
    
    docs = db.collection(COMMENTS_COLLECTION).where("action_id", "==", action_id).stream()
    
    comments = []
    async for doc in docs:
        comments.append(doc.to_dict())
        
    # Sort by timestamp ascending
    comments.sort(key=lambda x: x.get("timestamp", ""))
    return comments
