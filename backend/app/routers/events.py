import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from google.cloud import firestore

from app.dependencies import CurrentUser
from app.firebase import get_firestore_client
from app.models.event import Event, EventCreate

router = APIRouter()


@router.get("/")
async def list_events(
    user: CurrentUser,
    city: Optional[str] = Query(None),
    community_id: Optional[str] = Query(None),
):
    """List upcoming events, optionally filtered by city or community."""
    # TODO: query events where start_time >= now, order by start_time asc
    return {"message": "not yet implemented"}


@router.post("/", response_model=Event, status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, user: CurrentUser):
    """
    Create a new event. 
    Only the community admin can create events for their community.
    """
    db = get_firestore_client()
    
    if not payload.community_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="community_id is required for community events"
        )
    
    # 1. Fetch community and verify admin status
    comm_ref = db.collection("communities").document(payload.community_id)
    comm_doc = await comm_ref.get()
    
    if not comm_doc.exists:
        raise HTTPException(status_code=404, detail="Community not found")
    
    comm_data = comm_doc.to_dict()
    if comm_data.get("admin_id") != user["uid"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only the community admin can create events"
        )
    
    # 2. Setup event ID and metadata
    event_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_event = Event(
        **payload.model_dump(),
        event_id=event_id,
        current_attendees=0,
        created_by=user["uid"],
        created_at=now
    )
    
    # 3. Save to events collection
    await db.collection("events").document(event_id).set(new_event.model_dump())
    
    # 4. (Optional but helpful) Update community's upcoming_events field 
    # for quick display in CommunityDetails
    await comm_ref.update({
        "upcoming_events": firestore.ArrayUnion([{
            "event_id": event_id,
            "event_name": payload.event_title,
            "date": payload.start_time.isoformat(),
            "location": payload.location_name
        }])
    })
    
    return new_event


@router.get("/nearby")
async def get_nearby_events(
    user: CurrentUser,
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(10.0, gt=0, le=100),
):
    """Return events within radius_km of the given coordinates using geohash range queries."""
    # TODO: compute geohash bounding box, query events by geohash prefix range
    return {"message": "not yet implemented", "lat": lat, "lng": lng, "radius_km": radius_km}


@router.get("/{event_id}")
async def get_event(event_id: str, user: CurrentUser):
    """Return a single event by ID."""
    # TODO: fetch events/{event_id}
    return {"message": "not yet implemented", "event_id": event_id}


@router.post("/{event_id}/rsvp")
async def register_for_event(event_id: str, user: CurrentUser):
    """
    Register the current user for an event (pending host approval).
    Sends a notification to the event host.
    """
    db = get_firestore_client()
    
    # 1. Fetch event
    event_ref = db.collection("events").document(event_id)
    event_doc = await event_ref.get()
    if not event_doc.exists:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event_data = event_doc.to_dict()
    
    # 2. Check for duplicate registration
    existing = await db.collection("registrations") \
        .where("event_id", "==", event_id) \
        .where("user_id", "==", user["uid"]) \
        .get()
    
    if len(existing) > 0:
        raise HTTPException(status_code=400, detail="Already registered for this event")
    
    # 3. Check capacity
    if event_data.get("current_attendees", 0) >= event_data.get("max_attendees", 100):
        raise HTTPException(status_code=400, detail="Event is already full")
    
    # 4. Fetch user name for registration doc
    user_doc = await db.collection("users").document(user["uid"]).get()
    user_name = user_doc.to_dict().get("name", "Eco Warrior")
    
    # 5. Create registration
    reg_id = str(uuid.uuid4())
    from app.models.registration import Registration, RegistrationStatus
    new_reg = Registration(
        id=reg_id,
        event_id=event_id,
        user_id=user["uid"],
        user_name=user_name,
        status=RegistrationStatus.PENDING,
        registered_at=datetime.utcnow()
    )
    
    await db.collection("registrations").document(reg_id).set(new_reg.model_dump())
    
    # 6. Notify host
    notif_id = str(uuid.uuid4())
    from app.models.notification import Notification, NotificationType
    host_notification = Notification(
        id=notif_id,
        user_id=event_data["created_by"],
        type=NotificationType.RSVP_REQUEST,
        message=f"{user_name} requested to join your event: {event_data['event_title']}",
        data={"event_id": event_id, "registration_id": reg_id},
        timestamp=datetime.utcnow()
    )
    await db.collection("notifications").document(notif_id).set(host_notification.model_dump())
    
    return {"status": "pending", "registration_id": reg_id}


@router.get("/{event_id}/rsvps")
async def list_rsvps(event_id: str, user: CurrentUser):
    """
    List all registrations for an event. 
    Only the event host can see this.
    """
    db = get_firestore_client()
    
    event_doc = await db.collection("events").document(event_id).get()
    if not event_doc.exists:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event_data = event_doc.to_dict()
    if event_data["created_by"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Only the host can manage RSVPs")
    
    docs = db.collection("registrations").where("event_id", "==", event_id).stream()
    
    rsvps = []
    async for doc in docs:
        rsvps.append(doc.to_dict())
        
    return rsvps
