from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ActionCategory(str, Enum):
    RECYCLING = "recycling"
    COMPOSTING = "composting"
    TREE_PLANTING = "tree_planting"
    ENERGY_SAVING = "energy_saving"
    WATER_CONSERVATION = "water_conservation"
    CARPOOLING = "carpooling"
    PUBLIC_TRANSPORT = "public_transport"
    CYCLING = "cycling"
    WASTE_CLEANUP = "waste_cleanup"
    SUSTAINABLE_PURCHASE = "sustainable_purchase"
    OTHER = "other"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    MANUAL_REVIEW = "manual_review"


class LocationData(BaseModel):
    lat: float
    lng: float
    geohash: str


class AiVerdict(BaseModel):
    category_detected: Optional[str] = None
    confidence: float = 0.0
    reasoning: str = ""
    approved: bool = False


class EcoActionCreate(BaseModel):
    category: ActionCategory
    quantity: float = Field(gt=0, description="Amount of the eco action performed")
    quantity_unit: str = Field(description="Unit of quantity, e.g. 'kg', 'trees', 'km'")
    location: Optional[LocationData] = None
    community_id: Optional[str] = None
    event_id: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None


class EcoAction(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    author_id: str
    author_name: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    category: ActionCategory
    timestamp: datetime
    verification_status: VerificationStatus = VerificationStatus.PENDING
    location: Optional[LocationData] = None
    points_earned: float = 0.0
    quantity: float
    quantity_unit: str
    community_id: Optional[str] = None
    event_id: Optional[str] = None
    ai_confidence: float = 0.0
    ai_verdict: Optional[AiVerdict] = None
    likes_count: int = 0
    comments_count: int = 0
    description: Optional[str] = None
    city: Optional[str] = None
