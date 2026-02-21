from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UpcomingEvent(BaseModel):
    event_name: str
    date: datetime
    location: str


class CommunityCreate(BaseModel):
    name: str
    type: str = Field(description="e.g. 'local', 'university', 'corporate', 'ngo'")
    area_of_work: list[str] = Field(
        default_factory=list,
        description="Eco-action categories this community focuses on",
    )
    description: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None


class Community(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    type: str
    area_of_work: list[str] = Field(default_factory=list)
    member_count: int = 0
    members: list[str] = Field(default_factory=list, description="Array of user UIDs")
    rating: float = 0.0
    admin_id: str = Field(description="UID of the community creator/admin")
    coordinator_ids: list[str] = Field(default_factory=list)
    upcoming_events: list[UpcomingEvent] = Field(default_factory=list)
    description: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime


class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    area_of_work: Optional[list[str]] = None
    description: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
