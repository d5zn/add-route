#!/usr/bin/env python3
"""
Синхронизация фолбэк-шаблонов из app-addicted-logic.js с базой данных.
Этот скрипт создает в БД те шаблоны, которые используются как fallback в основном приложении.
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

# Фолбэк-шаблоны из app-addicted-logic.js
FALLBACK_TEMPLATES = {
    'not-in-paris': [
        {
            'id': 'nip-classic',
            'name': 'Classic Route',
            'description': 'Standard overlay with club logo and clean typography.',
            'config': {
                'backgroundMode': 'image',
                'fontColor': 'white',
                'isMono': False
            },
            'badge': 'Default'
        },
        {
            'id': 'nip-mono',
            'name': 'Mono Cut',
            'description': 'High-contrast monochrome look for bold storytelling.',
            'config': {
                'backgroundMode': 'image',
                'fontColor': 'white',
                'isMono': True
            },
            'badge': 'Alt'
        },
        {
            'id': 'nip-gradient',
            'name': 'Sunset Fade',
            'description': 'Gradient background with bright typography accents.',
            'config': {
                'backgroundMode': 'gradient',
                'fontColor': 'white',
                'isMono': False
            },
            'badge': 'Special'
        }
    ],
    'hedonism': [
        {
            'id': 'hedonism-classic',
            'name': 'Hedonism Core',
            'description': 'Signature hedonism palette with vivid logo lockup.',
            'config': {
                'backgroundMode': 'image',
                'fontColor': 'white',
                'isMono': False
            },
            'badge': 'Default'
        },
        {
            'id': 'hedonism-night',
            'name': 'Night Drive',
            'description': 'Dark mode composition with neon typography highlights.',
            'config': {
                'backgroundMode': 'solid',
                'fontColor': 'white',
                'isMono': False
            },
            'badge': 'Alt'
        },
        {
            'id': 'hedonism-mono',
            'name': 'Mono Pulse',
            'description': 'Monochrome variant for poster-ready storytelling.',
            'config': {
                'backgroundMode': 'image',
                'fontColor': 'white',
                'isMono': True
            },
            'badge': 'Mono'
        }
    ]
}

def get_db_connection():
    """Get database connection from environment variable"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print('❌ DATABASE_URL environment variable not set')
        print('   Set it with: export DATABASE_URL="postgresql://..."')
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

def create_page_from_config(config):
    """Создать структуру страницы из конфига шаблона"""
    # Определяем background на основе backgroundMode
    background = {}
    if config['backgroundMode'] == 'gradient':
        background = {
            'gradient': {
                'type': 'linear',
                'angle': 135,
                'stops': [
                    {'color': '#FF6B6B', 'position': 0},
                    {'color': '#4ECDC4', 'position': 50},
                    {'color': '#45B7D1', 'position': 100}
                ]
            }
        }
    elif config['backgroundMode'] == 'solid':
        background = {'color': '#000000'}
    else:  # image
        background = {'color': '#FFFFFF'}
    
    # Создаем базовую страницу с одним слоем
    page = {
        'id': 'page-1',
        'name': 'Story 1',
        'background': background,
        'layers': [
            {
                'id': 'layer-1',
                'name': 'Main Layer',
                'visible': True,
                'locked': False,
                'opacity': 1,
                'elements': []
            }
        ]
    }
    
    return page

def sync_templates():
    """Синхронизировать фолбэк-шаблоны с базой данных"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print('\n🔄 Синхронизация фолбэк-шаблонов с базой данных...\n')
        
        for club_id, templates in FALLBACK_TEMPLATES.items():
            print(f'📁 Клуб: {club_id}')
            
            for template in templates:
                # Проверяем, существует ли шаблон
                cursor.execute("""
                    SELECT id, name, status, version
                    FROM templates
                    WHERE id = %s
                """, (template['id'],))
                
                existing = cursor.fetchone()
                
                # Создаем структуру страницы
                page = create_page_from_config(template['config'])
                pages_json = json.dumps([page])
                
                if existing:
                    print(f'  ⚠️  Шаблон уже существует: {template["name"]} (id: {template["id"]}, status: {existing["status"]}, v{existing["version"]})')
                    
                    # Спрашиваем, обновить ли статус на published, если он не published
                    if existing['status'] != 'published':
                        # Обновляем статус на published
                        cursor.execute("""
                            UPDATE templates
                            SET status = 'published',
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = %s
                            RETURNING id, name, status, version
                        """, (template['id'],))
                        
                        updated = cursor.fetchone()
                        print(f'  ✅ Обновлен статус на published: {updated["name"]} (v{updated["version"]})')
                    else:
                        print(f'  ℹ️  Шаблон уже опубликован, пропускаем')
                else:
                    # Создаем новый шаблон
                    cursor.execute("""
                        INSERT INTO templates (
                            id, club_id, name, description, tags,
                            pages, version, status,
                            created_at, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s::jsonb,
                            %s::jsonb, 1, 'published',
                            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                        )
                        RETURNING id, name, status, version
                    """, (
                        template['id'],
                        club_id,
                        template['name'],
                        template['description'],
                        json.dumps([template['badge']]),  # tags
                        pages_json
                    ))
                    
                    created = cursor.fetchone()
                    print(f'  ✅ Создан: {created["name"]} (id: {created["id"]}, v{created["version"]})')
            
            print()
        
        conn.commit()
        
        # Показываем итоговую статистику
        print('='*80)
        print('📊 ИТОГОВАЯ СТАТИСТИКА\n')
        
        for club_id in FALLBACK_TEMPLATES.keys():
            cursor.execute("""
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
                       SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
                FROM templates
                WHERE club_id = %s AND status != 'deleted'
            """, (club_id,))
            
            stats = cursor.fetchone()
            print(f'{club_id}:')
            print(f'  Всего: {stats["total"]} | Published: {stats["published"]} | Draft: {stats["draft"]}')
            
            # Показываем все шаблоны
            cursor.execute("""
                SELECT id, name, status, version
                FROM templates
                WHERE club_id = %s AND status != 'deleted'
                ORDER BY name
            """, (club_id,))
            
            templates_list = cursor.fetchall()
            for t in templates_list:
                status_emoji = '✅' if t['status'] == 'published' else '📝'
                print(f'  {status_emoji} {t["name"]:30} | {t["status"]:10} | v{t["version"]}')
            print()
        
        print('='*80)
        
        cursor.close()
        conn.close()
        
        print('\n✅ Синхронизация завершена успешно!')
        print('\n💡 Теперь:')
        print('   1. Обновите страницу основного приложения (/route/)')
        print('   2. Обновите страницу админки (/route/admin)')
        print('   3. Шаблоны должны совпадать в обоих приложениях')
        
        return True
        
    except Exception as e:
        print(f'❌ Ошибка при синхронизации: {e}')
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    print('🚀 Синхронизация фолбэк-шаблонов...\n')
    success = sync_templates()
    exit(0 if success else 1)

