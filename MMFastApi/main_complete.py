from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import asyncio
import aiomysql
import os
import aiofiles
from datetime import datetime, timedelta
import json
from pathlib import Path
from dotenv import load_dotenv
import hashlib
import mimetypes

load_dotenv()

app = FastAPI(title="Meetings Management API", version="2.0.0")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files for file downloads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'ada',
    'password': 'kekropia',
    'db': 'meetings',
    'charset': 'utf8mb4'
}

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

# Committee Models
class CommitteeCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CommitteeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: Optional[str] = None

# Meeting Models
class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[str] = None
    committee_id: int
    agenda: Optional[str] = None
    status: Optional[str] = "scheduled"

class MeetingResponse(BaseModel):
    id: int
    committee_id: int
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[str] = None
    agenda: Optional[str] = None
    status: Optional[str] = None
    created_by: int
    created_at: str

# File Models
class FileCreate(BaseModel):
    name: str
    category: str
    committee_id: Optional[int] = None
    meeting_id: Optional[int] = None
    description: Optional[str] = None

class FileResponse(BaseModel):
    id: int
    name: str
    file_path: str
    file_size: int
    mime_type: str
    category: str
    committee_id: Optional[int] = None
    meeting_id: Optional[int] = None
    description: Optional[str] = None
    uploaded_by: int
    created_at: str

# Vote Models
class VoteCreate(BaseModel):
    meeting_id: int
    opt: str  # 'for', 'against', 'abstain'

class VoteResponse(BaseModel):
    id: int
    meeting_id: int
    user_id: int
    opt: str
    created_at: str

# Announcement Models
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: Optional[str] = "medium"  # low, medium, high, urgent
    category: Optional[str] = "general"
    expires_at: Optional[str] = None

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    priority: str
    category: str
    expires_at: Optional[str] = None
    created_by: int
    created_at: str

# Task Models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    meeting_id: Optional[int] = None
    due_date: Optional[str] = None
    priority: Optional[str] = "medium"

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    meeting_id: Optional[int] = None
    due_date: Optional[str] = None
    priority: str
    status: str
    created_by: int
    created_at: str

# Comment Models
class CommentCreate(BaseModel):
    content: str
    meeting_id: Optional[int] = None
    file_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    content: str
    meeting_id: Optional[int] = None
    file_id: Optional[int] = None
    user_id: int
    created_at: str

# Library Models
class LibraryDocumentCreate(BaseModel):
    title: str
    category: str
    content: str
    tags: Optional[str] = None
    is_public: Optional[bool] = True

class LibraryDocumentResponse(BaseModel):
    id: int
    title: str
    category: str
    content: str
    tags: Optional[str] = None
    is_public: bool
    created_by: int
    created_at: str

# =============================================================================
# DATABASE HELPER FUNCTIONS
# =============================================================================

async def get_db_connection():
    try:
        connection = await aiomysql.connect(**DB_CONFIG)
        return connection
    except Exception as e:
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

async def execute_query(query: str, params=None, fetch_one=False, fetch_all=False):
    connection = await get_db_connection()
    try:
        async with connection.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(query, params)
            if fetch_one:
                result = await cursor.fetchone()
            elif fetch_all:
                result = await cursor.fetchall()
            else:
                result = cursor.lastrowid
            await connection.commit()
            return result
    except Exception as e:
        await connection.rollback()
        print(f"Query error: {e}")
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")
    finally:
        connection.close()

# =============================================================================
# BASIC ENDPOINTS
# =============================================================================

@app.get("/")
def read_root():
    return {
        "message": "Meetings Management API - Complete Version", 
        "version": "2.0.0",
        "features": [
            "Meetings Management", "File Management", "Calendar", 
            "Library", "Announcements", "Transcription", "Voting"
        ]
    }

@app.get("/health")
async def health_check():
    try:
        connection = await get_db_connection()
        connection.close()
        return {"status": "healthy", "database": "connected", "timestamp": str(datetime.now())}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

# =============================================================================
# COMMITTEE ENDPOINTS
# =============================================================================

@app.post("/committees/", response_model=CommitteeResponse)
async def create_committee(committee: CommitteeCreate):
    query = "INSERT INTO committees (name, description, created_at) VALUES (%s, %s, %s)"
    committee_id = await execute_query(
        query, 
        (committee.name, committee.description, datetime.now())
    )
    
    query = "SELECT * FROM committees WHERE id = %s"
    result = await execute_query(query, (committee_id,), fetch_one=True)
    result['created_at'] = str(result['created_at'])
    
    return CommitteeResponse(**result)

@app.get("/committees/", response_model=List[CommitteeResponse])
async def get_committees():
    query = "SELECT * FROM committees ORDER BY created_at DESC"
    results = await execute_query(query, fetch_all=True)
    for result in results:
        if result.get('created_at'):
            result['created_at'] = str(result['created_at'])
    return [CommitteeResponse(**row) for row in results]

@app.get("/committees/{committee_id}", response_model=CommitteeResponse)
async def get_committee(committee_id: int):
    query = "SELECT * FROM committees WHERE id = %s"
    result = await execute_query(query, (committee_id,), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="Committee not found")
    result['created_at'] = str(result['created_at'])
    return CommitteeResponse(**result)

# =============================================================================
# MEETING ENDPOINTS
# =============================================================================

@app.post("/meetings/", response_model=MeetingResponse)
async def create_meeting(meeting: MeetingCreate):
    query = """
    INSERT INTO meetings (committee_id, title, description, scheduled_at, agenda, status, created_by, created_at) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    meeting_id = await execute_query(
        query, 
        (meeting.committee_id, meeting.title, meeting.description, 
         meeting.scheduled_at, meeting.agenda, meeting.status, 1, datetime.now())
    )
    
    query = "SELECT * FROM meetings WHERE id = %s"
    result = await execute_query(query, (meeting_id,), fetch_one=True)
    
    # Convert datetime fields to strings
    if result['scheduled_at']:
        result['scheduled_at'] = str(result['scheduled_at'])
    result['created_at'] = str(result['created_at'])
    
    return MeetingResponse(**result)

@app.get("/meetings/", response_model=List[MeetingResponse])
async def get_meetings(committee_id: Optional[int] = None):
    if committee_id:
        query = "SELECT * FROM meetings WHERE committee_id = %s ORDER BY scheduled_at DESC"
        results = await execute_query(query, (committee_id,), fetch_all=True)
    else:
        query = "SELECT * FROM meetings ORDER BY scheduled_at DESC"
        results = await execute_query(query, fetch_all=True)
    
    for result in results:
        if result['scheduled_at']:
            result['scheduled_at'] = str(result['scheduled_at'])
        result['created_at'] = str(result['created_at'])
    
    return [MeetingResponse(**row) for row in results]

@app.get("/meetings/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(meeting_id: int):
    query = "SELECT * FROM meetings WHERE id = %s"
    result = await execute_query(query, (meeting_id,), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    if result['scheduled_at']:
        result['scheduled_at'] = str(result['scheduled_at'])
    result['created_at'] = str(result['created_at'])
    
    return MeetingResponse(**result)

# =============================================================================
# FILE MANAGEMENT ENDPOINTS
# =============================================================================

@app.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form(...),
    committee_id: Optional[int] = Form(None),
    meeting_id: Optional[int] = Form(None),
    description: Optional[str] = Form(None)
):
    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if "." in file.filename else ""
    file_hash = hashlib.md5(f"{file.filename}{datetime.now()}".encode()).hexdigest()
    unique_filename = f"{file_hash}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Get file info
    file_size = len(content)
    mime_type = mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
    
    # Save to database
    query = """
    INSERT INTO files (name, file_path, file_size, mime_type, category, committee_id, meeting_id, description, uploaded_by, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    file_id = await execute_query(
        query,
        (file.filename, str(file_path), file_size, mime_type, category, 
         committee_id, meeting_id, description, 1, datetime.now())
    )
    
    return {
        "id": file_id,
        "filename": file.filename,
        "size": file_size,
        "category": category,
        "download_url": f"/files/{file_id}/download"
    }

@app.get("/files/", response_model=List[FileResponse])
async def get_files(
    category: Optional[str] = None,
    committee_id: Optional[int] = None,
    meeting_id: Optional[int] = None
):
    conditions = []
    params = []
    
    if category:
        conditions.append("category = %s")
        params.append(category)
    if committee_id:
        conditions.append("committee_id = %s")
        params.append(committee_id)
    if meeting_id:
        conditions.append("meeting_id = %s")
        params.append(meeting_id)
    
    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
    query = f"SELECT * FROM files{where_clause} ORDER BY created_at DESC"
    
    results = await execute_query(query, params if params else None, fetch_all=True)
    
    for result in results:
        result['created_at'] = str(result['created_at'])
    
    return [FileResponse(**row) for row in results]

@app.get("/files/{file_id}/download")
async def download_file(file_id: int):
    query = "SELECT * FROM files WHERE id = %s"
    result = await execute_query(query, (file_id,), fetch_one=True)
    
    if not result:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = Path(result['file_path'])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_path,
        filename=result['name'],
        media_type=result['mime_type']
    )

# =============================================================================
# VOTE ENDPOINTS
# =============================================================================

@app.post("/votes/", response_model=VoteResponse)
async def create_vote(vote: VoteCreate):
    # Check if user already voted for this meeting
    check_query = "SELECT id FROM votes WHERE meeting_id = %s AND user_id = %s"
    existing = await execute_query(check_query, (vote.meeting_id, 1), fetch_one=True)
    
    if existing:
        # Update existing vote
        query = "UPDATE votes SET opt = %s WHERE id = %s"
        await execute_query(query, (vote.opt, existing['id']))
        vote_id = existing['id']
    else:
        # Create new vote
        query = "INSERT INTO votes (meeting_id, user_id, opt, created_at) VALUES (%s, %s, %s, %s)"
        vote_id = await execute_query(
            query, 
            (vote.meeting_id, 1, vote.opt, datetime.now())
        )
    
    # Fetch the vote
    query = "SELECT * FROM votes WHERE id = %s"
    result = await execute_query(query, (vote_id,), fetch_one=True)
    result['created_at'] = str(result['created_at'])
    
    return VoteResponse(**result)

@app.get("/votes/meeting/{meeting_id}")
async def get_votes_by_meeting(meeting_id: int):
    # Get vote counts
    query = """
    SELECT opt, COUNT(*) as count 
    FROM votes 
    WHERE meeting_id = %s 
    GROUP BY opt
    """
    results = await execute_query(query, (meeting_id,), fetch_all=True)
    
    # Get total voters
    total_query = "SELECT COUNT(DISTINCT user_id) as total FROM votes WHERE meeting_id = %s"
    total_result = await execute_query(total_query, (meeting_id,), fetch_one=True)
    
    return {
        "meeting_id": meeting_id,
        "results": {row['opt']: row['count'] for row in results},
        "total_voters": total_result['total'] if total_result else 0
    }

# =============================================================================
# ANNOUNCEMENT ENDPOINTS
# =============================================================================

@app.post("/announcements/", response_model=AnnouncementResponse)
async def create_announcement(announcement: AnnouncementCreate):
    query = """
    INSERT INTO announcements (title, content, priority, category, expires_at, created_by, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    announcement_id = await execute_query(
        query,
        (announcement.title, announcement.content, announcement.priority,
         announcement.category, announcement.expires_at, 1, datetime.now())
    )
    
    query = "SELECT * FROM announcements WHERE id = %s"
    result = await execute_query(query, (announcement_id,), fetch_one=True)
    
    if result['expires_at']:
        result['expires_at'] = str(result['expires_at'])
    result['created_at'] = str(result['created_at'])
    
    return AnnouncementResponse(**result)

@app.get("/announcements/", response_model=List[AnnouncementResponse])
async def get_announcements(active_only: bool = True):
    if active_only:
        query = """
        SELECT * FROM announcements 
        WHERE expires_at IS NULL OR expires_at > %s 
        ORDER BY priority DESC, created_at DESC
        """
        results = await execute_query(query, (datetime.now(),), fetch_all=True)
    else:
        query = "SELECT * FROM announcements ORDER BY created_at DESC"
        results = await execute_query(query, fetch_all=True)
    
    for result in results:
        if result.get('expires_at'):
            result['expires_at'] = str(result['expires_at'])
        result['created_at'] = str(result['created_at'])
    
    return [AnnouncementResponse(**row) for row in results]

# =============================================================================
# TASK ENDPOINTS
# =============================================================================

@app.post("/tasks/", response_model=TaskResponse)
async def create_task(task: TaskCreate):
    query = """
    INSERT INTO tasks (title, description, assigned_to, meeting_id, due_date, priority, status, created_by, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    task_id = await execute_query(
        query,
        (task.title, task.description, task.assigned_to, task.meeting_id,
         task.due_date, task.priority, "pending", 1, datetime.now())
    )
    
    query = "SELECT * FROM tasks WHERE id = %s"
    result = await execute_query(query, (task_id,), fetch_one=True)
    
    if result.get('due_date'):
        result['due_date'] = str(result['due_date'])
    result['created_at'] = str(result['created_at'])
    
    return TaskResponse(**result)

@app.get("/tasks/", response_model=List[TaskResponse])
async def get_tasks(assigned_to: Optional[int] = None, status: Optional[str] = None):
    conditions = []
    params = []
    
    if assigned_to:
        conditions.append("assigned_to = %s")
        params.append(assigned_to)
    if status:
        conditions.append("status = %s")
        params.append(status)
    
    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
    query = f"SELECT * FROM tasks{where_clause} ORDER BY due_date ASC"
    
    results = await execute_query(query, params if params else None, fetch_all=True)
    
    for result in results:
        if result.get('due_date'):
            result['due_date'] = str(result['due_date'])
        result['created_at'] = str(result['created_at'])
    
    return [TaskResponse(**row) for row in results]

# =============================================================================
# LIBRARY ENDPOINTS
# =============================================================================

@app.post("/library/", response_model=LibraryDocumentResponse)
async def create_library_document(document: LibraryDocumentCreate):
    query = """
    INSERT INTO library (title, category, content, tags, is_public, created_by, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    doc_id = await execute_query(
        query,
        (document.title, document.category, document.content,
         document.tags, document.is_public, 1, datetime.now())
    )
    
    query = "SELECT * FROM library WHERE id = %s"
    result = await execute_query(query, (doc_id,), fetch_one=True)
    result['created_at'] = str(result['created_at'])
    
    return LibraryDocumentResponse(**result)

@app.get("/library/", response_model=List[LibraryDocumentResponse])
async def get_library_documents(
    category: Optional[str] = None,
    search: Optional[str] = None,
    public_only: bool = True
):
    conditions = []
    params = []
    
    if public_only:
        conditions.append("is_public = %s")
        params.append(True)
    
    if category:
        conditions.append("category = %s")
        params.append(category)
    
    if search:
        conditions.append("(title LIKE %s OR content LIKE %s OR tags LIKE %s)")
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term])
    
    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
    query = f"SELECT * FROM library{where_clause} ORDER BY created_at DESC"
    
    results = await execute_query(query, params if params else None, fetch_all=True)
    
    for result in results:
        result['created_at'] = str(result['created_at'])
    
    return [LibraryDocumentResponse(**row) for row in results]

# =============================================================================
# TRANSCRIPTION ENDPOINTS
# =============================================================================

@app.post("/transcription/upload")
async def upload_audio_for_transcription(
    file: UploadFile = File(...),
    meeting_id: Optional[int] = Form(None)
):
    # Basic file validation
    if not file.filename.lower().endswith(('.mp3', '.wav', '.m4a', '.ogg')):
        raise HTTPException(status_code=400, detail="Unsupported audio format")
    
    # Save file
    file_extension = file.filename.split(".")[-1]
    file_hash = hashlib.md5(f"{file.filename}{datetime.now()}".encode()).hexdigest()
    unique_filename = f"audio_{file_hash}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Store in database (for now, just return success)
    # In a real implementation, you would integrate with speech-to-text services
    return {
        "message": "Audio file uploaded successfully",
        "filename": file.filename,
        "transcription_id": f"trans_{file_hash}",
        "status": "processing",
        "note": "This is a demo - implement actual speech-to-text integration"
    }

@app.get("/transcription/{transcription_id}")
async def get_transcription_status(transcription_id: str):
    # Mock transcription result
    return {
        "transcription_id": transcription_id,
        "status": "completed",
        "text": "This is a mock transcription. In a real implementation, this would contain the actual transcribed text from the audio file.",
        "confidence": 0.95,
        "created_at": str(datetime.now())
    }

# =============================================================================
# CALENDAR ENDPOINTS
# =============================================================================

@app.get("/calendar/events")
async def get_calendar_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    conditions = []
    params = []
    
    if start_date:
        conditions.append("scheduled_at >= %s")
        params.append(start_date)
    
    if end_date:
        conditions.append("scheduled_at <= %s")
        params.append(end_date)
    
    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
    query = f"""
    SELECT m.*, c.name as committee_name 
    FROM meetings m 
    LEFT JOIN committees c ON m.committee_id = c.id
    {where_clause}
    ORDER BY scheduled_at ASC
    """
    
    results = await execute_query(query, params if params else None, fetch_all=True)
    
    events = []
    for result in results:
        events.append({
            "id": result['id'],
            "title": result['title'],
            "description": result['description'],
            "start": str(result['scheduled_at']) if result['scheduled_at'] else None,
            "committee": result['committee_name'],
            "status": result['status']
        })
    
    return events

# =============================================================================
# USERS ENDPOINTS (Mock for now)
# =============================================================================

@app.get("/users/")
async def get_users():
    # Mock users data - in real implementation, this would come from the users table
    return [
        {"id": 1, "email": "admin@demo.gr", "name": "Administrator", "role": "admin"},
        {"id": 2, "email": "member@demo.gr", "name": "Council Member", "role": "member"},
        {"id": 3, "email": "secretary@demo.gr", "name": "Secretary", "role": "secretary"}
    ]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)