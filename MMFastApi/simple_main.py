from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn

app = FastAPI(title="Meetings Management API", version="1.0.0")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data for testing
mock_committees = [
    {"id": 1, "name": "Tech Committee", "description": "Technology matters"},
    {"id": 2, "name": "Finance Committee", "description": "Financial oversight"}
]

mock_meetings = [
    {
        "id": 1,
        "committee_id": 1,
        "title": "Weekly Tech Meeting", 
        "description": "Regular tech review",
        "scheduled_at": "2025-09-25T10:00:00",
        "created_by": 1,
        "created_at": "2025-09-18T08:00:00"
    }
]

@app.get("/")
def read_root():
    return {"message": "Meetings Management API", "version": "1.0.0"}

@app.get("/committees/")
def get_committees():
    return mock_committees

@app.post("/committees/")
def create_committee(committee_data: dict):
    new_committee = {
        "id": len(mock_committees) + 1,
        "name": committee_data.get("name"),
        "description": committee_data.get("description")
    }
    mock_committees.append(new_committee)
    return new_committee

@app.get("/meetings/")
def get_meetings():
    return mock_meetings

@app.post("/meetings/")
def create_meeting(meeting_data: dict):
    new_meeting = {
        "id": len(mock_meetings) + 1,
        "committee_id": meeting_data.get("committee_id", 1),
        "title": meeting_data.get("title"),
        "description": meeting_data.get("description"),
        "scheduled_at": meeting_data.get("scheduled_at"),
        "created_by": 1,
        "created_at": "2025-09-18T12:00:00"
    }
    mock_meetings.append(new_meeting)
    return new_meeting

@app.get("/users/")
def get_users():
    return [
        {"id": 1, "email": "admin@demo.gr", "name": "Admin User", "created_at": "2025-09-18T08:00:00"},
        {"id": 2, "email": "member@demo.gr", "name": "Member User", "created_at": "2025-09-18T08:00:00"}
    ]

@app.post("/votes/")
def create_vote(vote_data: dict):
    return {
        "id": 1,
        "meeting_id": vote_data.get("meeting_id"),
        "user_id": 1,
        "opt": vote_data.get("opt"),
        "created_at": "2025-09-18T12:00:00"
    }

@app.get("/votes/")
def get_votes():
    return []

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)