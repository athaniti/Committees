from fastapi import FastAPI, Depends, HTTPException, UploadFile, File as FastAPIFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from contextlib import asynccontextmanager
import os
import shutil
import uuid
import json
from pathlib import Path
from database import get_db, engine
from models import Base, User, Meeting, Committee, Vote, File, Task, Comment, Announcement
from schemas import (
    UserCreate, UserResponse, MeetingCreate, MeetingResponse,
    CommitteeCreate, CommitteeResponse, VoteCreate, VoteResponse,
    FileCreate, FileResponse, FileUpload, TaskCreate, TaskResponse,
    CommentCreate, CommentResponse, AnnouncementCreate, AnnouncementResponse
)
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up FastAPI server...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Database startup error: {e}")
    yield
    # Shutdown
    print("Shutting down FastAPI server...")

app = FastAPI(title="Meetings Management API", version="1.0.0", lifespan=lifespan)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files for file serving
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Meetings Management API", "version": "1.0.0"}

# Users endpoints
@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = User(email=user.email, name=user.name, password_hash="hashed_" + user.password)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=list[UserResponse])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users

# Committees endpoints
@app.post("/committees/", response_model=CommitteeResponse)
async def create_committee(committee: CommitteeCreate, db: AsyncSession = Depends(get_db)):
    db_committee = Committee(name=committee.name, description=committee.description)
    db.add(db_committee)
    await db.commit()
    await db.refresh(db_committee)
    return db_committee

@app.get("/committees/", response_model=list[CommitteeResponse])
async def get_committees(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Committee))
    committees = result.scalars().all()
    return committees

# Meetings endpoints
@app.post("/meetings/", response_model=MeetingResponse)
async def create_meeting(meeting: MeetingCreate, db: AsyncSession = Depends(get_db)):
    db_meeting = Meeting(
        title=meeting.title,
        description=meeting.description,
        scheduled_at=meeting.scheduled_at,
        committee_id=meeting.committee_id,
        created_by=1  # TODO: Get from authentication
    )
    db.add(db_meeting)
    await db.commit()
    await db.refresh(db_meeting)
    return db_meeting

@app.get("/meetings/", response_model=list[MeetingResponse])
async def get_meetings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Meeting))
    meetings = result.scalars().all()
    return meetings

# Votes endpoints
@app.post("/votes/", response_model=VoteResponse)
async def create_vote(vote: VoteCreate, db: AsyncSession = Depends(get_db)):
    db_vote = Vote(
        meeting_id=vote.meeting_id,
        opt=vote.opt,
        user_id=1  # TODO: Get from authentication
    )
    db.add(db_vote)
    await db.commit()
    await db.refresh(db_vote)
    return db_vote

@app.get("/votes/", response_model=list[VoteResponse])
async def get_votes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vote))
    votes = result.scalars().all()
    return votes

# Files endpoints
@app.post("/files/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    meeting_id: int = None,
    description: str = None,
    category: str = "general",
    tags: str = None,
    is_public: bool = True,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create database record
        db_file = File(
            filename=unique_filename,
            original_name=file.filename,
            url=f"/uploads/{unique_filename}",
            file_path=str(file_path),
            uploaded_by=1,  # TODO: Get from authentication
            size=file_size,
            file_type=file.content_type,
            description=description,
            category=category,
            tags=tags,
            download_count=0,
            is_public=1 if is_public else 0,
            meeting_id=meeting_id
        )
        
        db.add(db_file)
        await db.commit()
        await db.refresh(db_file)
        
        return db_file
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@app.get("/files/", response_model=list[FileResponse])
async def get_files(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(File))
    files = result.scalars().all()
    return files

@app.get("/files/{file_id}", response_model=FileResponse)
async def get_file(file_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(File).where(File.id == file_id))
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file

@app.get("/files/{file_id}/download")
async def download_file(file_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(File).where(File.id == file_id))
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = Path(file.file_path) if file.file_path else UPLOAD_DIR / file.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    # Increment download count
    file.download_count = (file.download_count or 0) + 1
    await db.commit()
    
    return FileResponse(
        path=str(file_path),
        filename=file.original_name or file.filename,
        media_type=file.file_type or 'application/octet-stream'
    )

@app.delete("/files/{file_id}")
async def delete_file(file_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(File).where(File.id == file_id))
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete file from disk
    file_path = Path(file.file_path) if file.file_path else UPLOAD_DIR / file.filename
    if file_path.exists():
        os.remove(file_path)
    
    # Delete from database
    await db.execute(delete(File).where(File.id == file_id))
    await db.commit()
    
    return {"message": "File deleted successfully"}

# Tasks endpoints
@app.post("/tasks/", response_model=TaskResponse)
async def create_task(task: TaskCreate, db: AsyncSession = Depends(get_db)):
    db_task = Task(
        meeting_id=task.meeting_id,
        assigned_to=task.assigned_to,
        description=task.description,
        status=task.status
    )
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task

@app.get("/tasks/", response_model=list[TaskResponse])
async def get_tasks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task))
    tasks = result.scalars().all()
    return tasks

# Comments endpoints
@app.post("/comments/", response_model=CommentResponse)
async def create_comment(comment: CommentCreate, db: AsyncSession = Depends(get_db)):
    db_comment = Comment(
        meeting_id=comment.meeting_id,
        message=comment.message,
        user_id=1  # TODO: Get from authentication
    )
    db.add(db_comment)
    await db.commit()
    await db.refresh(db_comment)
    return db_comment

@app.get("/comments/", response_model=list[CommentResponse])
async def get_comments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Comment))
    comments = result.scalars().all()
    return comments

# Announcements endpoints
@app.post("/announcements/", response_model=AnnouncementResponse)
async def create_announcement(announcement: AnnouncementCreate, db: AsyncSession = Depends(get_db)):
    db_announcement = Announcement(
        meeting_id=announcement.meeting_id,
        message=announcement.message,
        created_by=1  # TODO: Get from authentication
    )
    db.add(db_announcement)
    await db.commit()
    await db.refresh(db_announcement)
    return db_announcement

@app.get("/announcements/", response_model=list[AnnouncementResponse])
async def get_announcements(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Announcement))
    announcements = result.scalars().all()
    return announcements

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
