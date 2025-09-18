from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import asyncio
import aiomysql
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Extended Meetings Management API", version="2.0.0")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'ada',
    'password': 'kekropia',
    'db': 'meetings',
    'charset': 'utf8mb4'
}

# Extended Pydantic models for request/response
class CommitteeCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CommitteeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[str] = None
    committee_id: int
    location: Optional[str] = "Αίθουσα Δημοτικού Συμβουλίου"
    status: Optional[str] = "scheduled"

class MeetingResponse(BaseModel):
    id: int
    committee_id: int
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    created_by: int
    created_at: str

class AgendaItemCreate(BaseModel):
    meeting_id: int
    order_index: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    presenter: Optional[str] = None
    estimated_duration: Optional[int] = None
    status: Optional[str] = "pending"
    introduction_file: Optional[str] = None
    decision_file: Optional[str] = None

class AgendaItemResponse(BaseModel):
    id: int
    meeting_id: int
    order_index: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    presenter: Optional[str] = None
    estimated_duration: Optional[int] = None
    status: Optional[str] = None
    introduction_file: Optional[str] = None
    decision_file: Optional[str] = None
    created_at: str
    updated_at: str

class VoteResultCreate(BaseModel):
    agenda_item_id: int
    votes_for: int = 0
    votes_against: int = 0
    votes_abstain: int = 0
    total_votes: int = 0
    result: str  # 'approved', 'rejected', 'no_quorum'

class VoteResultResponse(BaseModel):
    id: int
    agenda_item_id: int
    votes_for: int
    votes_against: int
    votes_abstain: int
    total_votes: int
    result: str
    voted_at: str

class AgendaCommentCreate(BaseModel):
    agenda_item_id: int
    user_id: int
    comment: str

class AgendaCommentResponse(BaseModel):
    id: int
    agenda_item_id: int
    user_id: int
    comment: str
    created_at: str
    updated_at: str

class VoteCreate(BaseModel):
    meeting_id: int
    opt: str

class VoteResponse(BaseModel):
    id: int
    meeting_id: int
    user_id: int
    opt: str
    created_at: str

# Database helper functions
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

async def init_database():
    """Initialize extended database schema"""
    connection = await get_db_connection()
    try:
        async with connection.cursor() as cursor:
            # Add location and status columns to meetings table if they don't exist
            try:
                await cursor.execute("""
                    ALTER TABLE meetings 
                    ADD COLUMN location VARCHAR(255) DEFAULT 'Αίθουσα Δημοτικού Συμβουλίου',
                    ADD COLUMN status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled'
                """)
            except Exception as e:
                print(f"Meetings table already updated: {e}")

            # Create agenda_items table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS agenda_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    meeting_id INT NOT NULL,
                    order_index INT NOT NULL,
                    title VARCHAR(500) NOT NULL,
                    description TEXT,
                    category VARCHAR(100),
                    presenter VARCHAR(200),
                    estimated_duration INT,
                    status ENUM('pending', 'in_progress', 'completed', 'deferred') DEFAULT 'pending',
                    introduction_file VARCHAR(500),
                    decision_file VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    
                    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
                    INDEX idx_meeting_order (meeting_id, order_index)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            # Create vote_results table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS vote_results (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    agenda_item_id INT NOT NULL,
                    votes_for INT DEFAULT 0,
                    votes_against INT DEFAULT 0,
                    votes_abstain INT DEFAULT 0,
                    total_votes INT DEFAULT 0,
                    result ENUM('approved', 'rejected', 'no_quorum') NOT NULL,
                    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    FOREIGN KEY (agenda_item_id) REFERENCES agenda_items(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_agenda_vote (agenda_item_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            # Create agenda_comments table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS agenda_comments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    agenda_item_id INT NOT NULL,
                    user_id INT NOT NULL,
                    comment TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    
                    FOREIGN KEY (agenda_item_id) REFERENCES agenda_items(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_agenda_comments (agenda_item_id, created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            await connection.commit()
            print("Database schema initialized successfully")
    except Exception as e:
        await connection.rollback()
        print(f"Database initialization error: {e}")
    finally:
        connection.close()

@app.on_event("startup")
async def startup_event():
    await init_database()

@app.get("/")
def read_root():
    return {"message": "Extended Meetings Management API with MySQL", "version": "2.0.0"}

# Committee endpoints
@app.post("/committees/", response_model=CommitteeResponse)
async def create_committee(committee: CommitteeCreate):
    query = "INSERT INTO committees (name, description) VALUES (%s, %s)"
    committee_id = await execute_query(
        query, 
        (committee.name, committee.description)
    )
    
    query = "SELECT * FROM committees WHERE id = %s"
    result = await execute_query(query, (committee_id,), fetch_one=True)
    
    return CommitteeResponse(**result)

@app.get("/committees/", response_model=List[CommitteeResponse])
async def get_committees():
    query = "SELECT * FROM committees"
    results = await execute_query(query, fetch_all=True)
    return [CommitteeResponse(**row) for row in results]

# Enhanced Meeting endpoints
@app.post("/meetings/", response_model=MeetingResponse)
async def create_meeting(meeting: MeetingCreate):
    query = """
    INSERT INTO meetings (committee_id, title, description, scheduled_at, location, status, created_by) 
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    meeting_id = await execute_query(
        query, 
        (meeting.committee_id, meeting.title, meeting.description, 
         meeting.scheduled_at, meeting.location, meeting.status, 1)
    )
    
    query = "SELECT * FROM meetings WHERE id = %s"
    result = await execute_query(query, (meeting_id,), fetch_one=True)
    
    # Convert datetime to string if needed
    if result['scheduled_at']:
        result['scheduled_at'] = str(result['scheduled_at'])
    result['created_at'] = str(result['created_at'])
    
    return MeetingResponse(**result)

@app.get("/meetings/", response_model=List[MeetingResponse])
async def get_meetings():
    query = "SELECT * FROM meetings ORDER BY scheduled_at DESC"
    results = await execute_query(query, fetch_all=True)
    
    # Convert datetime fields to strings
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
    
    # Convert datetime fields to strings
    if result['scheduled_at']:
        result['scheduled_at'] = str(result['scheduled_at'])
    result['created_at'] = str(result['created_at'])
    
    return MeetingResponse(**result)

# Agenda Items endpoints
@app.post("/agenda-items/", response_model=AgendaItemResponse)
async def create_agenda_item(item: AgendaItemCreate):
    query = """
    INSERT INTO agenda_items (meeting_id, order_index, title, description, category, 
                             presenter, estimated_duration, status, introduction_file, decision_file) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    item_id = await execute_query(
        query, 
        (item.meeting_id, item.order_index, item.title, item.description, item.category,
         item.presenter, item.estimated_duration, item.status, item.introduction_file, item.decision_file)
    )
    
    query = "SELECT * FROM agenda_items WHERE id = %s"
    result = await execute_query(query, (item_id,), fetch_one=True)
    
    result['created_at'] = str(result['created_at'])
    result['updated_at'] = str(result['updated_at'])
    
    return AgendaItemResponse(**result)

@app.get("/meetings/{meeting_id}/agenda-items/", response_model=List[AgendaItemResponse])
async def get_meeting_agenda_items(meeting_id: int):
    query = "SELECT * FROM agenda_items WHERE meeting_id = %s ORDER BY order_index"
    results = await execute_query(query, (meeting_id,), fetch_all=True)
    
    for result in results:
        result['created_at'] = str(result['created_at'])
        result['updated_at'] = str(result['updated_at'])
    
    return [AgendaItemResponse(**row) for row in results]

# Vote Results endpoints
@app.post("/vote-results/", response_model=VoteResultResponse)
async def create_vote_result(vote_result: VoteResultCreate):
    query = """
    INSERT INTO vote_results (agenda_item_id, votes_for, votes_against, votes_abstain, 
                             total_votes, result) 
    VALUES (%s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
    votes_for = VALUES(votes_for),
    votes_against = VALUES(votes_against),
    votes_abstain = VALUES(votes_abstain),
    total_votes = VALUES(total_votes),
    result = VALUES(result),
    voted_at = CURRENT_TIMESTAMP
    """
    await execute_query(
        query, 
        (vote_result.agenda_item_id, vote_result.votes_for, vote_result.votes_against,
         vote_result.votes_abstain, vote_result.total_votes, vote_result.result)
    )
    
    query = "SELECT * FROM vote_results WHERE agenda_item_id = %s"
    result = await execute_query(query, (vote_result.agenda_item_id,), fetch_one=True)
    
    result['voted_at'] = str(result['voted_at'])
    
    return VoteResultResponse(**result)

@app.get("/agenda-items/{agenda_item_id}/vote-result/", response_model=Optional[VoteResultResponse])
async def get_agenda_item_vote_result(agenda_item_id: int):
    query = "SELECT * FROM vote_results WHERE agenda_item_id = %s"
    result = await execute_query(query, (agenda_item_id,), fetch_one=True)
    
    if not result:
        return None
    
    result['voted_at'] = str(result['voted_at'])
    return VoteResultResponse(**result)

# Agenda Comments endpoints
@app.post("/agenda-comments/", response_model=AgendaCommentResponse)
async def create_agenda_comment(comment: AgendaCommentCreate):
    query = """
    INSERT INTO agenda_comments (agenda_item_id, user_id, comment) 
    VALUES (%s, %s, %s)
    """
    comment_id = await execute_query(
        query, 
        (comment.agenda_item_id, comment.user_id, comment.comment)
    )
    
    query = "SELECT * FROM agenda_comments WHERE id = %s"
    result = await execute_query(query, (comment_id,), fetch_one=True)
    
    result['created_at'] = str(result['created_at'])
    result['updated_at'] = str(result['updated_at'])
    
    return AgendaCommentResponse(**result)

@app.get("/agenda-items/{agenda_item_id}/comments/", response_model=List[AgendaCommentResponse])
async def get_agenda_item_comments(agenda_item_id: int):
    query = """
    SELECT ac.*, u.name as user_name 
    FROM agenda_comments ac 
    JOIN users u ON ac.user_id = u.id 
    WHERE ac.agenda_item_id = %s 
    ORDER BY ac.created_at
    """
    results = await execute_query(query, (agenda_item_id,), fetch_all=True)
    
    for result in results:
        result['created_at'] = str(result['created_at'])
        result['updated_at'] = str(result['updated_at'])
    
    return [AgendaCommentResponse(**row) for row in results]

# Legacy Vote endpoints (for backward compatibility)
@app.post("/votes/", response_model=VoteResponse)
async def create_vote(vote: VoteCreate):
    query = "INSERT INTO votes (meeting_id, user_id, opt) VALUES (%s, %s, %s)"
    vote_id = await execute_query(
        query, 
        (vote.meeting_id, 1, vote.opt)  # Using user_id = 1 for now
    )
    
    query = "SELECT * FROM votes WHERE id = %s"
    result = await execute_query(query, (vote_id,), fetch_one=True)
    result['created_at'] = str(result['created_at'])
    
    return VoteResponse(**result)

@app.get("/votes/", response_model=List[VoteResponse])
async def get_votes():
    query = "SELECT * FROM votes"
    results = await execute_query(query, fetch_all=True)
    
    for result in results:
        result['created_at'] = str(result['created_at'])
    
    return [VoteResponse(**row) for row in results]

# Users endpoint
@app.get("/users/")
async def get_users():
    query = "SELECT * FROM users"
    try:
        results = await execute_query(query, fetch_all=True)
        for result in results:
            result['created_at'] = str(result['created_at'])
        return results
    except:
        # Return mock data if table doesn't exist yet
        return [
            {"id": 1, "email": "ada@demo.gr", "name": "Ada", "created_at": "2025-09-18T08:00:00"}
        ]

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        connection = await get_db_connection()
        connection.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)