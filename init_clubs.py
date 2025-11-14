#!/usr/bin/env python3
"""
Initialize clubs in database with synchronized IDs for main app and admin.
This ensures clubs work seamlessly between the main application and admin panel.
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

# Club definitions (synchronized with admin/src/data/mockClubs.ts)
CLUBS = [
    {
        'id': 'hedonism',
        'name': 'HEDONISM',
        'slug': 'hedonism',
        'description': 'Комьюнити любителей бега и хорошего настроения',
        'theme': {
            'primaryColor': '#FF5A5F',
            'secondaryColor': '#00A699',
            'accentColor': '#FC642D',
            'backgroundColor': '#FFFFFF',
            'fontFamily': 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
        },
        'status': 'active',
    },
    {
        'id': 'not-in-paris',
        'name': 'NOT IN PARIS',
        'slug': 'not-in-paris',
        'description': 'Клуб бегунов NOT IN PARIS',
        'theme': {
            'primaryColor': '#1E40AF',
            'secondaryColor': '#10B981',
            'accentColor': '#F59E0B',
            'backgroundColor': '#FFFFFF',
            'fontFamily': 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
        },
        'status': 'active',
    },
]

def get_db_connection():
    """Get database connection from environment variable"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print('❌ DATABASE_URL environment variable not set')
        return None
    
    try:
        # Handle Railway's postgres:// URL format
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        conn = psycopg2.connect(database_url)
        print('✅ Connected to database')
        return conn
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        return None

def init_clubs():
    """Initialize clubs in database"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        for club in CLUBS:
            # Convert theme dict to JSON string
            theme_json = json.dumps(club['theme'])
            
            # Upsert club (insert or update if exists)
            cursor.execute("""
                INSERT INTO clubs (id, name, slug, description, theme, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s::jsonb, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    slug = EXCLUDED.slug,
                    description = EXCLUDED.description,
                    theme = EXCLUDED.theme,
                    status = EXCLUDED.status,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id, name
            """, (
                club['id'],
                club['name'],
                club['slug'],
                club['description'],
                theme_json,
                club['status']
            ))
            
            result = cursor.fetchone()
            print(f"✅ Initialized club: {result['name']} (id: {result['id']})")
        
        conn.commit()
        
        # Verify all clubs
        cursor.execute("SELECT id, name, slug, status FROM clubs WHERE status = 'active' ORDER BY created_at")
        clubs = cursor.fetchall()
        
        print('\n📊 Active clubs in database:')
        for club in clubs:
            print(f"  - {club['name']} (id: {club['id']}, slug: {club['slug']})")
        
        cursor.close()
        conn.close()
        
        print('\n✅ Clubs initialization completed successfully')
        return True
        
    except Exception as e:
        print(f'❌ Error initializing clubs: {e}')
        if conn:
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    print('🚀 Initializing clubs in database...\n')
    success = init_clubs()
    exit(0 if success else 1)

