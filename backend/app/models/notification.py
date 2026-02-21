from datetime import datetime
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field

class NotificationType(str, Enum):
    RSVP_REQUEST = "rsvp_request"
    RSVP_APPROVED = "rsvp_approved"
    RSVP_REJECTED = "rsvp_rejected"
    NEW_COMMENT = "new_comment"
    GENERAL = "general"

class Notification(BaseModel):
    id: str
    user_id: str
    type: NotificationType
    message: str
    data: Optional[dict[str, Any]] = None # e.g. {"event_id": "...", "post_id": "..."}
    is_read: bool = False
    timestamp: datetime
