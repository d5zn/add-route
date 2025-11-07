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
        return None
    
    # Railway использует postgresql://, но psycopg2 хочет postgres://
    if database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgres://', 1)
    
    try:
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

def init_database():
    """Initialize database with schema"""
    conn = get_db_connection()
    if not conn:
        print("⚠️ No database connection, skipping DB init")
        return
    
    try:
        cursor = conn.cursor()
        
        # Read schema from file
        schema_file = 'database_schema.sql'
        if os.path.exists(schema_file):
            with open(schema_file, 'r') as f:
                schema_sql = f.read()
                # Split by semicolon and execute each statement
                for statement in schema_sql.split(';'):
                    statement = statement.strip()
                    if statement and not statement.startswith('--'):
                        cursor.execute(statement)
            
            conn.commit()
            print("✅ Database initialized successfully")
        else:
            print("⚠️ database_schema.sql not found, skipping DB init")
    except Exception as e:
        print(f"⚠️ Database init error: {e}")
        conn.rollback()
    finally:
        conn.close()

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

