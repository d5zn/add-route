#!/usr/bin/env python3
"""
Script to check and optionally permanently delete templates marked as 'deleted'
"""
import os
import sys

# Add parent directory to path to import server functions
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from server import get_db_connection
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("❌ Error: Could not import required modules")
    print("Make sure you're running this from the project root directory")
    sys.exit(1)

def check_deleted_templates():
    """Check how many templates are marked as deleted"""
    conn = get_db_connection()
    if not conn:
        print("❌ Could not connect to database")
        return
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Count deleted templates
        cursor.execute("SELECT COUNT(*) as count FROM templates WHERE status = 'deleted'")
        deleted_count = cursor.fetchone()['count']
        
        # List deleted templates
        cursor.execute("""
            SELECT id, name, club_id, status, updated_at 
            FROM templates 
            WHERE status = 'deleted'
            ORDER BY updated_at DESC
        """)
        deleted_templates = cursor.fetchall()
        
        print(f"📊 Found {deleted_count} deleted template(s):")
        for template in deleted_templates:
            print(f"  - {template['name']} (ID: {template['id']}, Club: {template['club_id']}, Updated: {template['updated_at']})")
        
        conn.close()
        return deleted_templates
        
    except Exception as e:
        print(f"❌ Error checking deleted templates: {e}")
        if conn:
            conn.close()
        return None

def permanently_delete_templates(confirm=False):
    """Permanently delete templates marked as 'deleted'"""
    if not confirm:
        print("⚠️  This will permanently delete all templates marked as 'deleted'")
        response = input("Are you sure? Type 'yes' to confirm: ")
        if response.lower() != 'yes':
            print("❌ Cancelled")
            return
    
    conn = get_db_connection()
    if not conn:
        print("❌ Could not connect to database")
        return
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Count before deletion
        cursor.execute("SELECT COUNT(*) as count FROM templates WHERE status = 'deleted'")
        count_before = cursor.fetchone()['count']
        
        # Permanently delete
        cursor.execute("DELETE FROM templates WHERE status = 'deleted'")
        deleted_count = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        print(f"✅ Permanently deleted {deleted_count} template(s)")
        
    except Exception as e:
        print(f"❌ Error deleting templates: {e}")
        if conn:
            conn.rollback()
            conn.close()

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Check and cleanup deleted templates')
    parser.add_argument('--delete', action='store_true', help='Permanently delete templates marked as deleted')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation prompt')
    
    args = parser.parse_args()
    
    if args.delete:
        permanently_delete_templates(confirm=args.yes)
    else:
        check_deleted_templates()
        print("\n💡 To permanently delete these templates, run:")
        print("   python3 cleanup_deleted_templates.py --delete")

