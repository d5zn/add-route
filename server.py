#!/usr/bin/env python3
"""
Production HTTP server for addicted Web
Enhanced security features: CSP, CORS, Rate Limiting
"""

import http.server
import socketserver
import webbrowser
import os
import json
import time
from datetime import datetime
from collections import defaultdict
from urllib.parse import urlparse, parse_qs

# PostgreSQL support
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from psycopg2 import errors as psycopg2_errors
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False
    print("⚠️ PostgreSQL not available. Install psycopg2-binary for database support.")

def get_db_connection():
    """Get PostgreSQL connection from DATABASE_URL"""
    if not POSTGRES_AVAILABLE:
        return None
    
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        print("⚠️ DATABASE_URL not set")
        return None
    
    # Railway использует postgresql://, но psycopg2 хочет postgres://
    if database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgres://', 1)
    
    # Проверяем наличие внутреннего URL для Railway (быстрее)
    railway_internal_url = os.environ.get('DATABASE_PRIVATE_URL')
    if railway_internal_url:
        # Используем внутренний URL если доступен
        if railway_internal_url.startswith('postgresql://'):
            railway_internal_url = railway_internal_url.replace('postgresql://', 'postgres://', 1)
        database_url = railway_internal_url
        print("🔗 Using Railway internal database URL")
    
    try:
        # Добавляем таймауты подключения
        # connect_timeout - максимальное время ожидания подключения в секундах
        print(f"🔌 Attempting to connect to database...")
        conn = psycopg2.connect(
            database_url,
            connect_timeout=10,  # 10 секунд на подключение
            keepalives=1,  # Включить keepalive
            keepalives_idle=30,  # Отправлять keepalive каждые 30 секунд
            keepalives_interval=10,  # Интервал между keepalive пакетами
            keepalives_count=3  # Количество попыток перед разрывом
        )
        print("✅ Database connection established")
        return conn
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e).lower()
        if 'operationalerror' in error_type or 'timeout' in error_msg or 'connection' in error_msg:
            print(f"❌ Database connection error (Operational): {e}")
        else:
            print(f"❌ Database connection error: {e}")
        print(f"   Error type: {error_type}")
        print(f"   URL format: {'postgres://' if database_url.startswith('postgres://') else 'unknown'}")
        # Показываем только хост, не весь URL с паролем
        try:
            from urllib.parse import urlparse
            parsed = urlparse(database_url)
            print(f"   Host: {parsed.hostname}, Port: {parsed.port}, Database: {parsed.path}")
        except Exception as parse_error:
            print(f"   Could not parse URL: {parse_error}")
        import traceback
        traceback.print_exc()
        return None

ANALYTICS_TABLE_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS auth_events (
        id BIGSERIAL PRIMARY KEY,
        athlete_id BIGINT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS downloads (
        id BIGSERIAL PRIMARY KEY,
        athlete_id BIGINT,
        club_id VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        file_format VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE SET NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS visits (
        id BIGSERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        athlete_id BIGINT,
        club_id VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        page_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE SET NULL
    )
    """
]

ANALYTICS_INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_auth_events_athlete_id ON auth_events(athlete_id)",
    "CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_auth_events_date ON auth_events((DATE(created_at)))",
    "CREATE INDEX IF NOT EXISTS idx_downloads_athlete_id ON downloads(athlete_id)",
    "CREATE INDEX IF NOT EXISTS idx_downloads_club_id ON downloads(club_id)",
    "CREATE INDEX IF NOT EXISTS idx_downloads_created_at ON downloads(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_downloads_date ON downloads((DATE(created_at)))",
    "CREATE INDEX IF NOT EXISTS idx_visits_session_id ON visits(session_id)",
    "CREATE INDEX IF NOT EXISTS idx_visits_athlete_id ON visits(athlete_id)",
    "CREATE INDEX IF NOT EXISTS idx_visits_club_id ON visits(club_id)",
    "CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_visits_date ON visits((DATE(created_at)))"
]

ANALYTICS_VIEW_STATEMENTS = [
    """
    CREATE OR REPLACE VIEW stats_unique_connections AS
    SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT athlete_id) as unique_connections
    FROM auth_events
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    """,
    """
    CREATE OR REPLACE VIEW stats_downloads_by_club AS
    SELECT 
        club_id,
        COUNT(*) as total_downloads,
        COUNT(DISTINCT athlete_id) as unique_users
    FROM downloads
    GROUP BY club_id
    """,
    """
    CREATE OR REPLACE VIEW stats_visits_by_day AS
    SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_visits,
        COUNT(DISTINCT session_id) as unique_visits
    FROM visits
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    """,
    """
    CREATE OR REPLACE VIEW stats_visits_by_month AS
    SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as total_visits,
        COUNT(DISTINCT session_id) as unique_visits
    FROM visits
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
    """
]

def ensure_analytics_schema(cursor):
    """Ensure analytics tables, indexes and views exist"""
    for statement in ANALYTICS_TABLE_STATEMENTS + ANALYTICS_INDEX_STATEMENTS + ANALYTICS_VIEW_STATEMENTS:
        try:
            cursor.execute(statement)
        except Exception as e:
            print(f"⚠️ Analytics ensure error: {e}\n   Statement: {statement.strip()[:80]}...")

def execute_sql_statements(cursor, sql_content, description="SQL"):
    """Execute SQL statements, handling each one separately to avoid transaction issues"""
    import re
    
    # Remove single-line comments (-- ...) but preserve line structure
    lines = sql_content.split('\n')
    cleaned_lines = []
    for line in lines:
        comment_pos = line.find('--')
        if comment_pos >= 0:
            line = line[:comment_pos]
        cleaned_lines.append(line)
    sql_content = '\n'.join(cleaned_lines)
    
    # Split SQL into statements
    # Strategy: split by semicolon, but be smart about multi-line statements
    # Most SQL statements end with semicolon on their own line or followed by newline
    statements = []
    
    # First, try to split by semicolon followed by newline or end of string
    # This handles most cases correctly
    parts = re.split(r';\s*\n', sql_content)
    
    # Also handle semicolon at end of string
    if sql_content.strip().endswith(';'):
        # Last part might not have been split properly
        if parts and not parts[-1].strip().endswith(';'):
            parts[-1] = parts[-1].rstrip() + ';'
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
        
        # Remove trailing semicolon if present
        if part.endswith(';'):
            part = part[:-1].strip()
        
        if not part:
            continue
        
        statements.append(part)
    
    # If splitting by semicolon+newline didn't work well, fall back to simple split
    if not statements or len(statements) < 2:
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]
        # Remove trailing semicolons
        statements = [s[:-1].strip() if s.endswith(';') else s.strip() for s in statements]
        statements = [s for s in statements if s]
    
    # Execute each statement separately (autocommit is already enabled)
    executed = 0
    errors = 0
    
    for statement in statements:
        statement = statement.strip()
        if not statement:
            continue
        
        try:
            cursor.execute(statement)
            executed += 1
        except Exception as e:
            error_msg = str(e).lower()
            # Check if error is acceptable (object already exists)
            if 'already exists' in error_msg or \
               ('duplicate' in error_msg and 'key' in error_msg) or \
               ('relation' in error_msg and 'already exists' in error_msg):
                executed += 1  # Count as successful
            else:
                errors += 1
                print(f"⚠️ {description} error: {e}")
                # Show preview of problematic statement (first line)
                first_line = statement.split('\n')[0][:100]
                print(f"   First line: {first_line}...")
    
    return executed, errors

def init_database():
    """Initialize database with schema"""
    conn = get_db_connection()
    if not conn:
        print("⚠️ No database connection, skipping DB init")
        return
    
    try:
        # Set autocommit mode to avoid transaction issues
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Read main schema from file
        schema_file = 'database_schema.sql'
        if os.path.exists(schema_file):
            with open(schema_file, 'r', encoding='utf-8') as f:
                schema_sql = f.read()
                executed, errors = execute_sql_statements(cursor, schema_sql, "Main schema")
                print(f"✅ Main database schema: {executed} statements executed, {errors} errors")
        else:
            print("⚠️ database_schema.sql not found")
        
        # Read analytics schema from file
        analytics_file = 'analytics_schema.sql'
        if os.path.exists(analytics_file):
            with open(analytics_file, 'r', encoding='utf-8') as f:
                analytics_sql = f.read()
                # Remove FOREIGN KEY constraints that might fail if athletes table doesn't exist yet
                # Use regex to handle multi-line FK constraints
                import re
                analytics_sql_no_fk = re.sub(
                    r',\s*FOREIGN\s+KEY\s+\(athlete_id\)\s+REFERENCES\s+athletes\(athlete_id\)\s+ON\s+DELETE\s+SET\s+NULL',
                    '',
                    analytics_sql,
                    flags=re.IGNORECASE | re.MULTILINE
                )
                executed, errors = execute_sql_statements(cursor, analytics_sql_no_fk, "Analytics schema")
                print(f"✅ Analytics schema: {executed} statements executed, {errors} errors")
        else:
            print("⚠️ analytics_schema.sql not found, using fallback")
            # Fallback: use ensure_analytics_schema
            try:
                ensure_analytics_schema(cursor)
                print("✅ Analytics schema (fallback method)")
            except Exception as e:
                print(f"⚠️ Analytics fallback error: {e}")
            
    except Exception as e:
        print(f"❌ Database init error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            conn.close()

def get_client_ip(handler):
    """Get client IP address from request headers"""
    # Check for forwarded headers (proxy/load balancer)
    forwarded_for = handler.headers.get('X-Forwarded-For')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    
    real_ip = handler.headers.get('X-Real-IP')
    if real_ip:
        return real_ip
    
    # Fallback to direct connection
    return handler.client_address[0] if handler.client_address else 'unknown'

def get_user_agent(handler):
    """Get user agent from request headers"""
    return handler.headers.get('User-Agent', 'unknown')

def inject_config(html_content):
    """Inject configuration from environment variables into HTML"""
    try:
        try:
            from server_config import STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
            print(f"✅ Loaded config from server_config.py")
        except ImportError:
            STRAVA_CLIENT_ID = os.environ.get('STRAVA_CLIENT_ID', 'YOUR_STRAVA_CLIENT_ID')
            STRAVA_CLIENT_SECRET = os.environ.get('STRAVA_CLIENT_SECRET', 'YOUR_STRAVA_CLIENT_SECRET')
            if STRAVA_CLIENT_ID != 'YOUR_STRAVA_CLIENT_ID':
                display_id = STRAVA_CLIENT_ID[:10] + '...' if len(STRAVA_CLIENT_ID) > 10 else STRAVA_CLIENT_ID
                print(f"⚠️ Using env vars: CLIENT_ID={display_id}")
            else:
                print("❌ No Strava credentials found!")
        
        # Ensure we have valid string values
        STRAVA_CLIENT_ID = str(STRAVA_CLIENT_ID) if STRAVA_CLIENT_ID else 'YOUR_STRAVA_CLIENT_ID'
        STRAVA_CLIENT_SECRET = str(STRAVA_CLIENT_SECRET) if STRAVA_CLIENT_SECRET else 'YOUR_STRAVA_CLIENT_SECRET'
        
        # Escape JavaScript string values to prevent injection
        import json
        STRAVA_CLIENT_ID_JS = json.dumps(STRAVA_CLIENT_ID)
        STRAVA_CLIENT_SECRET_JS = json.dumps(STRAVA_CLIENT_SECRET)
        
        is_production = os.environ.get('ENVIRONMENT') == 'production'
        is_railway = os.environ.get('RAILWAY_ENVIRONMENT') is not None
        
        # Generate config script
        config_script = f"""
<script>
window.CONFIG = {{
    STRAVA: {{
        CLIENT_ID: {STRAVA_CLIENT_ID_JS},
        CLIENT_SECRET: {STRAVA_CLIENT_SECRET_JS},
        REDIRECT_URI: window.location.origin + '/route/oauth/',
        SCOPE: 'read,activity:read_all',
        API_BASE_URL: 'https://www.strava.com/api/v3'
    }},
    ENV: {{
        PRODUCTION: {str(is_production or is_railway).lower()},
        DEBUG: {str(not (is_production or is_railway)).lower()},
        MOCK_DATA: false
    }},
    APP: {{
        NAME: 'addicted',
        VERSION: '1.0.0',
        DEFAULT_WORKOUTS_COUNT: 10
    }}
}};

if (CONFIG.ENV.DEBUG) {{
    console.log('🔧 addicted Web Configuration:', CONFIG);
}}

console.log('🔑 Config injected - CLIENT_ID:', window.CONFIG.STRAVA.CLIENT_ID ? (window.CONFIG.STRAVA.CLIENT_ID.length > 10 ? window.CONFIG.STRAVA.CLIENT_ID.substring(0, 10) + '...' : window.CONFIG.STRAVA.CLIENT_ID) : 'NOT SET');
</script>
"""
        
        # Replace config.js script tag with inline config (try multiple versions)
        # Check for /route/config.js paths first
        if '<script src="/route/config.js?v=4"></script>' in html_content:
            html_content = html_content.replace(
                '<script src="/route/config.js?v=4"></script>',
                config_script
            )
        elif '<script src="config.js?v=4"></script>' in html_content:
            html_content = html_content.replace(
                '<script src="config.js?v=4"></script>',
                config_script
            )
        elif '<script src="/route/config.js?v=3"></script>' in html_content:
            html_content = html_content.replace(
                '<script src="/route/config.js?v=3"></script>',
                config_script
            )
        elif '<script src="config.js?v=3"></script>' in html_content:
            html_content = html_content.replace(
                '<script src="config.js?v=3"></script>',
                config_script
            )
        else:
            # Fallback - replace any config.js (with or without /route/)
            import re
            html_content = re.sub(
                r'<script src="(/route/)?config\.js\?v=\d+"></script>',
                config_script,
                html_content
            )
        
        print(f"✅ Config injected into HTML")
        return html_content
    except Exception as e:
        print(f"❌ Error injecting config: {e}")
        import traceback
        traceback.print_exc()
        # Return original HTML if config injection fails
        return html_content

class ProductionHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    # Rate limiting storage
    rate_limit_store = defaultdict(list)
    RATE_LIMIT_WINDOW = 60  # seconds
    RATE_LIMIT_MAX_REQUESTS = 100  # max requests per window
    
    def end_headers(self):
        # Get origin for CORS
        origin = self.headers.get('Origin', '')
        
        # Получаем конфигурацию
        try:
            from server_config import ALLOWED_ORIGINS, DEBUG
        except ImportError:
            DEBUG = True
            ALLOWED_ORIGINS = ['http://localhost:8000']
        
        # CORS headers - только разрешенные домены
        if origin in ALLOWED_ORIGINS or DEBUG:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.send_header('Access-Control-Allow-Credentials', 'true')
        
        # Strict Content Security Policy для production
        if not DEBUG:
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "  # Removed unsafe-eval for security
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://www.strava.com; "
                "font-src 'self'; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none';"
            )
        else:
            # Более мягкая CSP для development
            csp = (
                "default-src 'self' * 'unsafe-inline' 'unsafe-eval'; "
                "script-src * 'unsafe-inline' 'unsafe-eval'; "
                "style-src * 'unsafe-inline'; "
                "img-src * data: blob:; "
                "connect-src *;"
            )
        
        self.send_header('Content-Security-Policy', csp)
        
        # Security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
        
        # HTTPS only для production
        if not DEBUG:
            self.send_header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        
        # Cache control
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        super().end_headers()

    def do_GET(self):
        """Handle GET requests with rate limiting"""
        # Health check endpoint (skip rate limiting)
        if self.path == '/health' or self.path == '/healthcheck':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
            return
        
        # Rate limiting check
        if not self.check_rate_limit():
            self.send_error(429, 'Too Many Requests')
            return
        
        # Admin API endpoint
        if self.path == '/api/admin/users':
            self.handle_admin_users()
            return
        
        # Support page endpoint
        if self.path == '/support':
            try:
                with open('support.html', 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', len(html_content.encode('utf-8')))
                self.end_headers()
                self.wfile.write(html_content.encode('utf-8'))
                print(f"✅ Served support page via /support endpoint")
                return
            except Exception as e:
                print(f"❌ Error serving support page: {e}")
                self.send_error(404, 'Support page not found')
                return
        
        # Landing page on root domain
        if self.path == '/' or self.path == '/index.html':
            try:
                with open('landing.html', 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', len(html_content.encode('utf-8')))
                self.end_headers()
                self.wfile.write(html_content.encode('utf-8'))
                return
            except Exception as e:
                print(f"❌ Error serving landing page: {e}")
                # Fallback to default handling
        
        # Application on /route/ path
        if self.path == '/route/' or self.path == '/route' or self.path == '/route/index.html':
            try:
                with open('index.html', 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # Inject configuration
                html_content = inject_config(html_content)
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', len(html_content.encode('utf-8')))
                self.end_headers()
                self.wfile.write(html_content.encode('utf-8'))
                return
            except Exception as e:
                print(f"❌ Error injecting config: {e}")
                # Fallback to default handling
        
        # Handle /route/ paths for application files and static assets
        if self.path.startswith('/route/'):
            # Remove /route/ prefix and serve from root
            # Also remove query parameters if present
            path_without_query = self.path.split('?')[0]
            file_path = path_without_query[7:]  # Remove '/route/'
            if not file_path:
                file_path = 'index.html'
            elif file_path.endswith('/'):
                # If path ends with /, remove trailing slash
                file_path = file_path.rstrip('/')
            
            print(f"🔍 Serving /route/ file: {file_path} (from {self.path})")
            
            try:
                # Check if it's a directory FIRST, before any file operations
                if os.path.isdir(file_path):
                    # If directory, try to serve index.html from it
                    index_path = os.path.join(file_path, 'index.html')
                    if os.path.exists(index_path) and os.path.isfile(index_path):
                        file_path = index_path
                    else:
                        print(f"❌ Directory without index.html: {file_path}")
                        self.send_error(404, f'Directory Not Found: {file_path}')
                        return
                
                # Now verify it's a file (not a directory)
                if not os.path.exists(file_path):
                    print(f"❌ Path does not exist: {file_path} (from {self.path})")
                    self.send_error(404, f'File Not Found: {file_path}')
                    return
                
                if os.path.isdir(file_path):
                    # Should not happen after directory check above, but double-check
                    print(f"❌ Still a directory after processing: {file_path}")
                    self.send_error(404, f'Directory Not Found: {file_path}')
                    return
                
                if not os.path.isfile(file_path):
                    print(f"❌ Not a file: {file_path} (from {self.path})")
                    self.send_error(404, f'File Not Found: {file_path}')
                    return
                
                # Now we know it's a file, serve it
                # Handle HTML files
                if file_path.endswith('.html'):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        html_content = f.read()
                    
                    # Inject config for index.html
                    if file_path == 'index.html' or file_path.endswith('/index.html') or file_path.endswith('\\index.html'):
                        html_content = inject_config(html_content)
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', len(html_content.encode('utf-8')))
                    self.end_headers()
                    self.wfile.write(html_content.encode('utf-8'))
                    return
                else:
                    # Handle static files (CSS, JS, images, etc.)
                    # Determine MIME type
                    mime_type = 'application/octet-stream'
                    if file_path.endswith('.css'):
                        mime_type = 'text/css'
                    elif file_path.endswith('.js'):
                        mime_type = 'application/javascript'
                    elif file_path.endswith('.svg'):
                        mime_type = 'image/svg+xml'
                    elif file_path.endswith('.png'):
                        mime_type = 'image/png'
                    elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                        mime_type = 'image/jpeg'
                    elif file_path.endswith('.ico'):
                        mime_type = 'image/x-icon'
                    elif file_path.endswith('.json'):
                        mime_type = 'application/json'
                    
                    # Read and serve file (we already verified it's a file above)
                    with open(file_path, 'rb') as f:
                        file_content = f.read()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', mime_type)
                    self.send_header('Content-Length', len(file_content))
                    self.end_headers()
                    self.wfile.write(file_content)
                    print(f"✅ Served /route/ file: {file_path}")
                    return
            except Exception as e:
                print(f"❌ Error serving /route/ file {file_path}: {e}")
                import traceback
                traceback.print_exc()
                self.send_error(500, 'Internal Server Error')
                return
        
        # Handle static HTML files (information.html, etc.) on root
        if self.path.endswith('.html') and not self.path.startswith('/route/'):
            try:
                filename = self.path[1:]  # Remove leading slash
                print(f"🔍 Looking for HTML file: {filename}")
                if os.path.exists(filename):
                    print(f"✅ Found HTML file: {filename}")
                    with open(filename, 'r', encoding='utf-8') as f:
                        html_content = f.read()
                    
                    # Send response
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', len(html_content.encode('utf-8')))
                    self.end_headers()
                    self.wfile.write(html_content.encode('utf-8'))
                    print(f"✅ Served HTML file: {filename}")
                    return
                else:
                    print(f"❌ HTML file not found: {filename}")
            except Exception as e:
                print(f"❌ Error serving HTML file {self.path}: {e}")
                self.send_error(404, 'File Not Found')
                return
        
        # Продолжаем как обычно
        super().do_GET()
    
    def do_POST(self):
        """Handle POST requests with rate limiting"""
        # Rate limiting check
        if not self.check_rate_limit():
            self.send_error(429, 'Too Many Requests')
            return
        
        # OAuth token exchange (works for both root and /route/)
        if self.path == '/api/strava/token' or self.path == '/route/api/strava/token':
            self.handle_token_exchange()
        # Analytics API endpoints
        elif self.path.startswith('/api/analytics/') or self.path.startswith('/route/api/analytics/'):
            self.handle_analytics_api()
        else:
            self.send_error(404, 'Not Found')

    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.end_headers()

    def check_rate_limit(self):
        """Check if request is within rate limit"""
        # Получаем IP клиента
        client_ip = self.client_address[0]
        
        # Получаем текущее время
        now = time.time()
        
        # Очищаем старые записи
        self.rate_limit_store[client_ip] = [
            req_time for req_time in self.rate_limit_store[client_ip]
            if now - req_time < self.RATE_LIMIT_WINDOW
        ]
        
        # Проверяем лимит
        if len(self.rate_limit_store[client_ip]) >= self.RATE_LIMIT_MAX_REQUESTS:
            print(f"⚠️ Rate limit exceeded for {client_ip}")
            return False
        
        # Добавляем текущий запрос
        self.rate_limit_store[client_ip].append(now)
        return True

    def handle_token_exchange(self):
        """Handle OAuth token exchange"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            code = data.get('code')
            if not code:
                self.send_error(400, 'Missing authorization code')
                return
            
            # Exchange code for token with Strava API
            import urllib.request
            import urllib.parse
            
            # Get configuration
            try:
                from server_config import STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
            except ImportError:
                import os
                STRAVA_CLIENT_ID = os.environ.get('STRAVA_CLIENT_ID', 'YOUR_STRAVA_CLIENT_ID')
                STRAVA_CLIENT_SECRET = os.environ.get('STRAVA_CLIENT_SECRET', 'YOUR_STRAVA_CLIENT_SECRET')
            
            client_id = STRAVA_CLIENT_ID
            client_secret = STRAVA_CLIENT_SECRET
            
            # Prepare token exchange request
            token_data = {
                'client_id': client_id,
                'client_secret': client_secret,
                'code': code,
                'grant_type': 'authorization_code'
            }
            
            # Make request to Strava token endpoint
            data = urllib.parse.urlencode(token_data).encode()
            req = urllib.request.Request(
                'https://www.strava.com/oauth/token',
                data=data,
                method='POST'
            )
            
            try:
                with urllib.request.urlopen(req) as response:
                    token_response = json.loads(response.read().decode())
                    
                    # Сохраняем данные пользователя
                    athlete_data = token_response.get('athlete', {})
                    if athlete_data:
                        self.save_athlete_data(athlete_data, token_response.get('access_token'))
                    
                    # Send success response
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    
                    response_data = {
                        'access_token': token_response.get('access_token'),
                        'refresh_token': token_response.get('refresh_token'),
                        'expires_at': token_response.get('expires_at'),
                        'athlete': athlete_data
                    }
                    
                    self.wfile.write(json.dumps(response_data).encode())
                    print(f"✅ Token exchange successful for athlete: {athlete_data.get('firstname', 'Unknown')}")
                    
            except urllib.error.HTTPError as e:
                error_body = e.read().decode()
                print(f"❌ Strava API error: {e.code} - {error_body}")
                
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Token exchange failed'}).encode())
                
        except Exception as e:
            print(f"❌ Error handling token exchange: {e}")
            self.send_error(500, f'Internal server error: {str(e)}')

    def save_athlete_data(self, athlete_data, access_token):
        """Save athlete data to PostgreSQL or fallback to JSON"""
        # Try database first
        conn = get_db_connection()
        
        if conn:
            try:
                cursor = conn.cursor()
                
                # Insert or update athlete
                cursor.execute("""
                    INSERT INTO athletes (
                        athlete_id, username, firstname, lastname, email,
                        city, country, profile_picture, access_token_hash,
                        strava_created_at, strava_updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (athlete_id) 
                    DO UPDATE SET
                        username = EXCLUDED.username,
                        firstname = EXCLUDED.firstname,
                        lastname = EXCLUDED.lastname,
                        email = EXCLUDED.email,
                        city = EXCLUDED.city,
                        country = EXCLUDED.country,
                        profile_picture = EXCLUDED.profile_picture,
                        access_token_hash = EXCLUDED.access_token_hash,
                        strava_updated_at = EXCLUDED.strava_updated_at,
                        last_seen_at = CURRENT_TIMESTAMP
                """, (
                    athlete_data.get('id'),
                    athlete_data.get('username'),
                    athlete_data.get('firstname'),
                    athlete_data.get('lastname'),
                    athlete_data.get('email', 'not_provided'),
                    athlete_data.get('city'),
                    athlete_data.get('country'),
                    athlete_data.get('profile'),
                    self.hash_token(access_token),
                    athlete_data.get('created_at'),
                    athlete_data.get('updated_at')
                ))
                
                conn.commit()
                print(f"✅ Saved athlete to DB: {athlete_data.get('firstname')} {athlete_data.get('lastname')}")
                
                # Record auth event (unique connection per day)
                try:
                    athlete_id = athlete_data.get('id')
                    ip_address = get_client_ip(self)
                    user_agent = get_user_agent(self)
                    
                    # Insert auth event (using unique index for one connection per day)
                    cursor.execute("""
                        INSERT INTO auth_events (athlete_id, ip_address, user_agent)
                        SELECT %s, %s, %s
                        WHERE NOT EXISTS (
                            SELECT 1 FROM auth_events 
                            WHERE athlete_id = %s 
                            AND DATE(created_at) = CURRENT_DATE
                        )
                    """, (athlete_id, ip_address, user_agent, athlete_id))
                    
                    conn.commit()
                    print(f"✅ Recorded auth event for athlete: {athlete_id}")
                except Exception as e:
                    print(f"⚠️ Error recording auth event: {e}")
                    # Continue even if analytics fails
                
                conn.close()
                return
                
            except Exception as e:
                print(f"⚠️ Error saving to database: {e}")
                conn.rollback()
                conn.close()
                # Fallthrough to JSON fallback
        
        # Fallback to JSON
        try:
            athlete_info = {
                'athlete_id': athlete_data.get('id'),
                'username': athlete_data.get('username'),
                'firstname': athlete_data.get('firstname'),
                'lastname': athlete_data.get('lastname'),
                'email': athlete_data.get('email', 'not_provided'),
                'city': athlete_data.get('city'),
                'country': athlete_data.get('country'),
                'profile_picture': athlete_data.get('profile'),
                'created_at': athlete_data.get('created_at'),
                'updated_at': athlete_data.get('updated_at'),
                'connected_at': datetime.now().isoformat(),
                'access_token_hash': self.hash_token(access_token)
            }
            
            data_dir = 'data'
            if not os.path.exists(data_dir):
                os.makedirs(data_dir)
            
            filename = os.path.join(data_dir, f'athlete_{athlete_info["athlete_id"]}.json')
            
            if os.path.exists(filename):
                with open(filename, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
                    existing_data.update(athlete_info)
                    athlete_info = existing_data
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(athlete_info, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Saved athlete data (JSON): {athlete_info.get('firstname')} {athlete_info.get('lastname')} (ID: {athlete_info.get('athlete_id')})")
            
        except Exception as e:
            print(f"⚠️ Error saving athlete data: {e}")
    
    def record_download(self, athlete_id=None, club_id=None):
        """Record a download event"""
        conn = get_db_connection()
        if not conn:
            return
        
        try:
            cursor = conn.cursor()
            ip_address = get_client_ip(self)
            user_agent = get_user_agent(self)
            
            cursor.execute("""
                INSERT INTO downloads (athlete_id, club_id, ip_address, user_agent, file_format)
                VALUES (%s, %s, %s, %s, 'png')
            """, (athlete_id, club_id, ip_address, user_agent))
            
            conn.commit()
            print(f"✅ Recorded download: athlete_id={athlete_id}, club_id={club_id}")
        except Exception as e:
            print(f"⚠️ Error recording download: {e}")
            conn.rollback()
        finally:
            conn.close()
    
    def record_visit(self, session_id, athlete_id=None, club_id=None, page_path='/'):
        """Record a visit event"""
        conn = get_db_connection()
        if not conn:
            return
        
        try:
            cursor = conn.cursor()
            ip_address = get_client_ip(self)
            user_agent = get_user_agent(self)
            
            cursor.execute("""
                INSERT INTO visits (session_id, athlete_id, club_id, ip_address, user_agent, page_path)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (session_id, athlete_id, club_id, ip_address, user_agent, page_path))
            
            conn.commit()
        except Exception as e:
            print(f"⚠️ Error recording visit: {e}")
            conn.rollback()
        finally:
            conn.close()
    
    def handle_analytics_api(self):
        """Handle analytics API endpoints"""
        if self.command == 'POST':
            # Record events (download, visit)
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                event_type = data.get('type')
                
                if event_type == 'download':
                    athlete_id = data.get('athlete_id')
                    club_id = data.get('club_id')
                    self.record_download(athlete_id, club_id)
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'ok'}).encode())
                    return
                    
                elif event_type == 'visit':
                    session_id = data.get('session_id')
                    athlete_id = data.get('athlete_id')
                    club_id = data.get('club_id')
                    page_path = data.get('page_path', '/')
                    self.record_visit(session_id, athlete_id, club_id, page_path)
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'ok'}).encode())
                    return
                    
            except json.JSONDecodeError:
                self.send_error(400, 'Invalid JSON')
                return
                    
            except Exception as e:
                print(f"❌ Error handling analytics API: {e}")
                self.send_error(500, f'Internal server error: {str(e)}')
                return
                
        elif self.command == 'GET':
            # Get statistics
            try:
                conn = get_db_connection()
                if not conn:
                    self.send_error(503, 'Database not available')
                    return
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                # Handle both /api/analytics/ and /route/api/analytics/
                path = self.path
                if path.startswith('/route/api/analytics/'):
                    path = path.replace('/route/api/analytics/', '')
                elif path.startswith('/api/analytics/'):
                    path = path.replace('/api/analytics/', '')
                
                if path == 'stats' or path == '':
                    # Get all statistics
                    stats = {}
                    
                    # Unique connections
                    cursor.execute("SELECT COUNT(DISTINCT athlete_id) as count FROM auth_events")
                    stats['unique_connections'] = cursor.fetchone()['count']
                    
                    # Total downloads
                    cursor.execute("SELECT COUNT(*) as count FROM downloads")
                    stats['total_downloads'] = cursor.fetchone()['count']
                    
                    # Downloads by club
                    cursor.execute("""
                        SELECT club_id, COUNT(*) as count 
                        FROM downloads 
                        GROUP BY club_id
                    """)
                    stats['downloads_by_club'] = {row['club_id']: row['count'] for row in cursor.fetchall()}
                    
                    # Visits by day
                    cursor.execute("""
                        SELECT DATE(created_at) as date, COUNT(*) as total, COUNT(DISTINCT session_id) as unique_visits
                        FROM visits
                        GROUP BY DATE(created_at)
                        ORDER BY date DESC
                        LIMIT 30
                    """)
                    stats['visits_by_day'] = [dict(row) for row in cursor.fetchall()]
                    
                    # Visits by month
                    cursor.execute("""
                        SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as total, COUNT(DISTINCT session_id) as unique_visits
                        FROM visits
                        GROUP BY DATE_TRUNC('month', created_at)
                        ORDER BY month DESC
                        LIMIT 12
                    """)
                    stats['visits_by_month'] = [dict(row) for row in cursor.fetchall()]
                    
                    conn.close()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(stats, default=str).encode())
                    return
                
                conn.close()
                self.send_error(404, 'Not Found')
                
            except Exception as e:
                print(f"❌ Error getting statistics: {e}")
                import traceback
                traceback.print_exc()
                self.send_error(500, f'Internal server error: {str(e)}')
                return
                
        else:
            self.send_error(405, 'Method Not Allowed')
    
    def handle_admin_users(self):
        """Handle admin users API endpoint from database or JSON fallback"""
        try:
            # Try database first
            conn = get_db_connection()
            
            if conn:
                try:
                    cursor = conn.cursor(cursor_factory=RealDictCursor)
                    cursor.execute("""
                        SELECT 
                            athlete_id, username, firstname, lastname, email,
                            city, country, connected_at, last_seen_at
                        FROM athletes 
                        WHERE is_active = TRUE 
                        ORDER BY connected_at DESC
                    """)
                    
                    users = cursor.fetchall()
                    # Convert datetime to string for JSON
                    for user in users:
                        if user.get('connected_at'):
                            user['connected_at'] = user['connected_at'].isoformat()
                        if user.get('last_seen_at'):
                            user['last_seen_at'] = user['last_seen_at'].isoformat()
                    
                    conn.close()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'users': users}).encode())
                    return
                    
                except Exception as e:
                    print(f"⚠️ Error querying database: {e}")
                    conn.close()
                    # Fallthrough to JSON
            
            # Fallback to JSON files
            data_dir = 'data'
            
            if not os.path.exists(data_dir):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'users': []}).encode())
                return
            
            users = []
            for filename in os.listdir(data_dir):
                if filename.startswith('athlete_') and filename.endswith('.json'):
                    filepath = os.path.join(data_dir, filename)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            user_data = json.load(f)
                            users.append(user_data)
                    except Exception as e:
                        print(f"⚠️ Error reading {filename}: {e}")
            
            # Sort by connected_at descending
            users.sort(key=lambda x: x.get('connected_at', ''), reverse=True)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'users': users}).encode())
            
        except Exception as e:
            print(f"❌ Error in admin users endpoint: {e}")
            self.send_error(500, 'Internal server error')
    
    def hash_token(self, token):
        """Create a hash of the token for logging purposes"""
        try:
            import hashlib
            return hashlib.sha256(token.encode()).hexdigest()[:16]
        except:
            return 'not_available'

    def log_message(self, format, *args):
        """Override to customize logging with timestamp"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"📡 [{timestamp}] {format % args}")

def main():
    # Check if we're in production mode
    is_production = os.environ.get('ENVIRONMENT') == 'production'
    is_railway = os.environ.get('RAILWAY_ENVIRONMENT') is not None
    
    PORT = int(os.environ.get('PORT', 8000))
    
    # Change to the directory containing the web files
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Initialize database (non-blocking)
    print("🔧 Initializing database...")
    try:
        init_database()
    except Exception as e:
        print(f"⚠️ Database initialization error (non-fatal): {e}")
        print("🔄 Continuing with JSON fallback...")
    
    Handler = ProductionHTTPRequestHandler
    
    # Use reusable address to avoid "Address already in use" errors
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        env = "RAILWAY" if is_railway else ("PRODUCTION" if is_production else "DEVELOPMENT")
        print(f"🚀 addicted Web Server ({env}) running on port {PORT}")
        print(f"📱 Server listening on 0.0.0.0:{PORT}")
        
        if is_railway:
            print("☁️ Running on Railway Cloud")
            print("✅ Database:", "Connected" if get_db_connection() else "Fallback to JSON")
        elif not is_production:
            print(f"🌐 Open your browser: http://localhost:{PORT}")
            print("⚠️  IMPORTANT: Update CLIENT_ID and CLIENT_SECRET in server_config.py before using OAuth!")
        
        print("🔒 Security features: Rate limiting, CSP, CORS")
        print("🛑 Press Ctrl+C to stop the server")
        print("")
        
        try:
            if not is_production and not is_railway:
                webbrowser.open(f'http://localhost:{PORT}')
        except:
            pass
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    main()

