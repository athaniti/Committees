from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: str
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Role schemas
class RoleBase(BaseModel):
    name: str

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: int

    class Config:
        from_attributes = True

# Committee schemas
class CommitteeBase(BaseModel):
    name: str
    description: Optional[str] = None

class CommitteeCreate(CommitteeBase):
    pass

class CommitteeResponse(CommitteeBase):
    id: int

    class Config:
        from_attributes = True

# Meeting schemas
class MeetingBase(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class MeetingCreate(MeetingBase):
    committee_id: int

class MeetingResponse(MeetingBase):
    id: int
    committee_id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# Vote schemas
class VoteBase(BaseModel):
    opt: str  # Changed from 'option' to 'opt'

class VoteCreate(VoteBase):
    meeting_id: int

class VoteResponse(VoteBase):
    id: int
    meeting_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# File schemas
class FileBase(BaseModel):
    filename: str
    url: str

class FileCreate(FileBase):
    meeting_id: int

class FileResponse(FileBase):
    id: int
    meeting_id: int
    uploaded_by: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Task schemas
class TaskBase(BaseModel):
    description: str
    status: str = "pending"

class TaskCreate(TaskBase):
    meeting_id: int
    assigned_to: int

class TaskResponse(TaskBase):
    id: int
    meeting_id: int
    assigned_to: int
    created_at: datetime

    class Config:
        from_attributes = True

# Comment schemas
class CommentBase(BaseModel):
    message: str

class CommentCreate(CommentBase):
    meeting_id: int

class CommentResponse(CommentBase):
    id: int
    meeting_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Announcement schemas
class AnnouncementBase(BaseModel):
    message: str

class AnnouncementCreate(AnnouncementBase):
    meeting_id: int

class AnnouncementResponse(AnnouncementBase):
    id: int
    meeting_id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True