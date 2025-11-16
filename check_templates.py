#!/usr/bin/env python3
"""
Скрипт для проверки шаблонов в базе данных
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Получить подключение к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL не установлена")
        return None
    
    try:
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"❌ Ошибка подключения к БД: {e}")
        return None

def check_templates():
    """Проверить шаблоны в базе данных"""
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("\n" + "="*80)
        print("📊 ПРОВЕРКА ШАБЛОНОВ В БАЗЕ ДАННЫХ")
        print("="*80 + "\n")
        
        # Проверяем клубы
        print("🏢 КЛУБЫ:")
        cursor.execute("SELECT id, name, slug, status FROM clubs ORDER BY id")
        clubs = cursor.fetchall()
        for club in clubs:
            print(f"  - {club['id']:15} | {club['name']:20} | slug: {club['slug']:15} | status: {club['status']}")
        
        print("\n" + "-"*80 + "\n")
        
        # Проверяем все шаблоны
        print("📄 ВСЕ ШАБЛОНЫ (кроме deleted):")
        cursor.execute("""
            SELECT id, club_id, name, status, version, 
                   created_at, updated_at
            FROM templates 
            WHERE status != 'deleted'
            ORDER BY club_id, name
        """)
        templates = cursor.fetchall()
        
        if not templates:
            print("  ❌ Шаблоны не найдены в базе данных!")
        else:
            print(f"  Всего шаблонов: {len(templates)}\n")
            
            current_club = None
            for template in templates:
                if current_club != template['club_id']:
                    current_club = template['club_id']
                    print(f"\n  Клуб: {current_club}")
                    print("  " + "-"*76)
                
                status_emoji = "✅" if template['status'] == 'published' else "📝"
                print(f"  {status_emoji} {template['name']:30} | status: {template['status']:10} | v{template['version']} | id: {template['id'][:8]}...")
        
        print("\n" + "-"*80 + "\n")
        
        # Проверяем только published шаблоны (то, что видит основное приложение)
        print("🌐 PUBLISHED ШАБЛОНЫ (видны в основном приложении):")
        cursor.execute("""
            SELECT club_id, name, status
            FROM templates 
            WHERE status = 'published'
            ORDER BY club_id, name
        """)
        published = cursor.fetchall()
        
        if not published:
            print("  ❌ Нет опубликованных шаблонов!")
        else:
            current_club = None
            for template in published:
                if current_club != template['club_id']:
                    current_club = template['club_id']
                    club_name = next((c['name'] for c in clubs if c['id'] == current_club), current_club)
                    print(f"\n  {club_name} ({current_club}):")
                print(f"    ✅ {template['name']}")
        
        print("\n" + "-"*80 + "\n")
        
        # Статистика по статусам
        print("📊 СТАТИСТИКА ПО СТАТУСАМ:")
        cursor.execute("""
            SELECT club_id, status, COUNT(*) as count
            FROM templates
            WHERE status != 'deleted'
            GROUP BY club_id, status
            ORDER BY club_id, status
        """)
        stats = cursor.fetchall()
        
        current_club = None
        for stat in stats:
            if current_club != stat['club_id']:
                current_club = stat['club_id']
                club_name = next((c['name'] for c in clubs if c['id'] == current_club), current_club)
                print(f"\n  {club_name} ({current_club}):")
            print(f"    {stat['status']:10}: {stat['count']} шт.")
        
        print("\n" + "="*80 + "\n")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Ошибка при проверке шаблонов: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.close()

if __name__ == '__main__':
    check_templates()



