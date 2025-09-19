#!/usr/bin/env python3
"""
Script to update the database schema for the new file management features.
This script will recreate the files table with the new schema and add sample data.
"""

import asyncio
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from models import Base

# Database connection
DATABASE_URL = "sqlite+aiosqlite:///./meetings.db"

async def update_database_schema():
    """Update the database schema and add sample data."""
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    # Create session factory
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    try:
        # Read the SQL file
        sql_file_path = Path(__file__).parent / "update_files_schema.sql"
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Split SQL commands (SQLite can't handle multiple statements in one execute)
        sql_commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]
        
        async with async_session() as session:
            for command in sql_commands:
                if command and not command.startswith('--'):
                    print(f"Executing: {command[:50]}...")
                    try:
                        await session.execute(text(command))
                        await session.commit()
                        print("✓ Success")
                    except Exception as e:
                        print(f"✗ Error: {e}")
                        await session.rollback()
        
        print("\n✅ Database schema updated successfully!")
        print("✅ Sample data inserted!")
        
    except Exception as e:
        print(f"❌ Error updating database: {e}")
    finally:
        await engine.dispose()

async def verify_data():
    """Verify that the data was inserted correctly."""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    try:
        async with async_session() as session:
            result = await session.execute(text("""
                SELECT 
                    id,
                    filename,
                    original_name,
                    category,
                    size,
                    download_count,
                    is_public
                FROM files
                ORDER BY id
            """))
            
            files = result.fetchall()
            
            print(f"\n📁 Found {len(files)} files in database:")
            print("-" * 80)
            for file in files:
                size_mb = round(file.size / 1024 / 1024, 2) if file.size else 0
                print(f"ID: {file.id:2d} | {file.original_name[:40]:40s} | {file.category:10s} | {size_mb:6.2f}MB | Downloads: {file.download_count:2d}")
            
    except Exception as e:
        print(f"❌ Error verifying data: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    print("🔄 Updating database schema for file management...")
    print("=" * 60)
    
    asyncio.run(update_database_schema())
    asyncio.run(verify_data())
    
    print("\n🎉 Database update complete! You can now test the file management features.")