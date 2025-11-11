"""
Database initialization script

Run this script to create database tables:
    python init_db.py
"""

from app.models import init_database

if __name__ == '__main__':
    print("Initializing database...")
    try:
        init_database()
        print("\n✅ Database initialization complete!")
        print("You can now start the server with: python run.py")
    except Exception as e:
        print(f"\n❌ Database initialization failed: {str(e)}")
        print("\nPlease ensure:")
        print("1. PostgreSQL is installed and running")
        print("2. Database exists (or create with: createdb facial_analysis)")
        print("3. DATABASE_URL in .env is correct")
