#!/usr/bin/env python3
"""
Script to import existing templates from app-addicted-logic.js into the database.
This script reads the template definitions from the JavaScript file and creates
corresponding records in the clubs and templates tables.
"""

import os
import sys
import json
import re
import time
from datetime import datetime

# Add the current directory to the path to import server functions
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from psycopg2 import errors as psycopg2_errors
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False
    print("❌ psycopg2 not available. Install it with: pip install psycopg2-binary")
    sys.exit(1)

def get_db_connection():
    """Get PostgreSQL connection from DATABASE_URL (with Railway support)"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not set")
        return None
    
    # Удаляем лишние пробелы/переводы строк (Railway может добавить перевод строки)
    database_url = database_url.strip()
    
    # Railway использует postgresql://, но psycopg2 хочет postgres://
    if database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgres://', 1)
    
    # Проверяем наличие внутреннего URL для Railway (быстрее)
    # Используем только если мы действительно внутри Railway сети
    railway_internal_url = os.environ.get('DATABASE_PRIVATE_URL')
    is_railway = os.environ.get('RAILWAY_ENVIRONMENT') is not None
    
    # Если мы внутри Railway (RAILWAY_ENVIRONMENT установлен), используем внутренний URL
    # Иначе используем DATABASE_URL (который может быть публичным или внутренним)
    if railway_internal_url and is_railway:
        railway_internal_url = railway_internal_url.strip()
        if railway_internal_url.startswith('postgresql://'):
            railway_internal_url = railway_internal_url.replace('postgresql://', 'postgres://', 1)
        database_url = railway_internal_url
        print("🔗 Using Railway internal database URL (inside Railway network)")
    elif is_railway:
        print("⚠️ Running inside Railway but DATABASE_PRIVATE_URL not available, using DATABASE_URL")
    else:
        print("ℹ️ Running locally, using DATABASE_URL (may need public URL)")
    
    max_retries = int(os.environ.get('DATABASE_CONNECT_RETRIES', '3'))
    base_delay = float(os.environ.get('DATABASE_CONNECT_DELAY', '1.5'))
    
    for attempt in range(1, max_retries + 1):
        try:
            if attempt > 1:
                print(f"🔌 Attempting to connect to database... (attempt {attempt}/{max_retries})")
            conn = psycopg2.connect(
                database_url,
                connect_timeout=10
            )
            if attempt > 1:
                print(f"✅ Database connection established after {attempt} attempts")
            else:
                print("✅ Database connection established")
            return conn
        except psycopg2.OperationalError as e:
            if attempt < max_retries:
                delay = base_delay * (2 ** (attempt - 1))  # Exponential backoff
                print(f"❌ Database connection error (Operational): {e}")
                print(f"⏳ Retrying database connection in {delay:.1f}s...")
                time.sleep(delay)
            else:
                print(f"❌ Database connection error: {e}")
                print(f"⚠️ Exhausted all database connection attempts. Falling back.")
        except Exception as e:
            print(f"❌ Database connection error: {e}")
            return None
    
    return None

def parse_template_definitions(js_file_path):
    """Parse template definitions from app-addicted-logic.js"""
    with open(js_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    clubs_data = {}
    
    # Find 'not-in-paris' templates - look for the array between 'not-in-paris': [ and matching ]
    # We need to handle nested braces properly
    nip_start = content.find("'not-in-paris':")
    if nip_start != -1:
        # Find the opening bracket
        bracket_start = content.find('[', nip_start)
        if bracket_start != -1:
            # Find matching closing bracket
            bracket_end = find_matching_bracket(content, bracket_start)
            if bracket_end != -1:
                nip_content = content[bracket_start + 1:bracket_end]
                nip_templates = parse_template_array(nip_content)
                clubs_data['not-in-paris'] = nip_templates
    
    # Find 'hedonism' templates
    hedonism_start = content.find("'hedonism':")
    if hedonism_start != -1:
        bracket_start = content.find('[', hedonism_start)
        if bracket_start != -1:
            bracket_end = find_matching_bracket(content, bracket_start)
            if bracket_end != -1:
                hedonism_content = content[bracket_start + 1:bracket_end]
                hedonism_templates = parse_template_array(hedonism_content)
                clubs_data['hedonism'] = hedonism_templates
    
    return clubs_data

def find_matching_bracket(text, start_pos):
    """Find the matching closing bracket for an opening bracket"""
    depth = 0
    i = start_pos
    while i < len(text):
        if text[i] == '[':
            depth += 1
        elif text[i] == ']':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1

def parse_template_array(template_str):
    """Parse an array of template objects from JavaScript"""
    templates = []
    
    # Find each template object by finding matching braces
    i = 0
    while i < len(template_str):
        # Find opening brace
        if template_str[i] == '{':
            # Find matching closing brace
            brace_end = find_matching_brace(template_str, i)
            if brace_end != -1:
                template_obj_str = template_str[i:brace_end + 1]
                
                # Extract id
                id_match = re.search(r"id:\s*['\"]([^'\"]+)['\"]", template_obj_str)
                template_id = id_match.group(1) if id_match else None
                
                # Extract name
                name_match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", template_obj_str)
                name = name_match.group(1) if name_match else None
                
                # Extract badge
                badge_match = re.search(r"badge:\s*['\"]([^'\"]+)['\"]", template_obj_str)
                badge = badge_match.group(1) if badge_match else None
                
                # Extract description
                desc_match = re.search(r"description:\s*['\"]([^'\"]+)['\"]", template_obj_str)
                description = desc_match.group(1) if desc_match else None
                
                # Extract config - find the config object
                config_start = template_obj_str.find('config:')
                config = {}
                if config_start != -1:
                    # Find opening brace for config
                    config_brace_start = template_obj_str.find('{', config_start)
                    if config_brace_start != -1:
                        config_brace_end = find_matching_brace(template_obj_str, config_brace_start)
                        if config_brace_end != -1:
                            config_str = template_obj_str[config_brace_start + 1:config_brace_end]
                            bg_mode = re.search(r"backgroundMode:\s*['\"]([^'\"]+)['\"]", config_str)
                            font_color = re.search(r"fontColor:\s*['\"]([^'\"]+)['\"]", config_str)
                            is_mono = re.search(r"isMono:\s*(true|false)", config_str)
                            
                            if bg_mode:
                                config['backgroundMode'] = bg_mode.group(1)
                            if font_color:
                                config['fontColor'] = font_color.group(1)
                            if is_mono:
                                config['isMono'] = is_mono.group(1) == 'true'
                
                if template_id and name:
                    templates.append({
                        'id': template_id,
                        'name': name,
                        'badge': badge,
                        'description': description,
                        'config': config
                    })
                
                i = brace_end + 1
            else:
                i += 1
        else:
            i += 1
    
    return templates

def find_matching_brace(text, start_pos):
    """Find the matching closing brace for an opening brace"""
    depth = 0
    i = start_pos
    while i < len(text):
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1

def generate_id():
    """Generate a short unique ID"""
    import random
    import string
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(12))

def create_template_structure(template_data, club_id):
    """Convert simple template data to full admin template structure with elements"""
    template_id = template_data['id']
    name = template_data['name']
    description = template_data.get('description', '')
    config = template_data.get('config', {})
    
    # Create default page structure
    page_id = generate_id()
    layer_id = generate_id()
    
    # Determine background based on config
    background = {'color': '#000000'}  # Default to black for route templates
    if config.get('backgroundMode') == 'gradient':
        # French gradient (blue, white, red)
        background = {
            'gradient': {
                'type': 'linear',
                'stops': [
                    {'offset': 0, 'color': '#0055A4'},  # Blue
                    {'offset': 0.5, 'color': '#FFFFFF'},  # White
                    {'offset': 1, 'color': '#EF4135'}  # Red
                ],
                'angle': 135
            }
        }
    elif config.get('backgroundMode') == 'solid':
        background = {'color': '#000000'}
    
    # Create elements for the template
    elements = []
    
    # 1. Pink route line (path element)
    route_line_id = generate_id()
    route_line = {
        'id': route_line_id,
        'name': 'Route Line',
        'kind': 'shape',
        'visible': True,
        'locked': False,
        'position': {'x': 540, 'y': 400},  # Center-ish
        'rotation': 0,
        'scale': {'x': 1, 'y': 1},
        'opacity': 1,
        'zIndex': 2,
        'box': {'width': 800, 'height': 1200},
        'shape': 'custom',
        'points': [
            {'x': 0, 'y': 0},
            {'x': 50, 'y': 100},
            {'x': 150, 'y': 200},
            {'x': 300, 'y': 300},
            {'x': 500, 'y': 400},
            {'x': 700, 'y': 500},
            {'x': 800, 'y': 600},
            {'x': 750, 'y': 700},
            {'x': 600, 'y': 800},
            {'x': 400, 'y': 900},
            {'x': 200, 'y': 1000},
            {'x': 100, 'y': 1100},
            {'x': 50, 'y': 1200}
        ],
        'stroke': {
            'color': '#FF1493',  # Pink
            'width': 8
        },
        'fill': None
    }
    elements.append(route_line)
    
    # 2. Title text element
    title_id = generate_id()
    title_element = {
        'id': title_id,
        'name': 'Title',
        'kind': 'text',
        'visible': True,
        'locked': False,
        'position': {'x': 540, 'y': 100},
        'rotation': 0,
        'scale': {'x': 1, 'y': 1},
        'opacity': 1,
        'zIndex': 3,
        'box': {'width': 800, 'height': 80},
        'content': 'Route Title',
        'style': {
            'fontFamily': 'Inter',
            'fontWeight': 600,
            'fontStyle': 'normal',
            'fontSize': 48,
            'lineHeight': 56,
            'letterSpacing': 0,
            'fill': '#FFFFFF',
            'textAlign': 'left',
            'textTransform': 'none'
        },
        'autoResize': 'width'
    }
    elements.append(title_element)
    
    # 3. Stats text elements (Distance, Elevation, Time)
    stats_y = 1700
    stats = [
        {'label': 'DISTANCE', 'value': '0.00 km', 'x': 100},
        {'label': 'ELEVATION', 'value': '0 m', 'x': 400},
        {'label': 'TIME', 'value': '0h 0m', 'x': 700}
    ]
    
    for stat in stats:
        stat_id = generate_id()
        stat_element = {
            'id': stat_id,
            'name': stat['label'],
            'kind': 'text',
            'visible': True,
            'locked': False,
            'position': {'x': stat['x'], 'y': stats_y},
            'rotation': 0,
            'scale': {'x': 1, 'y': 1},
            'opacity': 1,
            'zIndex': 3,
            'box': {'width': 200, 'height': 60},
            'content': f"{stat['label']}\n{stat['value']}",
            'style': {
                'fontFamily': 'Inter',
                'fontWeight': 400,
                'fontStyle': 'normal',
                'fontSize': 24,
                'lineHeight': 32,
                'letterSpacing': 0,
                'fill': '#FFFFFF',
                'textAlign': 'left',
                'textTransform': 'uppercase'
            },
            'autoResize': 'none'
        }
        elements.append(stat_element)
    
    page = {
        'id': page_id,
        'name': 'Основная',
        'size': {'width': 1080, 'height': 1920},
        'background': background,
        'layers': [
            {
                'id': layer_id,
                'name': 'Layer 1',
                'elements': elements,
                'visible': True,
                'locked': False
            }
        ]
    }
    
    # Create full template structure
    now = datetime.utcnow().isoformat() + 'Z'
    template = {
        'id': template_id,
        'clubId': club_id,
        'name': name,
        'description': description,
        'tags': [template_data.get('badge', 'Default').lower()] if template_data.get('badge') else [],
        'pages': [page],
        'createdAt': now,
        'updatedAt': now,
        'version': 1,
        'status': 'published'
    }
    
    return template

def import_clubs_and_templates():
    """Main import function"""
    print("🚀 Starting template import...")
    
    # Check if database is available
    conn = get_db_connection()
    if not conn:
        print("❌ Cannot connect to database")
        return False
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Read template definitions from JavaScript file
        js_file = os.path.join(os.path.dirname(__file__), 'app-addicted-logic.js')
        if not os.path.exists(js_file):
            print(f"❌ File not found: {js_file}")
            return False
        
        clubs_data = parse_template_definitions(js_file)
        if not clubs_data:
            print("❌ Could not parse template definitions")
            return False
        
        # Define clubs
        clubs_definitions = {
            'not-in-paris': {
                'id': 'not-in-paris',
                'name': 'NOT IN PARIS',
                'slug': 'not-in-paris',
                'description': 'NOT IN PARIS running club',
                'theme': {
                    'primaryColor': '#1E40AF',
                    'secondaryColor': '#10B981',
                    'accentColor': '#F59E0B',
                    'backgroundColor': '#FFFFFF',
                    'fontFamily': 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
                }
            },
            'hedonism': {
                'id': 'hedonism',
                'name': 'HEDONISM',
                'slug': 'hedonism',
                'description': 'HEDONISM running club',
                'theme': {
                    'primaryColor': '#FF5A5F',
                    'secondaryColor': '#00A699',
                    'accentColor': '#FC642D',
                    'backgroundColor': '#FFFFFF',
                    'fontFamily': 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
                }
            }
        }
        
        # Import clubs
        for club_slug, club_data in clubs_definitions.items():
            # Check if club exists
            cursor.execute("SELECT id FROM clubs WHERE id = %s", (club_data['id'],))
            existing = cursor.fetchone()
            
            if existing:
                print(f"✓ Club '{club_data['name']}' already exists, skipping...")
            else:
                cursor.execute("""
                    INSERT INTO clubs (id, name, slug, description, theme, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, (
                    club_data['id'],
                    club_data['name'],
                    club_data['slug'],
                    club_data['description'],
                    json.dumps(club_data['theme']),
                    'active'
                ))
                print(f"✓ Created club: {club_data['name']}")
        
        # Import templates - only the first one (classic) for each club
        for club_slug, templates_data in clubs_data.items():
            club_id = clubs_definitions[club_slug]['id']
            
            # First, delete all existing templates for this club (we'll keep only one)
            cursor.execute("""
                SELECT id, name FROM templates 
                WHERE club_id = %s AND status != 'deleted'
            """, (club_id,))
            existing_templates = cursor.fetchall()
            
            if existing_templates:
                print(f"  🗑️  Found {len(existing_templates)} existing templates for {club_slug}, removing...")
                for existing_template in existing_templates:
                    cursor.execute("""
                        UPDATE templates 
                        SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (existing_template['id'],))
                    print(f"    - Removed: {existing_template['name']}")
            
            # Import only the first template (classic/default)
            if templates_data:
                template_data = templates_data[0]  # Only first template
                template_id = template_data['id']
                
                # Create full template structure
                full_template = create_template_structure(template_data, club_id)
                
                # Check if this specific template exists
                cursor.execute("SELECT id FROM templates WHERE id = %s", (template_id,))
                template_exists = cursor.fetchone()
                
                if template_exists:
                    # Update existing template
                    cursor.execute("""
                        UPDATE templates 
                        SET name = %s, description = %s, tags = %s, pages = %s, 
                            version = version + 1, status = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (
                        full_template['name'],
                        full_template['description'],
                        json.dumps(full_template['tags']),
                        json.dumps(full_template['pages']),
                        full_template['status'],
                        template_id
                    ))
                    print(f"  ✓ Updated template: {full_template['name']}")
                else:
                    # Insert new template
                    cursor.execute("""
                        INSERT INTO templates (id, club_id, name, description, tags, pages, 
                                              version, status, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """, (
                        full_template['id'],
                        full_template['clubId'],
                        full_template['name'],
                        full_template['description'],
                        json.dumps(full_template['tags']),
                        json.dumps(full_template['pages']),
                        full_template['version'],
                        full_template['status']
                    ))
                    print(f"  ✓ Created template: {full_template['name']}")
        
        conn.commit()
        print("\n✅ Import completed successfully!")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error during import: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        conn.close()

if __name__ == '__main__':
    success = import_clubs_and_templates()
    sys.exit(0 if success else 1)

