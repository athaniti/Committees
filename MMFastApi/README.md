# Meetings Management FastAPI Backend

This is a FastAPI backend for a meetings management application with MySQL database support.

## Features

- User management
- Committee management
- Meeting scheduling
- File attachments
- Voting system (with 'opt' column)
- Comments and announcements
- Task management
- Full CRUD operations for all entities

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your MySQL database and update the `.env` file with your database credentials:
```
DATABASE_URL=mysql+aiomysql://username:password@localhost:3306/meetings_db
```

3. Create the database schema using the SQL provided in the project documentation.

4. Run the application:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database Schema

The application uses the following entities:
- Users, Roles, Committees
- Meetings, Attendance, Agenda Items
- Files, Votes (with 'opt' column), Announcements
- Comments, Tasks

## CORS

The API is configured to accept requests from React development servers running on ports 3000 and 5173.
