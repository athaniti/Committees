import mysql.connector
import sys

def execute_sql_file(sql_file_path):
    """Execute SQL commands from file"""
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            port=3306,
            user='ada',
            password='kekropia',
            database='meetings',
            charset='utf8mb4'
        )
        
        cursor = connection.cursor()
        
        # Read SQL file
        with open(sql_file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        # Split by semicolon and execute each statement
        sql_statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for statement in sql_statements:
            if statement:
                try:
                    print(f"Executing: {statement[:100]}...")
                    cursor.execute(statement)
                    connection.commit()
                    print("✓ Success")
                except Exception as e:
                    print(f"✗ Error: {e}")
                    # Continue with next statement even if one fails
                    continue
        
        print(f"\n✅ Finished executing {sql_file_path}")
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False
    
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("Database connection closed")
    
    return True

def check_table_structure(table_name):
    """Check the current structure of a table"""
    try:
        connection = mysql.connector.connect(
            host='localhost',
            port=3306,
            user='ada',
            password='kekropia',
            database='meetings',
            charset='utf8mb4'
        )
        
        cursor = connection.cursor()
        cursor.execute(f"DESCRIBE {table_name}")
        columns = cursor.fetchall()
        
        print(f"\n📋 Current structure of {table_name}:")
        for column in columns:
            print(f"  {column[0]}: {column[1]} {column[2]} {column[3]} {column[4]} {column[5]}")
            
    except Exception as e:
        print(f"❌ Error checking table structure: {e}")
    
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    print("🔧 Extending agenda_items table...")
    
    # Check current structure first
    check_table_structure("agenda_items")
    
    # Execute the SQL file
    if execute_sql_file("extend_agenda_items.sql"):
        print("\n🔍 Checking updated structure...")
        check_table_structure("agenda_items")
    else:
        print("❌ Failed to execute SQL file")
        sys.exit(1)