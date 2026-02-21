from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CommentBase(BaseModel):
    content: str
    action_id: Optional[str] = None

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: str
    author_id: str
    author_name: str
    timestamp: datetime
