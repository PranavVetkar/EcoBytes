import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from google.cloud import firestore

from app.dependencies import CurrentUser
from app.firebase import get_firestore_client
from app.models.registration import Registration, RegistrationStatus
from app.models.notification import Notification, NotificationType

router = APIRouter()

@router.patch("/{registration_id}")
async def update_registration_status(
    registration_id: str, 
    status_update: str, # "approved" or "rejected"
    user: CurrentUser
):
    """
    Approve or reject an RSVP request.
    Only the event host can do this.
    """
    db = get_firestore_client()
    
    # 1. Fetch registration
    reg_ref = db.collection("registrations").document(registration_id)
    reg_doc = await reg_ref.get()
    if not reg_doc.exists:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    reg_data = reg_doc.to_dict()
    event_id = reg_data["event_id"]
    
    # 2. Verify requester is the host
    event_ref = db.collection("events").document(event_id)
    event_doc = await event_ref.get()
    if not event_doc.exists:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event_data = event_doc.to_dict()
    if event_data["created_by"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Only the host can manage RSVPs")
    
    if status_update not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'approved' or 'rejected'.")
    
    new_status = RegistrationStatus.APPROVED if status_update == "approved" else RegistrationStatus.REJECTED
    
    # 3. Update registration
    batch = db.batch()
    batch.update(reg_ref, {"status": new_status})
    
    # 4. If approved, increment attendee count
    if new_status == RegistrationStatus.APPROVED:
        batch.update(event_ref, {"current_attendees": firestore.Increment(1)})
        
    # 5. Notify user
    notif_id = str(uuid.uuid4())
    message = f"Your RSVP for {event_data['event_title']} has been {status_update}!"
    notif_type = NotificationType.RSVP_APPROVED if new_status == RegistrationStatus.APPROVED else NotificationType.RSVP_REJECTED
    
    user_notification = Notification(
        id=notif_id,
        user_id=reg_data["user_id"],
        type=notif_type,
        message=message,
        data={"event_id": event_id, "registration_id": registration_id},
        timestamp=datetime.utcnow()
    )
    
    batch.set(db.collection("notifications").document(notif_id), user_notification.model_dump())
    
    await batch.commit()
    return {"status": status_update, "registration_id": registration_id}
