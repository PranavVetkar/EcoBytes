from datetime import datetime
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from google.cloud import firestore

from app.dependencies import CurrentUser
from app.firebase import get_firestore_client
from app.models.eco_action import EcoAction, ActionCategory, VerificationStatus

router = APIRouter()

ACTIONS_COLLECTION = "eco_actions"

@router.get("/")
async def list_eco_actions(user: CurrentUser):
    """List eco actions for the current user."""
    db = get_firestore_client()
    # Fetch all user actions and sort in memory to avoid needing a composite index
    docs = db.collection(ACTIONS_COLLECTION).where("author_id", "==", user["uid"]).stream()
    
    actions = []
    async for doc in docs:
        actions.append(doc.to_dict())
        
    actions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return {"items": actions}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_eco_action(
    user: CurrentUser,
    category: ActionCategory = Form(...),
    quantity: float = Form(...),
    quantity_unit: str = Form(...),
    description: Optional[str] = Form(None),
    community_id: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    """
    Submit a new eco action with an image or video.
    Stores metadata in Firestore and uploads the file to Firebase Storage.
    """
    db = get_firestore_client()
    import cloudinary
    import cloudinary.uploader
    import os
    from app.config import settings
    
    # Configure Cloudinary
    if settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret:
        print(f"DEBUG: Configuring Cloudinary with cloud_name: {settings.cloudinary_cloud_name}")
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True
        )
    else:
        print("DEBUG: Cloudinary credentials are INCOMPLETE in settings!")
        # Fallback to URL if still present in env for some reason
        cloudinary_url = os.getenv("CLOUDINARY_URL")
        if cloudinary_url:
            print("DEBUG: Falling back to CLOUDINARY_URL environment variable")
            cloudinary.config(cloudinary_url=cloudinary_url)
    
    action_id = str(uuid.uuid4())
    
    # Upload file to Cloudinary
    print(f"DEBUG: Attempting Cloudinary upload for action_id: {action_id}")
    upload_result = cloudinary.uploader.upload(
        file.file,
        folder=f"eco_actions/{user['uid']}",
        public_id=action_id,
        resource_type="auto"
    )
    print("DEBUG: Cloudinary upload successful")
    file_url = upload_result.get("secure_url")
    
    is_video = file.content_type.startswith("video/") if file.content_type else False
    
    # Fetch author name
    user_doc = await db.collection("users").document(user["uid"]).get()
    author_name = user_doc.to_dict().get("name") if user_doc.exists else "EcoWarrior"
    
    new_action = EcoAction(
        id=action_id,
        author_id=user["uid"],
        author_name=author_name,
        category=category,
        quantity=quantity,
        quantity_unit=quantity_unit,
        description=description,
        community_id=community_id,
        image_url=file_url if not is_video else None,
        video_url=file_url if is_video else None,
        timestamp=datetime.utcnow(),
        verification_status=VerificationStatus.PENDING,
        points_earned=0.0, # Will be updated after verification
        city=city
    )
    
    await db.collection(ACTIONS_COLLECTION).document(action_id).set(new_action.model_dump())
    
    # Update user's post count
    user_ref = db.collection("users").document(user["uid"])
    await user_ref.update({
        "post_count": firestore.Increment(1)
    })
    
    return new_action


@router.get("/{action_id}")
async def get_eco_action(action_id: str, user: CurrentUser):
    """Return a single eco action by ID."""
    db = get_firestore_client()
    doc = await db.collection(ACTIONS_COLLECTION).document(action_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Action not found")
        
    return doc.to_dict()


@router.delete("/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_eco_action(action_id: str, user: CurrentUser):
    """
    Delete an eco action, its associated media from Cloudinary,
    and decrement the user's post count.
    """
    db = get_firestore_client()
    doc_ref = db.collection(ACTIONS_COLLECTION).document(action_id)
    doc = await doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Action not found")
        
    action_data = doc.to_dict()
    
    # Verify ownership
    if action_data.get("author_id") != user["uid"]:
        raise HTTPException(
            status_code=403, 
            detail="You do not have permission to delete this action"
        )
        
    # Configure Cloudinary for deletion
    import cloudinary
    import cloudinary.uploader
    import os
    from app.config import settings
    
    if settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret:
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True
        )
    else:
        cloudinary_url = os.getenv("CLOUDINARY_URL")
        if cloudinary_url:
            cloudinary.config(cloudinary_url=cloudinary_url)

    # Delete media from Cloudinary if public_id exists
    try:
        public_id = f"eco_actions/{user['uid']}/{action_id}"
        is_video = action_data.get("video_url") is not None
        resource_type = "video" if is_video else "image"
        
        print(f"DEBUG: Attempting to delete Cloudinary resource: {public_id} ({resource_type})")
        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        print("DEBUG: Cloudinary deletion request sent")
    except Exception as e:
        print(f"WARNING: Failed to delete media from Cloudinary: {e}")

    # Delete from Firestore
    await doc_ref.delete()
    
    # Decrement user's post count
    user_ref = db.collection("users").document(user["uid"])
    await user_ref.update({
        "post_count": firestore.Increment(-1)
    })
    
    return None


@router.patch("/{action_id}/status")
async def update_action_status(action_id: str, payload: dict, user: CurrentUser):
    """
    Update the verification status of an eco-action.
    ONLY Coordinators can approve/reject if they belong to the same community
    and same city.
    """
    POINT_MAPPING = {
        ActionCategory.TREE_PLANTING: 80.0,
        ActionCategory.WASTE_CLEANUP: 60.0,
        ActionCategory.COMPOSTING: 50.0,
        ActionCategory.CYCLING: 40.0,
        ActionCategory.PUBLIC_TRANSPORT: 35.0,
        ActionCategory.CARPOOLING: 35.0,
        ActionCategory.WATER_CONSERVATION: 30.0,
        ActionCategory.ENERGY_SAVING: 30.0,
        ActionCategory.RECYCLING: 25.0,
        ActionCategory.SUSTAINABLE_PURCHASE: 25.0,
        ActionCategory.OTHER: 10.0
    }

    new_status = payload.get("status")
    override_points = payload.get("points") # Optional override from coordinator
    
    if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'verified' or 'rejected'.")

    db = get_firestore_client()
    doc_ref = db.collection(ACTIONS_COLLECTION).document(action_id)
    doc = await doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Action not found")

    action_data = doc.to_dict()
    comm_id = action_data.get("community_id")

    if not comm_id:
        raise HTTPException(status_code=400, detail="Action is not associated with a community")

    # 1. Fetch community to check roles
    comm_doc = await db.collection("communities").document(comm_id).get()
    if not comm_doc.exists:
        raise HTTPException(status_code=404, detail="Community not found")

    comm_data = comm_doc.to_dict()
    is_coordinator = user["uid"] in comm_data.get("coordinator_ids", [])

    if not is_coordinator:
        raise HTTPException(status_code=403, detail="Only coordinators can review actions")

    # 2. Location Check for Coordinators
    # Fetch coordinator's profile to check area
    user_prof = await db.collection("users").document(user["uid"]).get()
    coord_area = user_prof.to_dict().get("area") if user_prof.exists else ""
    
    if coord_area != action_data.get("city"):
        raise HTTPException(
            status_code=403, 
            detail=f"As a {coord_area} coordinator, you can only review actions in {coord_area}."
        )

    # 3. Update status and AWARD POINTS if verified
    updates = {"verification_status": new_status}
    message = f"Action {new_status}"

    if new_status == VerificationStatus.VERIFIED and action_data.get("verification_status") != VerificationStatus.VERIFIED:
        if override_points is not None:
            points = float(override_points)
        else:
            # Get points from mapping based on category (per action)
            category = action_data.get("category")
            points = POINT_MAPPING.get(category, 10.0)
        
        updates["points_earned"] = points
        
        # Increment user's total points
        author_ref = db.collection("users").document(action_data["author_id"])
        await author_ref.update({"total_points": firestore.Increment(int(points))})
        message += f" and awarded {points} points"

    await doc_ref.update(updates)

    return {"status": "success", "message": message}

@router.post("/generate-caption")
async def generate_caption(
    user: CurrentUser,
    file: UploadFile = File(...)
):
    """
    Accepts an uploaded image, converts it to base64, and asks OpenAI
    to generate an eco-friendly caption for it.
    """
    from app.config import settings
    import httpx
    import base64
    
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=500, 
            detail="OpenAI API key is not configured across the environment."
        )
        
    # Read the file and encode
    content = await file.read()
    mime_type = file.content_type or "image/jpeg"
    
    # Simple check to make sure it's an image
    if not mime_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only images are supported for AI caption generation at this time."
        )
        
    encoded_image = base64.b64encode(content).decode('utf-8')
    data_uri = f"data:{mime_type};base64,{encoded_image}"
    
    # Request data for OpenAI GPT-4o-mini Vision
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Write a short, engaging, and enthusiastic caption (1-2 sentences) with a few emojis for this image of an eco-friendly action. Just return the caption text."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": data_uri
                        }
                    }
                ]
            }
        ],
        "max_tokens": 100
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.openai_api_key}"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=15.0
            )
            response.raise_for_status()
            data = response.json()
            
            caption = data["choices"][0]["message"]["content"].strip()
            # Strip outer quotes if the AI adds them
            if caption.startswith('"') and caption.endswith('"'):
                caption = caption[1:-1]
                
            return {"caption": caption}
    except Exception as e:
        print(f"Error generating caption: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to generate caption with AI. Please try writing one manually."
        )
