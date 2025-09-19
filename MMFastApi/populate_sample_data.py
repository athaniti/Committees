#!/usr/bin/env python3
"""
Script to populate the database with sample data for testing.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, engine
from models import Base, User, Meeting, Committee, File, Announcement

async def create_sample_data():
    """Create sample data for testing."""
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSession(engine) as db:
        try:
            # Create sample users
            users = [
                User(id=1, email="admin@committee.gr", name="Διαχειριστής", password_hash="hashed_password"),
                User(id=2, email="secretary@committee.gr", name="Γραμματεία", password_hash="hashed_password"),
                User(id=3, email="member@committee.gr", name="Μέλος Επιτροπής", password_hash="hashed_password"),
            ]
            
            for user in users:
                db.add(user)
            
            # Create sample committees
            committees = [
                Committee(id=1, name="Διοικητικό Συμβούλιο", description="Κεντρικό διοικητικό όργανο"),
                Committee(id=2, name="Οικονομική Επιτροπή", description="Επιτροπή οικονομικών θεμάτων"),
            ]
            
            for committee in committees:
                db.add(committee)
            
            # Create sample meetings
            meetings = [
                Meeting(
                    id=1,
                    committee_id=1,
                    title="Τακτική Συνεδρίαση Σεπτεμβρίου",
                    description="Μηνιαία τακτική συνεδρίαση του Διοικητικού Συμβουλίου",
                    scheduled_at=datetime.now() + timedelta(days=5),
                    created_by=1,
                    created_at=datetime.now()
                ),
                Meeting(
                    id=2,
                    committee_id=2,
                    title="Αναθεώρηση Προϋπολογισμού",
                    description="Συνεδρίαση για την αναθεώρηση του ετήσιου προϋπολογισμού",
                    scheduled_at=datetime.now() + timedelta(days=10),
                    created_by=2,
                    created_at=datetime.now()
                ),
            ]
            
            for meeting in meetings:
                db.add(meeting)
            
            # Create sample files
            files = [
                File(
                    id=1,
                    filename="sample_meeting_minutes.pdf",
                    original_name="Πρακτικά Συνεδρίασης Αυγούστου.pdf",
                    url="/uploads/sample_meeting_minutes.pdf",
                    file_path="uploads/sample_meeting_minutes.pdf",
                    uploaded_by=2,
                    uploaded_at=datetime.now() - timedelta(days=15),
                    size=2048576,  # 2MB
                    file_type="application/pdf",
                    description="Πρακτικά της συνεδρίασης του Αυγούστου",
                    category="meetings",
                    tags='["πρακτικά", "συνεδρίαση", "αύγουστος"]',
                    download_count=12,
                    is_public=1,
                    meeting_id=1
                ),
                File(
                    id=2,
                    filename="annual_budget_2025.xlsx",
                    original_name="Προϋπολογισμός 2025.xlsx",
                    url="/uploads/annual_budget_2025.xlsx",
                    file_path="uploads/annual_budget_2025.xlsx",
                    uploaded_by=1,
                    uploaded_at=datetime.now() - timedelta(days=20),
                    size=1536000,  # 1.5MB
                    file_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    description="Ετήσιος προϋπολογισμός για το 2025",
                    category="documents",
                    tags='["προϋπολογισμός", "2025", "οικονομικά"]',
                    download_count=25,
                    is_public=0,
                    meeting_id=2
                ),
                File(
                    id=3,
                    filename="policy_document.docx",
                    original_name="Νέα Πολιτική Διαδικασιών.docx",
                    url="/uploads/policy_document.docx",
                    file_path="uploads/policy_document.docx",
                    uploaded_by=1,
                    uploaded_at=datetime.now() - timedelta(days=7),
                    size=512000,  # 500KB
                    file_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    description="Νέες διαδικασίες και πολιτικές του οργανισμού",
                    category="documents",
                    tags='["πολιτική", "διαδικασίες", "κανονισμοί"]',
                    download_count=8,
                    is_public=1,
                    meeting_id=None
                ),
                File(
                    id=4,
                    filename="quarterly_report.pdf",
                    original_name="Τριμηνιαία Αναφορά Q3.pdf",
                    url="/uploads/quarterly_report.pdf",
                    file_path="uploads/quarterly_report.pdf",
                    uploaded_by=3,
                    uploaded_at=datetime.now() - timedelta(days=3),
                    size=3072000,  # 3MB
                    file_type="application/pdf",
                    description="Αναφορά δραστηριοτήτων τρίτου τριμήνου",
                    category="reports",
                    tags='["αναφορά", "τρίμηνο", "δραστηριότητες"]',
                    download_count=15,
                    is_public=1,
                    meeting_id=None
                ),
                File(
                    id=5,
                    filename="committee_photo.jpg",
                    original_name="Φωτογραφία Επιτροπής 2025.jpg",
                    url="/uploads/committee_photo.jpg",
                    file_path="uploads/committee_photo.jpg",
                    uploaded_by=2,
                    uploaded_at=datetime.now() - timedelta(days=30),
                    size=2048000,  # 2MB
                    file_type="image/jpeg",
                    description="Επίσημη φωτογραφία των μελών της επιτροπής",
                    category="images",
                    tags='["φωτογραφία", "επιτροπή", "μέλη"]',
                    download_count=45,
                    is_public=1,
                    meeting_id=None
                ),
            ]
            
            for file in files:
                db.add(file)
            
            # Create sample announcements
            announcements = [
                Announcement(
                    id=1,
                    message="Νέα Συνεδρίαση του Διοικητικού Συμβουλίου - Ενημερώνουμε ότι η επόμενη συνεδρίαση του Διοικητικού Συμβουλίου θα πραγματοποιηθεί στις 25 Σεπτεμβρίου.",
                    created_by=2,
                    meeting_id=1,
                    created_at=datetime.now() - timedelta(days=2)
                ),
                Announcement(
                    id=2,
                    message="Αναθεώρηση Προϋπολογισμού - Παρακαλούμε όλα τα τμήματα να υποβάλουν τις προτάσεις τους για την αναθεώρηση του προϋπολογισμού.",
                    created_by=1,
                    meeting_id=2,
                    created_at=datetime.now() - timedelta(days=5)
                ),
            ]
            
            for announcement in announcements:
                db.add(announcement)
            
            # Commit all changes
            await db.commit()
            print("✅ Sample data created successfully!")
            print("\nCreated:")
            print(f"- {len(users)} users")
            print(f"- {len(committees)} committees") 
            print(f"- {len(meetings)} meetings")
            print(f"- {len(files)} files")
            print(f"- {len(announcements)} announcements")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Error creating sample data: {e}")
            raise
        finally:
            await db.close()

if __name__ == "__main__":
    print("🚀 Creating sample data for Meetings Management API...")
    asyncio.run(create_sample_data())