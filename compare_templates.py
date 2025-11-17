#!/usr/bin/env python3
"""
Сравнение фолбэк-шаблонов из кода с данными в базе данных.
Показывает, какие шаблоны есть в коде, но отсутствуют в БД.
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

# Фолбэк-шаблоны из app-addicted-logic.js
FALLBACK_TEMPLATES = {
    'not-in-paris': [
        {'id': 'nip-classic', 'name': 'Classic Route'},
        {'id': 'nip-mono', 'name': 'Mono Cut'},
        {'id': 'nip-gradient', 'name': 'Sunset Fade'}
    ],
    'hedonism': [
        {'id': 'hedonism-classic', 'name': 'Hedonism Core'},
        {'id': 'hedonism-night', 'name': 'Night Drive'},
        {'id': 'hedonism-mono', 'name': 'Mono Pulse'}
    ]
}

def get_db_connection():
    """Get database connection"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return None
    
    try:
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f'❌ Ошибка подключения: {e}')
        return None

def compare_templates():
    """Сравнить фолбэк-шаблоны с БД"""
    conn = get_db_connection()
    if not conn:
        print('❌ DATABASE_URL не установлена')
        print('   Установите: export DATABASE_URL="postgresql://..."')
        return
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print('\n' + '='*80)
        print('🔍 СРАВНЕНИЕ ФОЛБЭК-ШАБЛОНОВ С БАЗОЙ ДАННЫХ')
        print('='*80 + '\n')
        
        for club_id, fallback_templates in FALLBACK_TEMPLATES.items():
            print(f'📁 Клуб: {club_id}')
            print('  ' + '-'*76)
            
            # Получаем шаблоны из БД
            cursor.execute("""
                SELECT id, name, status, version
                FROM templates
                WHERE club_id = %s AND status != 'deleted'
            """, (club_id,))
            
            db_templates = {t['id']: t for t in cursor.fetchall()}
            
            print(f'\n  📝 В коде (фолбэки):')
            for template in fallback_templates:
                print(f'    - {template["name"]:25} (id: {template["id"]})')
            
            print(f'\n  💾 В базе данных:')
            if not db_templates:
                print(f'    ❌ Шаблонов нет!')
            else:
                for template_id, template in db_templates.items():
                    status_emoji = '✅' if template['status'] == 'published' else '📝'
                    print(f'    {status_emoji} {template["name"]:25} (id: {template_id}, status: {template["status"]}, v{template["version"]})')
            
            print(f'\n  🔄 Анализ:')
            
            # Проверяем каждый фолбэк
            missing = []
            different_status = []
            exists = []
            
            for template in fallback_templates:
                template_id = template['id']
                if template_id not in db_templates:
                    missing.append(template['name'])
                elif db_templates[template_id]['status'] != 'published':
                    different_status.append({
                        'name': template['name'],
                        'status': db_templates[template_id]['status']
                    })
                else:
                    exists.append(template['name'])
            
            if missing:
                print(f'    ❌ Отсутствуют в БД: {", ".join(missing)}')
                print(f'       → Запустите: python3 sync_fallback_templates.py')
            
            if different_status:
                for item in different_status:
                    print(f'    ⚠️  {item["name"]}: статус "{item["status"]}", а не "published"')
                print(f'       → Запустите: python3 sync_fallback_templates.py (обновит статусы)')
            
            if exists:
                print(f'    ✅ В БД и опубликованы: {", ".join(exists)}')
            
            # Проверяем лишние шаблоны
            fallback_ids = {t['id'] for t in fallback_templates}
            extra_templates = [
                t for t_id, t in db_templates.items()
                if t_id not in fallback_ids
            ]
            
            if extra_templates:
                print(f'\n  ➕ Дополнительные шаблоны в БД (не в фолбэках):')
                for template in extra_templates:
                    status_emoji = '✅' if template['status'] == 'published' else '📝'
                    print(f'    {status_emoji} {template["name"]} (id: {template["id"]}, status: {template["status"]})')
            
            print('\n')
        
        print('='*80)
        print('📊 ИТОГОВАЯ СВОДКА')
        print('='*80 + '\n')
        
        # Общая статистика
        cursor.execute("""
            SELECT 
                club_id,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
            FROM templates
            WHERE status != 'deleted'
            GROUP BY club_id
        """)
        
        stats = cursor.fetchall()
        
        for stat in stats:
            print(f'{stat["club_id"]}:')
            print(f'  Всего: {stat["total"]} | Published: {stat["published"]} | Draft: {stat["draft"]}')
        
        # Проверяем, что видит основное приложение
        print('\n' + '-'*80)
        print('🌐 ЧТО ВИДИТ ОСНОВНОЕ ПРИЛОЖЕНИЕ (GET /api/templates?clubId=X):')
        print('-'*80 + '\n')
        
        for club_id in FALLBACK_TEMPLATES.keys():
            cursor.execute("""
                SELECT name
                FROM templates
                WHERE club_id = %s AND status = 'published'
                ORDER BY name
            """, (club_id,))
            
            published = cursor.fetchall()
            
            print(f'{club_id}:')
            if not published:
                print(f'  ❌ Нет published шаблонов → используются фолбэки из кода')
                print(f'     Фолбэки: {", ".join(t["name"] for t in FALLBACK_TEMPLATES[club_id])}')
            else:
                print(f'  ✅ Загружаются из БД:')
                for template in published:
                    print(f'     - {template["name"]}')
            print()
        
        print('='*80 + '\n')
        
        conn.close()
        
    except Exception as e:
        print(f'❌ Ошибка: {e}')
        import traceback
        traceback.print_exc()
        if conn:
            conn.close()

if __name__ == '__main__':
    compare_templates()




