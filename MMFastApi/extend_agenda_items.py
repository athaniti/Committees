import asyncio
import aiomysql

async def extend_agenda_items_table():
    """Extend the agenda_items table with required columns"""
    
    # Database connection parameters
    DB_CONFIG = {
        'host': 'localhost',
        'port': 3306,
        'user': 'ada',
        'password': 'kekropia',
        'db': 'meetings',
        'charset': 'utf8mb4'
    }
    
    try:
        connection = await aiomysql.connect(**DB_CONFIG)
        print("✅ Connected to database")
        
        async with connection.cursor() as cursor:
            
            # Check current structure
            await cursor.execute("DESCRIBE agenda_items")
            current_columns = await cursor.fetchall()
            print("\n📋 Current agenda_items structure:")
            for col in current_columns:
                print(f"  {col[0]}: {col[1]}")
            
            existing_columns = [col[0] for col in current_columns]
            
            # Add new columns one by one, checking if they already exist
            new_columns = [
                ("category", "VARCHAR(100) AFTER description"),
                ("presenter", "VARCHAR(200) AFTER category"),
                ("estimated_duration", "INT COMMENT 'Duration in minutes' AFTER presenter"),
                ("status", "ENUM('pending', 'in_progress', 'completed', 'deferred') DEFAULT 'pending' AFTER estimated_duration"),
                ("introduction_file", "VARCHAR(500) AFTER status"),
                ("decision_file", "VARCHAR(500) AFTER introduction_file"),
                ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER decision_file"),
                ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at")
            ]
            
            for col_name, col_definition in new_columns:
                if col_name not in existing_columns:
                    try:
                        sql = f"ALTER TABLE agenda_items ADD COLUMN {col_name} {col_definition}"
                        print(f"Adding column {col_name}...")
                        await cursor.execute(sql)
                        await connection.commit()
                        print(f"✅ Added {col_name}")
                    except Exception as e:
                        print(f"❌ Error adding {col_name}: {e}")
                else:
                    print(f"⏭️ Column {col_name} already exists")
            
            # Rename position to order_index if position exists
            if 'position' in existing_columns and 'order_index' not in existing_columns:
                try:
                    await cursor.execute("ALTER TABLE agenda_items CHANGE COLUMN position order_index INT NOT NULL")
                    await connection.commit()
                    print("✅ Renamed position to order_index")
                except Exception as e:
                    print(f"❌ Error renaming position: {e}")
            elif 'order_index' in existing_columns:
                print("⏭️ Column order_index already exists")
            
            # Add index if not exists
            try:
                await cursor.execute("CREATE INDEX IF NOT EXISTS idx_meeting_order ON agenda_items (meeting_id, order_index)")
                await connection.commit()
                print("✅ Added index idx_meeting_order")
            except Exception as e:
                print(f"❌ Error adding index: {e}")
            
            # Add foreign key constraint if not exists
            try:
                await cursor.execute("""
                    ALTER TABLE agenda_items 
                    ADD CONSTRAINT fk_agenda_meeting 
                    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
                """)
                await connection.commit()
                print("✅ Added foreign key constraint")
            except Exception as e:
                print(f"⏭️ Foreign key constraint might already exist: {e}")
            
            # Check final structure
            await cursor.execute("DESCRIBE agenda_items")
            final_columns = await cursor.fetchall()
            print("\n📋 Final agenda_items structure:")
            for col in final_columns:
                print(f"  {col[0]}: {col[1]}")
            
    except Exception as e:
        print(f"❌ Database error: {e}")
    
    finally:
        if 'connection' in locals():
            connection.close()
            print("\n🔒 Database connection closed")

if __name__ == "__main__":
    print("🔧 Extending agenda_items table...")
    asyncio.run(extend_agenda_items_table())