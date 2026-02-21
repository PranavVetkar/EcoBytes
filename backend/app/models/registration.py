from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class RegistrationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ATTENDED = "attended"

class RegistrationBase(BaseModel):
    event_id: str
    user_id: str
    user_name: str
    status: RegistrationStatus = RegistrationStatus.PENDING

class RegistrationCreate(RegistrationBase):
    pass

class Registration(RegistrationBase):
    id: str
    registered_at: datetime
