// SznApp with addicted Logic - Exact copy of nextPoly data handling
// Точная копия логики работы с данными из nextPoly
// Version: 2.0 - Updated branding to addicted

console.log('🚀 Loading SznApp v2.0 - Updated branding to addicted');

class SznApp {
    constructor() {
        this.stravaToken = localStorage.getItem('strava_token');
        this.currentWorkout = null;
        this.workouts = [];
        this.polymerCanvas = null;
        this.currentTab = 'photo';
        this.currentClub = localStorage.getItem('selected_club') || 'not-in-paris';
        this.clubs = [
            { id: 'not-in-paris', name: 'NOT IN PARIS' },
            { id: 'hedonism', name: 'HEDONISM' }
        ];
        this.templatesByClub = {}; // Будет загружено асинхронно
        try {
            this.currentTemplate = localStorage.getItem('selected_template');
        } catch (e) {
            this.currentTemplate = null;
        }
        this.stage = 'init';
        
        // Session ID for analytics
        this.sessionId = this.getOrCreateSessionId();
        this.athleteId = this.getAthleteId();
        
        // Инициализируем addicted Store
        this.store = window.sznStore;
        
        // Устанавливаем клуб в store при инициализации
        if (this.store) {
            this.store.setClub(this.currentClub);
            this.store.setTemplate?.(this.currentTemplate);
        }
        
        // Загружаем шаблоны асинхронно
        this.loadTemplates().then(() => {
            this.ensureTemplateConsistency();
            this.init();
        }).catch(() => {
            // Fallback если загрузка не удалась
            this.templatesByClub = this.getTemplateDefinitions();
            this.ensureTemplateConsistency();
            this.init();
        });
    }
    
    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    }
    
    getAthleteId() {
        // Try to get athlete ID from stored data
        try {
            const athleteData = localStorage.getItem('strava_athlete');
            if (athleteData) {
                const data = JSON.parse(athleteData);
                return data.id || null;
            }
        } catch (e) {
            console.warn('Could not get athlete ID:', e);
        }
        return null;
    }

    async loadTemplates() {
        // Try to load templates from API, fallback to hardcoded
        const clubId = this.currentClub || 'not-in-paris';
        
        try {
            const response = await fetch(`/api/templates?clubId=${encodeURIComponent(clubId)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.templates && data.templates.length > 0) {
                    // Convert API templates to format expected by app
                    this.templatesByClub[clubId] = data.templates;
                    console.log(`✅ Loaded ${data.templates.length} templates from API for club: ${clubId}`);
                    return;
                }
            }
        } catch (error) {
            console.warn('Failed to load templates from API, using fallback:', error);
        }
        
        // Fallback to hardcoded templates
        const fallback = this.getTemplateDefinitions();
        if (!this.templatesByClub[clubId]) {
            this.templatesByClub[clubId] = fallback[clubId] || [];
        }
    }

    getTemplateDefinitions() {
        // Hardcoded fallback templates
        return {
            'not-in-paris': [
                {
                    id: 'nip-classic',
                    name: 'Classic Route',
                    badge: 'Default',
                    description: 'Standard overlay with club logo and clean typography.',
                    config: {
                        backgroundMode: 'image',
                        fontColor: 'white',
                        isMono: false
                    }
                },
                {
                    id: 'nip-mono',
                    name: 'Mono Cut',
                    badge: 'Alt',
                    description: 'High-contrast monochrome look for bold storytelling.',
                    config: {
                        backgroundMode: 'image',
                        fontColor: 'white',
                        isMono: true
                    }
                },
                {
                    id: 'nip-gradient',
                    name: 'Sunset Fade',
                    badge: 'Special',
                    description: 'Gradient background with bright typography accents.',
                    config: {
                        backgroundMode: 'gradient',
                        fontColor: 'white',
                        isMono: false
                    }
                }
            ],
            'hedonism': [
                {
                    id: 'hedonism-classic',
                    name: 'Hedonism Core',
                    badge: 'Default',
                    description: 'Signature hedonism palette with vivid logo lockup.',
                    config: {
                        backgroundMode: 'image',
                        fontColor: 'white',
                        isMono: false
                    }
                },
                {
                    id: 'hedonism-night',
                    name: 'Night Drive',
                    badge: 'Alt',
                    description: 'Dark mode composition with neon typography highlights.',
                    config: {
                        backgroundMode: 'solid',
                        fontColor: 'white',
                        isMono: false
                    }
                },
                {
                    id: 'hedonism-mono',
                    name: 'Mono Pulse',
                    badge: 'Mono',
                    description: 'Monochrome variant for poster-ready storytelling.',
                    config: {
                        backgroundMode: 'image',
                        fontColor: 'white',
                        isMono: true
                    }
                }
            ]
        };
    }

    ensureTemplateConsistency() {
        const templates = this.templatesByClub[this.currentClub] || [];
        if (!templates.length) {
            this.currentTemplate = null;
            try {
                localStorage.removeItem('selected_template');
            } catch (e) {
                console.warn('Unable to clear selected_template:', e);
            }
            if (this.store?.setTemplate) {
                this.store.setTemplate(null);
            }
            return;
        }

        let activeTemplate = templates.find(t => t.id === this.currentTemplate);
        if (!activeTemplate) {
            activeTemplate = templates[0];
            this.currentTemplate = activeTemplate.id;
            try {
                localStorage.setItem('selected_template', this.currentTemplate);
            } catch (e) {
                console.warn('Unable to persist selected_template:', e);
            }
        }

        this.applyTemplateConfig(activeTemplate, { skipHighlight: true, track: false });
    }
    
    async trackAnalytics(eventType, data = {}) {
        try {
            const payload = {
                type: eventType,
                session_id: this.sessionId,
                athlete_id: this.athleteId,
                club_id: this.currentClub,
                ...data
            };
            
            const response = await fetch('/route/api/analytics/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                console.warn('Analytics tracking failed:', response.status);
            }
        } catch (e) {
            // Silently fail analytics - don't break the app
            console.warn('Analytics tracking error:', e);
        }
    }

    init() {
        console.log('SznApp with addicted Logic initializing...');
        this.setupEventListeners();
        this.setupCanvas();
        this.setupTabs();
        this.initializeRatio();
        this.initializeClub();
        this.initializeTemplateTab();
        this.setupMobileOptimizations();
        this.checkAuthStatus();
        
        // Track page visit
        this.trackAnalytics('visit', {
            page_path: window.location.pathname
        });
        
        setTimeout(() => {
            console.log('✅ SznApp with addicted Logic initialized');
            // Синхронизируем кнопки метрик после инициализации
            this.syncMetricButtons();
        }, 100);
    }
    
    setupCanvas() {
        const canvas = document.getElementById('route-canvas');
        if (canvas) {
            // Инициализируем addicted Canvas Component
            this.polymerCanvas = new SznCanvasComponent(canvas, this.store);
            
            // Настраиваем обработчики для управления изображением
            this.setupImageManipulation();
            this.setupPhotoButtons();
            
            console.log('✅ addicted Canvas Component setup complete');
        }
    }
    
    updateCanvas() {
        // addicted Canvas автоматически обрабатывает resize
        if (this.polymerCanvas) {
            this.polymerCanvas.render();
        }
    }

    checkAuthStatus() {
        console.log('Checking auth status, token:', this.stravaToken);
        if (this.stravaToken && this.stravaToken !== 'null') {
            console.log('Token found, loading workouts...');
            this.loadWorkouts();
        } else {
            console.log('No token, showing not connected state');
            this.showNotConnectedState();
        }
    }

    async connectStrava() {
        const clientId = window.CONFIG?.STRAVA?.CLIENT_ID || 'YOUR_STRAVA_CLIENT_ID';
        const redirectUri = window.CONFIG?.STRAVA?.REDIRECT_URI || `${window.location.origin}/route/oauth/`;
        const scope = window.CONFIG?.STRAVA?.SCOPE || 'read,activity:read_all';
        
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocalhost && clientId === 'YOUR_STRAVA_CLIENT_ID') {
            this.showDevInstructions();
            return;
        }
        
        const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
        window.location.href = authUrl;
    }

    showDevInstructions() {
        const instructions = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                <div style="background: #000000; border: 1px solid #333333; padding: 2rem; border-radius: 8px; max-width: 500px; color: white;">
                    <h2 style="color: #ffffff; margin-bottom: 1rem; font-weight: 300;">Development Mode</h2>
                    <p style="margin-bottom: 1rem; opacity: 0.8;">Для работы с Strava OAuth в локальной разработке:</p>
                    <ol style="margin: 1rem 0; padding-left: 1.5rem; opacity: 0.8;">
                        <li>Создайте приложение на <a href="https://www.strava.com/settings/api" target="_blank" style="color: #ffffff; text-decoration: underline;">Strava API Settings</a></li>
                        <li>Установите Authorization Callback Domain: <code style="background: #111111; padding: 0.2rem 0.4rem; border-radius: 2px;">localhost:8000</code></li>
                        <li>Замените YOUR_STRAVA_CLIENT_ID в config.js на ваш Client ID</li>
                        <li>Или используйте ngrok для публичного URL</li>
                    </ol>
                    <p style="margin: 1rem 0; opacity: 0.8;"><strong>Альтернатива:</strong> Нажмите F12, откройте Console и выполните:</p>
                    <code style="background: #111111; padding: 0.5rem; border-radius: 4px; display: block; margin: 0.5rem 0; font-family: monospace; font-size: 0.9rem;">
                        localStorage.setItem('strava_token', 'mock_token'); location.reload();
                    </code>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: #ffffff; color: #000000; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 1rem; cursor: pointer; font-weight: 300;">
                        Понятно
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', instructions);
    }

    async loadWorkouts() {
        try {
            console.log('🔄 Loading workouts...');
            this.showLoadingState();
            const response = await this.fetchStravaData('/athlete/activities?per_page=10');
            console.log('📊 Workouts response:', response);
            
            this.workouts = response.data || [];
            console.log('📋 Workouts loaded:', this.workouts.length);
            
            if (this.workouts.length > 0) {
                this.currentWorkout = this.workouts[0];
                console.log('🎯 Default workout prepared:', this.currentWorkout);
            } else {
                console.log('⚠️ No workouts found');
            }
            
            this.showClubSelectionState();
        } catch (error) {
            console.error('❌ Error loading workouts:', error);
            this.showError('Failed to load workouts. Please try again.');
        }
    }

    async fetchStravaData(endpoint) {
        try {
            const apiUrl = `https://www.strava.com/api/v3${endpoint}`;
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${this.stravaToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('strava_token');
                    this.showError('Session expired. Please connect again');
                    setTimeout(() => {
                        window.location.href = '/route/';
                    }, 2000);
                    throw new Error('Unauthorized');
                }
                throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return { data };
        } catch (error) {
            console.error('❌ Strava API error:', error);
            
            if (error.message !== 'Unauthorized') {
                this.showError('Failed to load data from Strava. Check your internet connection');
            }
            
            // Fallback to mock data for development
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        data: [
                            {
                                id: 1,
                                name: 'Morning Ride',
                                distance: 15000,
                                moving_time: 3600,
                                total_elevation_gain: 500,
                                average_speed: 4.17,
                                average_watts: 180,
                                start_date_local: '2023-09-11T08:00:00Z',
                                map: { polyline: 'mock_polyline_data' }
                            },
                            {
                                id: 2,
                                name: 'Evening Run',
                                distance: 8000,
                                moving_time: 2400,
                                total_elevation_gain: 200,
                                average_speed: 3.33,
                                start_date_local: '2023-09-10T18:30:00Z',
                                map: { polyline: 'mock_polyline_data_2' }
                            }
                        ]
                    });
                }, 1000);
            });
        }
    }

    updateWorkoutDisplay() {
        if (!this.currentWorkout) return;

        // Обновляем значения только для активных метрик
        const state = this.store.getState();
        
        // Обновляем UI элементы на основе состояния store
        this.updateMetricDisplay('distance', state.RideData);
        this.updateMetricDisplay('elevation', state.RideData);
        this.updateMetricDisplay('time', state.RideData);
        this.updateMetricDisplay('speed', state.speedData);
    }
    
    updateMetricDisplay(metricType, dataArray) {
        const metric = dataArray.find(item => 
            item.dataName.toLowerCase().includes(metricType.toLowerCase())
        );
        
        if (metric) {
            const element = document.getElementById(`${metricType}-value`);
            if (element) {
                element.textContent = metric.visible ? metric.data : '';
            }
        }
    }

    // Новый метод рендеринга с использованием addicted Store
    renderWorkout() {
        if (!this.polymerCanvas || !this.currentWorkout) return;
        
        console.log('🎨 Rendering workout with addicted Store');
        
        // Устанавливаем активность в store (как в nextPoly)
        this.store.setActivity(this.currentWorkout);
        
        // Устанавливаем данные маршрута
        const polylineData = this.currentWorkout?.map?.polyline || this.currentWorkout?.map?.summary_polyline;
        if (polylineData) {
            this.polymerCanvas.setPolylineData(polylineData);
        }
        
        console.log('✅ Workout rendered with addicted Store');
    }

    setupEventListeners() {
        // Connect Strava button (теперь в HTML)
        document.getElementById('connect-strava-btn')?.addEventListener('click', () => this.connectStrava());
        
        // File uploads
        document.getElementById('upload-photo-btn')?.addEventListener('click', () => {
            document.getElementById('photo-input').click();
        });
        
        document.getElementById('mono-toggle-btn')?.addEventListener('click', () => {
            this.toggleMonoMode();
        });
        
        document.getElementById('upload-logo-btn')?.addEventListener('click', () => {
            document.getElementById('logo-input').click();
        });
        
        document.getElementById('photo-input')?.addEventListener('change', (e) => {
            this.handlePhotoUpload(e.target.files[0]);
        });
        
        document.getElementById('logo-input')?.addEventListener('change', (e) => {
            this.handleLogoUpload(e.target.files[0]);
        });
        
        // Logo click handler
        document.querySelector('.nav-logo-text')?.addEventListener('click', () => {
            window.location.href = '/';
        });
        
        // Nav buttons
        document.getElementById('workout-selector-btn')?.addEventListener('click', () => {
            this.openWorkoutSelector();
        });
        
        document.getElementById('share-btn')?.addEventListener('click', () => {
            this.downloadCanvas();
        });
        
        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.logout();
        });
        
        // Modal close
        document.getElementById('close-workout-selector')?.addEventListener('click', () => {
            this.closeWorkoutSelector();
        });
        
        document.getElementById('workout-selector-modal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeWorkoutSelector();
            }
        });

        document.getElementById('club-continue-btn')?.addEventListener('click', () => {
            this.handleClubContinue();
        });

        document.getElementById('workout-back-btn')?.addEventListener('click', () => {
            this.showClubSelectionState();
        });
    }

    setupTabs() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Data metric buttons - используем логику nextPoly
        document.querySelectorAll('.data-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const metric = e.target.dataset.metric;
                this.toggleMetricVisibility(metric);
            });
        });

        // Position buttons
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const position = e.target.dataset.position;
                this.setPosition(position);
            });
        });

        // Ratio buttons
        document.querySelectorAll('.ratio-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ratio = e.target.dataset.ratio;
                this.setRatio(ratio);
            });
        });

        // Club buttons
        document.querySelectorAll('.club-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clubId = e.target.dataset.club;
                this.selectClub(clubId);
            });
        });
    }

    initializeRatio() {
        this.setRatio('9:16');
    }

    initializeClub() {
        // Устанавливаем активную кнопку клуба на основе текущего выбора
        const currentClub = this.currentClub || 'not-in-paris';
        document.querySelectorAll('.club-btn').forEach(btn => {
            if (btn.dataset.club === currentClub) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    initializeTemplateTab() {
        this.renderTemplateOptions();
    }

    setupMobileOptimizations() {
        const container = document.getElementById('mobile-container');
        const previewArea = document.querySelector('.preview-area');
        
        if (container && previewArea) {
            container.style.setProperty('width', '100vw', 'important');
            container.style.setProperty('height', '100vh', 'important');
            container.style.setProperty('display', 'flex', 'important');
            container.style.setProperty('flex-direction', 'column', 'important');
            container.style.setProperty('margin', '0', 'important');
            container.style.setProperty('padding', '0', 'important');
            container.style.setProperty('overflow', 'hidden', 'important');
            
            previewArea.style.setProperty('flex', '1', 'important');
            previewArea.style.setProperty('display', 'flex', 'important');
            previewArea.style.setProperty('align-items', 'center', 'important');
            previewArea.style.setProperty('justify-content', 'center', 'important');
        }
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.updateCanvas(), 100);
        });
        
        // Prevent zoom on double tap for mobile
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    setupImageManipulation() {
        if (!this.polymerCanvas) return;
        
        const canvas = this.polymerCanvas.canvas;
        
        // Обработчики для мыши
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Обработчики для touch
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }

    handleMouseDown(e) {
        this.touchState = this.touchState || {};
        this.touchState.isDragging = true;
        this.touchState.lastTouchCenter = { x: e.clientX, y: e.clientY };
        e.preventDefault();
    }

    handleMouseMove(e) {
        if (!this.touchState?.isDragging) return;
        
        const deltaX = e.clientX - this.touchState.lastTouchCenter.x;
        const deltaY = e.clientY - this.touchState.lastTouchCenter.y;
        
        this.touchState.lastTouchCenter = { x: e.clientX, y: e.clientY };
        
        this.polymerCanvas.render();
        e.preventDefault();
    }

    handleMouseUp(e) {
        this.touchState = this.touchState || {};
        this.touchState.isDragging = false;
        e.preventDefault();
    }

    handleWheel(e) {
        this.polymerCanvas.render();
        e.preventDefault();
    }

    handleTouchStart(e) {
        this.touchState = this.touchState || {};
        this.touchState.startTouches = Array.from(e.touches);
        
        if (e.touches.length === 1) {
            this.touchState.isDragging = true;
            this.touchState.lastTouchCenter = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY 
            };
        }
        
        e.preventDefault();
    }

    handleTouchMove(e) {
        if (!this.touchState?.isDragging) return;
        
        if (e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - this.touchState.lastTouchCenter.x;
            const deltaY = e.touches[0].clientY - this.touchState.lastTouchCenter.y;
            
            this.touchState.lastTouchCenter = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY 
            };
            
            this.polymerCanvas.render();
        }
        
        e.preventDefault();
    }

    handleTouchEnd(e) {
        this.touchState = this.touchState || {};
        this.touchState.isDragging = false;
        e.preventDefault();
    }

    setupPhotoButtons() {
        document.getElementById('mono-toggle-btn')?.addEventListener('click', () => {
            // Логика монохромного режима
            console.log('Mono toggle clicked');
        });
    }

    // Tab Management
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.currentTab = tabName;
    }

    // Синхронизация кнопок метрик с состоянием store
    syncMetricButtons() {
        const state = this.store.getState();
        
        console.log('🔄 Syncing metric buttons...');
        console.log('Current state:', {
            RideData: state.RideData.map(item => ({ name: item.dataName, visible: item.visible })),
            speedData: state.speedData.map(item => ({ name: item.dataName, visible: item.visible }))
        });
        
        // Синхронизируем все кнопки метрик
        document.querySelectorAll('.data-btn').forEach(btn => {
            const metric = btn.dataset.metric;
            if (!metric) return;
            
            // Определяем тип данных
            let dataType = 'RideData';
            if (metric === 'speed') {
                dataType = 'speedData';
            }
            
            // Находим соответствующую метрику
            const dataArray = state[dataType];
            const metricItem = dataArray.find(item => 
                item.dataName.toLowerCase().includes(metric.toLowerCase())
            );
            
            if (metricItem) {
                const wasActive = btn.classList.contains('active');
                if (metricItem.visible) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
                const isActive = btn.classList.contains('active');
                
                console.log(`🔄 Syncing ${metricItem.dataName}: visible=${metricItem.visible}, wasActive=${wasActive}, isActive=${isActive}`);
                
                if (wasActive !== isActive) {
                    console.log(`✅ Changed ${metricItem.dataName}: ${metricItem.visible ? 'active' : 'inactive'} (changed from ${wasActive ? 'active' : 'inactive'})`);
                }
            } else {
                // Если метрика не найдена в данных, оставляем кнопку неактивной
                btn.classList.remove('active');
                console.log(`⚠️ Metric ${metric} not found in ${dataType}, button set to inactive`);
            }
        });
        
        console.log('✅ Metric buttons sync complete');
    }

    // Metric Selection - используем логику nextPoly
    toggleMetricVisibility(metric) {
        const state = this.store.getState();
        
        // Определяем тип данных
        let dataType = 'RideData';
        if (metric === 'speed') {
            dataType = 'speedData';
        }
        
        // Находим соответствующую метрику
        const dataArray = state[dataType];
        const metricItem = dataArray.find(item => 
            item.dataName.toLowerCase().includes(metric.toLowerCase())
        );
        
        if (metricItem) {
            console.log(`🔧 Toggling metric: ${metricItem.dataName} (current: ${metricItem.visible})`);
            
            // Используем метод store для переключения видимости
            this.store.toggleVisibility(dataType, metricItem.dataName);
            
            // Обновляем UI после переключения (используем новое состояние)
            const newState = this.store.getState();
            const updatedMetric = newState[dataType].find(item => 
                item.dataName === metricItem.dataName
            );
            
            // Синхронизируем все кнопки после изменения
            this.syncMetricButtons();
            console.log(`✅ Metric ${updatedMetric.dataName} is now ${updatedMetric.visible ? 'visible' : 'hidden'}`);
        } else {
            console.warn(`⚠️ Metric not found: ${metric}`);
            // Если метрика не найдена, просто переключаем состояние кнопки
            const button = document.querySelector(`[data-metric="${metric}"]`);
            if (button) {
                button.classList.toggle('active');
                console.log(`🔄 Button ${metric} toggled (metric not in data)`);
            }
        }
    }

    // Position Setting
    setPosition(position) {
        console.log('Setting position:', position);
    }

    // Ratio Setting
    setRatio(ratio) {
        console.log('Setting ratio:', ratio);
        
        document.querySelectorAll('.ratio-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-ratio="${ratio}"]`)?.classList.add('active');
        
        const connectedState = document.getElementById('connected');
        
        if (connectedState) {
            connectedState.classList.remove('ratio-9-16', 'ratio-4-5');
            
            if (ratio === '9:16') {
                connectedState.classList.add('ratio-9-16');
                console.log('🔧 Установлено соотношение 9:16');
            } else if (ratio === '4:5') {
                connectedState.classList.add('ratio-4-5');
                console.log('🔧 Установлено соотношение 4:5');
            }
        }
        
        // Обновляем конфигурацию канваса
        if (this.polymerCanvas) {
            this.polymerCanvas.updateCanvasConfig(ratio);
            this.polymerCanvas.render();
        }
        
        console.log('🔧 Ratio изменен на:', ratio);
        
        setTimeout(() => {
            this.updateCanvas();
            console.log('🔧 Canvas перерисован после изменения соотношения');
        }, 100);
    }

    // File Upload Handlers
    handlePhotoUpload(file) {
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            this.showError('Please upload an image');
            return;
        }
        
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('File is too large. Max size: 10MB');
            return;
        }
        
        const validExtensions = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validExtensions.includes(file.type)) {
            this.showError('Unsupported image format. Use JPG, PNG, or WEBP');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // Устанавливаем изображение в store
            this.store.setImage(e.target.result);
            
            // Показываем кнопку mono toggle
            const monoBtn = document.getElementById('mono-toggle-btn');
            if (monoBtn) {
                monoBtn.style.display = 'block';
                monoBtn.textContent = 'MAKE MONO';
                monoBtn.classList.remove('active');
            }
            
            console.log('🖼️ Background image updated in store');
        };
        reader.onerror = () => {
            this.showError('Error reading file');
        };
        reader.readAsDataURL(file);
    }

    toggleMonoMode() {
        this.store.toggleMono();
        const state = this.store.getState();
        
        const monoBtn = document.getElementById('mono-toggle-btn');
        if (monoBtn) {
            if (state.isMono) {
                monoBtn.textContent = 'ORIGINAL';
                monoBtn.classList.add('active');
            } else {
                monoBtn.textContent = 'MAKE MONO';
                monoBtn.classList.remove('active');
            }
        }
        
        // Принудительно обновляем канвас после изменения моно режима
        if (this.polymerCanvas) {
            this.polymerCanvas.render();
            console.log(`🔄 Canvas refreshed after mono mode change`);
        }
        
        console.log(`🎨 Mono mode ${state.isMono ? 'enabled' : 'disabled'}`);
    }

    handleLogoUpload(file) {
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            this.showError('Please upload an image');
            return;
        }
        
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('Logo is too large. Max size: 2MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // Здесь можно добавить логику для логотипа
            console.log('Logo updated:', e.target.result);
        };
        reader.onerror = () => {
            this.showError('Error reading logo file');
        };
        reader.readAsDataURL(file);
    }

    showLoadingState() {
        this.stage = 'loading';
        const loading = document.getElementById('loading');
        const notConnected = document.getElementById('not-connected');
        const connected = document.getElementById('connected');
        const clubSelection = document.getElementById('club-selection');
        const workoutSelection = document.getElementById('workout-selection');
        const editingPanel = document.querySelector('.editing-panel');
        const navCenter = document.querySelector('.nav-center');
        const logoutBtn = document.getElementById('logout-btn');

        if (loading) {
            loading.classList.remove('hidden');
            loading.style.display = 'flex';
        }
        if (notConnected) {
            notConnected.classList.add('hidden');
        }
        if (connected) {
            connected.classList.add('hidden');
            connected.style.display = 'none';
        }
        if (clubSelection) {
            clubSelection.classList.add('hidden');
        }
        if (workoutSelection) {
            workoutSelection.classList.add('hidden');
        }
        if (editingPanel) {
            editingPanel.classList.add('hidden');
        }
        if (navCenter) {
            navCenter.classList.remove('visible');
        }
        if (logoutBtn) {
            logoutBtn.classList.add('visible');
        }
    }

    showNotConnectedState() {
        console.log('Showing not connected state');
        this.stage = 'login';
        const loading = document.getElementById('loading');
        const notConnected = document.getElementById('not-connected');
        const connected = document.getElementById('connected');
        const editingPanel = document.querySelector('.editing-panel');
        const previewArea = document.querySelector('.preview-area');
        const navbar = document.querySelector('.navbar');
        const clubSelection = document.getElementById('club-selection');
        const workoutSelection = document.getElementById('workout-selection');
        
        if (loading) loading.classList.add('hidden');
        if (notConnected) notConnected.classList.remove('hidden');
        if (connected) connected.classList.add('hidden');
        if (clubSelection) clubSelection.classList.add('hidden');
        if (workoutSelection) workoutSelection.classList.add('hidden');
        if (editingPanel) editingPanel.classList.add('hidden'); // Скрываем панель редактирования
        // Превью на полный экран (минус navbar)
        if (previewArea) {
            const navbarHeight = navbar ? Math.round(navbar.getBoundingClientRect().height) : 64;
            previewArea.style.bottom = '0';
            previewArea.style.height = `calc(100vh - ${navbarHeight}px)`;
            previewArea.style.paddingTop = '16px';
            previewArea.style.paddingBottom = '16px';
            previewArea.style.boxSizing = 'border-box';
        }
        
        // Скрываем иконки в навбаре
        const navCenter = document.querySelector('.nav-center');
        if (navCenter) {
            navCenter.classList.remove('visible');
            console.log('✅ Nav center icons hidden');
        }
        
        // Скрываем кнопку logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.classList.remove('visible');
            console.log('✅ Logout button hidden');
        }
        
        // Кнопка теперь в HTML, не создаем её динамически
    }

    showClubSelectionState() {
        console.log('Showing club selection state');
        this.stage = 'club-selection';
        const loading = document.getElementById('loading');
        const notConnected = document.getElementById('not-connected');
        const connected = document.getElementById('connected');
        const clubSelection = document.getElementById('club-selection');
        const workoutSelection = document.getElementById('workout-selection');
        const editingPanel = document.querySelector('.editing-panel');
        const previewArea = document.querySelector('.preview-area');
        const navbar = document.querySelector('.navbar');
        const navCenter = document.querySelector('.nav-center');
        const logoutBtn = document.getElementById('logout-btn');

        if (loading) {
            loading.classList.add('hidden');
            loading.style.display = 'none';
        }
        if (notConnected) {
            notConnected.classList.add('hidden');
        }
        if (connected) {
            connected.classList.add('hidden');
            connected.style.display = 'none';
        }
        if (workoutSelection) {
            workoutSelection.classList.add('hidden');
        }
        if (clubSelection) {
            clubSelection.classList.remove('hidden');
        }
        if (editingPanel) {
            editingPanel.classList.add('hidden');
        }
        if (previewArea && navbar) {
            const navbarHeight = Math.round(navbar.getBoundingClientRect().height);
            previewArea.style.bottom = '0';
            previewArea.style.height = `calc(100vh - ${navbarHeight}px)`;
        }
        if (navCenter) {
            navCenter.classList.remove('visible');
        }
        if (logoutBtn) {
            logoutBtn.classList.add('visible');
        }
        if (navbar) {
            navbar.style.display = 'flex';
            navbar.style.visibility = 'visible';
            navbar.style.opacity = '1';
            navbar.classList.remove('hidden');
        }

        this.initializeClub();
        this.updateClubContinueButton();
    }

    handleClubContinue() {
        if (!this.currentClub) {
            return;
        }

        if (!this.workouts.length) {
            this.showError('No workouts available yet. Sync with Strava and try again.');
            return;
        }

        this.trackAnalytics('club_selected', {
            club_id: this.currentClub
        });

        this.showWorkoutSelectionState();
    }

    showWorkoutSelectionState() {
        console.log('Showing workout selection state');
        this.stage = 'workout-selection';
        const loading = document.getElementById('loading');
        const notConnected = document.getElementById('not-connected');
        const connected = document.getElementById('connected');
        const clubSelection = document.getElementById('club-selection');
        const workoutSelection = document.getElementById('workout-selection');
        const editingPanel = document.querySelector('.editing-panel');
        const previewArea = document.querySelector('.preview-area');
        const navbar = document.querySelector('.navbar');
        const navCenter = document.querySelector('.nav-center');
        const logoutBtn = document.getElementById('logout-btn');

        if (loading) {
            loading.classList.add('hidden');
            loading.style.display = 'none';
        }
        if (notConnected) {
            notConnected.classList.add('hidden');
        }
        if (connected) {
            connected.classList.add('hidden');
            connected.style.display = 'none';
        }
        if (clubSelection) {
            clubSelection.classList.add('hidden');
        }
        if (workoutSelection) {
            workoutSelection.classList.remove('hidden');
        }
        if (editingPanel) {
            editingPanel.classList.add('hidden');
        }
        if (previewArea && navbar) {
            const navbarHeight = Math.round(navbar.getBoundingClientRect().height);
            previewArea.style.bottom = '0';
            previewArea.style.height = `calc(100vh - ${navbarHeight}px)`;
        }
        if (navCenter) {
            navCenter.classList.remove('visible');
        }
        if (logoutBtn) {
            logoutBtn.classList.add('visible');
        }
        if (navbar) {
            navbar.style.display = 'flex';
            navbar.style.visibility = 'visible';
            navbar.style.opacity = '1';
            navbar.classList.remove('hidden');
        }

        this.populateWorkoutSelectionList();
    }

    updateClubContinueButton() {
        const continueBtn = document.getElementById('club-continue-btn');
        if (!continueBtn) return;

        if (this.currentClub) {
            continueBtn.disabled = false;
            continueBtn.classList.add('active');
        } else {
            continueBtn.disabled = true;
            continueBtn.classList.remove('active');
        }
    }

    populateWorkoutSelectionList() {
        const selectionList = document.getElementById('workout-selection-list');
        this.renderWorkoutList(selectionList, { ctaLabel: 'Load' });
    }

    renderWorkoutList(container, options = {}) {
        if (!container) return;

        const { ctaLabel = 'Apply' } = options;

        if (!this.workouts.length) {
            container.innerHTML = '<p style="text-align: center; opacity: 0.7;">No workouts available</p>';
            return;
        }

        container.innerHTML = this.workouts.map((workout) => `
            <div class="workout-item ${workout.id === this.currentWorkout?.id ? 'active' : ''}" 
                 data-workout-id="${workout.id}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                    <div style="flex: 1;">
                        <h4 class="workout-name">${workout.name || 'Unnamed Workout'}</h4>
                        <div class="workout-stats">
                            <div class="workout-stat">
                                <span class="workout-stat-label">Distance</span>
                                <span class="workout-stat-value">${this.formatDistance(workout.distance)}</span>
                            </div>
                            <div class="workout-stat">
                                <span class="workout-stat-label">Elevation</span>
                                <span class="workout-stat-value">${this.formatElevation(workout.total_elevation_gain)}</span>
                            </div>
                            <div class="workout-stat">
                                <span class="workout-stat-label">Time</span>
                                <span class="workout-stat-value">${this.formatTime(workout.moving_time)}</span>
                            </div>
                        </div>
                    </div>
                    <div style="margin-left: 10px; padding: 8px 12px; background: #333; color: #fff; border-radius: 4px; font-size: 12px; white-space: nowrap; opacity: 0.7;">
                        ${ctaLabel}
                    </div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.workout-item').forEach(item => {
            item.addEventListener('click', (e) => {
                console.log('🖱️ Workout item clicked:', e.target);
                const workoutId = Number(item.dataset.workoutId);
                console.log('🆔 Workout ID:', workoutId);
                this.selectWorkout(workoutId);
            });

            item.addEventListener('mousedown', () => {
                item.style.backgroundColor = '#333333';
            });

            item.addEventListener('mouseup', () => {
                item.style.backgroundColor = '';
            });

            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });
        });
    }

    renderTemplateOptions() {
        const container = document.getElementById('template-options');
        const label = document.getElementById('template-selected-label');
        if (!container) return;

        const templates = this.getTemplatesForCurrentClub();
        if (!templates.length) {
            container.innerHTML = `
                <div class="template-card" style="cursor: default; opacity: 0.6;">
                    <div class="template-card-header">
                        <span class="template-name">No templates yet</span>
                        <span class="template-badge">—</span>
                    </div>
                    <p class="template-description">Select a club to access design presets.</p>
                </div>
            `;
            if (label) {
                label.textContent = 'Select a club first';
            }
            return;
        }

        container.innerHTML = templates.map(template => `
            <div class="template-card ${template.id === this.currentTemplate ? 'active' : ''}" data-template-id="${template.id}">
                <div class="template-card-header">
                    <span class="template-name">${template.name}</span>
                    ${template.badge ? `<span class="template-badge">${template.badge}</span>` : ''}
                </div>
                <p class="template-description">${template.description}</p>
            </div>
        `).join('');

        this.attachTemplateEvents();

        const matchedTemplate = templates.find(t => t.id === this.currentTemplate);
        if (!matchedTemplate && templates.length) {
            this.selectTemplate(templates[0].id, { track: false });
        } else {
            this.highlightTemplate(this.currentTemplate);
            if (matchedTemplate) {
                this.applyTemplateConfig(matchedTemplate, { skipHighlight: true, track: false });
            }
        }
    }

    attachTemplateEvents() {
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (event) => {
                const templateId = event.currentTarget.dataset.templateId;
                this.selectTemplate(templateId);
            });
        });
    }

    selectTemplate(templateId, options = {}) {
        const { track = true } = options;
        const templates = this.getTemplatesForCurrentClub();
        const template = templates.find(item => item.id === templateId);

        if (!template) {
            console.warn('Template not found for ID:', templateId);
            return;
        }

        if (this.currentTemplate === templateId && !options.force) {
            this.highlightTemplate(templateId);
            return;
        }

        this.currentTemplate = templateId;
        try {
            localStorage.setItem('selected_template', templateId);
        } catch (e) {
            console.warn('Unable to persist selected_template:', e);
        }

        this.applyTemplateConfig(template, { ...options, skipHighlight: true });
        this.highlightTemplate(templateId);

        if (track) {
            this.trackAnalytics('template_selected', {
                template_id: templateId,
                club_id: this.currentClub
            });
        }
    }

    highlightTemplate(templateId) {
        const templates = this.getTemplatesForCurrentClub();
        const cards = document.querySelectorAll('.template-card');
        let activeTemplate = null;

        cards.forEach(card => {
            const isActive = card.dataset.templateId === templateId;
            if (isActive) {
                card.classList.add('active');
                activeTemplate = templates.find(t => t.id === templateId) || null;
            } else {
                card.classList.remove('active');
            }
        });

        const label = document.getElementById('template-selected-label');
        if (label) {
            if (activeTemplate) {
                label.textContent = activeTemplate.name;
            } else if (!templates.length) {
                label.textContent = 'Select a club first';
            } else {
                label.textContent = 'Choose template';
            }
        }
    }

    applyTemplateConfig(template, options = {}) {
        if (!template) return;

        const { skipHighlight = false } = options;

        if (this.store?.setTemplate) {
            this.store.setTemplate(template.id);
        }

        if (template.config) {
            if (template.config.backgroundMode && this.store?.setBackgroundMode) {
                this.store.setBackgroundMode(template.config.backgroundMode);
            }
            if (template.config.fontColor && this.store?.setFontColor) {
                this.store.setFontColor(template.config.fontColor);
            }
            if (typeof template.config.isMono === 'boolean' && this.store?.setMonoMode) {
                this.store.setMonoMode(template.config.isMono);
            }
        }

        if (!skipHighlight) {
            this.highlightTemplate(template.id);
        }

        if (this.polymerCanvas) {
            this.polymerCanvas.render();
        }
    }

    getTemplatesForCurrentClub() {
        return this.templatesByClub[this.currentClub] || [];
    }

    getTemplateById(templateId) {
        const templates = this.templatesByClub[this.currentClub] || [];
        return templates.find(template => template.id === templateId) || null;
    }

    showConnectedState() {
        console.log('Showing connected state');
        this.stage = 'editor';
        const loading = document.getElementById('loading');
        const notConnected = document.getElementById('not-connected');
        const connected = document.getElementById('connected');
        const previewArea = document.querySelector('.preview-area');
        const clubSelection = document.getElementById('club-selection');
        const workoutSelection = document.getElementById('workout-selection');
        
        console.log('🔍 Elements found:', {
            loading: !!loading,
            notConnected: !!notConnected,
            connected: !!connected
        });
        
        if (loading) {
            loading.classList.add('hidden');
            loading.style.display = 'none';
            console.log('✅ Loading hidden');
        }
        if (notConnected) {
            notConnected.classList.add('hidden');
            notConnected.style.display = 'none';
            console.log('✅ Not connected hidden');
            
            const connectBtn = document.getElementById('connect-strava-btn');
            if (connectBtn) {
                connectBtn.style.display = 'none';
                console.log('✅ Connect button hidden');
            }
        }
        if (clubSelection) {
            clubSelection.classList.add('hidden');
        }
        if (workoutSelection) {
            workoutSelection.classList.add('hidden');
        }
        if (connected) {
            connected.classList.remove('hidden');
            connected.style.display = 'flex';
            console.log('✅ Connected shown');
            
        // Показываем панель редактирования
        const editingPanel = document.querySelector('.editing-panel');
        if (editingPanel) {
            editingPanel.classList.remove('hidden');
            console.log('✅ Editing panel shown');
        }

        this.renderTemplateOptions();
        if (this.currentTemplate) {
            this.highlightTemplate(this.currentTemplate);
        }
        
        // Синхронизируем кнопки метрик с текущим состоянием
        this.syncMetricButtons();
        
        // Показываем иконки в навбаре
        const navCenter = document.querySelector('.nav-center');
        if (navCenter) {
            navCenter.classList.add('visible');
            console.log('✅ Nav center icons shown');
        }
        
        // Показываем кнопку logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.classList.add('visible');
            console.log('✅ Logout button shown');
        }
            
        const navbar = document.querySelector('.navbar');
            if (navbar) {
                navbar.style.display = 'flex';
                navbar.style.visibility = 'visible';
                navbar.style.opacity = '1';
                navbar.classList.remove('hidden');
                console.log('✅ Navbar shown');
            } else {
                console.log('❌ Navbar not found!');
            }
            
            setTimeout(() => {
                // Кнопки теперь в HTML, не создаем их динамически
                
                // Обработчики событий уже добавлены в setupEventListeners
                
                const navbar = document.querySelector('.navbar');
                const navContainer = document.querySelector('.nav-container');
                
                console.log('🔍 Navigation structure:', {
                    navbar: !!navbar,
                    navContainer: !!navContainer
                });
                
                // Кнопки теперь в HTML, не требуют динамического управления
            }, 500);
            
            // Убираем жестко заданные стили, позволяем CSS классам управлять соотношением сторон
            connected.style.removeProperty('aspect-ratio');
            connected.style.setProperty('max-height', '100%', 'important');
            connected.style.setProperty('overflow', 'hidden', 'important');
            connected.style.setProperty('box-sizing', 'border-box', 'important');
            connected.style.setProperty('width', '100%', 'important');
            connected.style.setProperty('height', '100%', 'important');
            connected.style.setProperty('display', 'flex', 'important');

            // Восстанавливаем исходную высоту превью под панель редактирования
            if (previewArea) {
                previewArea.style.bottom = '180px';
                previewArea.style.height = 'calc(100vh - 64px - 180px)';
            }
            
            console.log('🔧 Connected state показан');
            
            setTimeout(() => {
                this.updateCanvas();
                console.log('🔧 Canvas перерисован при показе connected state');
            }, 100);
            
            console.log('🔧 Connected state с правильными пропорциями 9:16');
            
            setTimeout(() => {
                console.log('🔄 Force refresh after connected state');
                this.updateWorkoutDisplay();
                this.renderWorkout();
                
                document.body.offsetHeight;
                console.log('🔄 DOM forced reflow');
            }, 200);
        }
    }

    showError(message) {
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isDev) {
            alert(message);
        } else {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: #f44336;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 90%;
                text-align: center;
                animation: slideDown 0.3s ease-out;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideUp 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
    }

    // Workout Selector Modal
    openWorkoutSelector() {
        const modal = document.getElementById('workout-selector-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.updateStravaLink();
            this.populateWorkoutList();
        }
    }

    updateStravaLink() {
        const stravaLink = document.getElementById('strava-link');
        if (stravaLink && this.currentWorkout && this.currentWorkout.id) {
            stravaLink.href = `https://www.strava.com/activities/${this.currentWorkout.id}`;
            stravaLink.style.display = 'block';
        } else if (stravaLink) {
            stravaLink.style.display = 'none';
        }
    }

    closeWorkoutSelector() {
        const modal = document.getElementById('workout-selector-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async selectClub(clubId) {
        console.log('🏢 Selecting club:', clubId);
        this.currentClub = clubId;
        localStorage.setItem('selected_club', clubId);
        
        // Обновляем активные кнопки
        document.querySelectorAll('.club-btn').forEach(btn => {
            if (btn.dataset.club === clubId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Обновляем клуб в store
        if (this.store) {
            this.store.setClub(clubId);
        }

        // Загружаем шаблоны для нового клуба
        await this.loadTemplates();
        
        this.ensureTemplateConsistency();
        this.renderTemplateOptions();
        if (this.currentTemplate) {
            this.highlightTemplate(this.currentTemplate);
        }
        
        // Перерисовываем canvas с новым цветом маршрута
        if (this.polymerCanvas) {
            this.polymerCanvas.render();
        }

        this.updateClubContinueButton();
        
        console.log('✅ Club selected:', clubId);
    }

    populateWorkoutList() {
        const workoutList = document.getElementById('workout-list');
        if (!workoutList) return;

        this.renderWorkoutList(workoutList, { ctaLabel: 'Apply' });
        this.updateStravaLink();
    }

    selectWorkout(workoutId) {
        console.log('🎯 selectWorkout called with ID:', workoutId);
        console.log('📋 Available workouts:', this.workouts.map(w => ({ id: w.id, name: w.name })));
        
        const workout = this.workouts.find(w => w.id === workoutId);
        if (workout) {
            console.log('✅ Found workout:', workout.name);
            this.currentWorkout = workout;
            this.updateWorkoutDisplay();
            this.renderWorkout();
            if (this.stage === 'workout-selection') {
                this.trackAnalytics('workout_selected', {
                    workout_id: workout.id
                });
                this.showConnectedState();
            }
            this.closeWorkoutSelector();
            console.log('🏃 Selected workout:', workout.name);
        } else {
            console.error('❌ Workout not found with ID:', workoutId);
        }
    }

    // Share functionality
    shareData() {
        if (!this.currentWorkout) {
            this.showError('No workout data to share');
            return;
        }

        const shareText = `Check out my workout: ${this.currentWorkout.name || 'Workout'} - ${this.formatDistance(this.currentWorkout.distance)}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'addicted Workout',
                text: shareText,
                url: window.location.href
            }).then(() => {
                console.log('📤 Shared successfully');
            }).catch((error) => {
                console.log('Error sharing:', error);
                this.fallbackShare(shareText);
            });
        } else {
            this.fallbackShare(shareText);
        }
    }

    fallbackShare(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Workout info copied to clipboard!');
            }).catch(() => {
                alert(text);
            });
        } else {
            alert(text);
        }
    }

    downloadCanvas() {
        if (!this.polymerCanvas) {
            this.showError('Canvas not available');
            return;
        }
        
        const canvas = this.polymerCanvas.canvas;
        if (!canvas) {
            this.showError('Canvas not found');
            return;
        }

        // Track download event
        this.trackAnalytics('download', {
            file_format: 'png'
        });

        const filename = `addicted-workout-${new Date().toISOString().split('T')[0]}.png`;

        // Device / browser detection
        const userAgent = navigator.userAgent || '';
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroid = /Android/.test(userAgent);
        const isMobile = /Mobi|Mobile|Android|iPhone|iPad|iPod/i.test(userAgent) || isIOS || isAndroid;
        const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);

        const canUseFileShare = (() => {
            if (typeof navigator === 'undefined') return false;
            if (!navigator.canShare || !navigator.share) return false;
            try {
                const testFile = new File([""], "test.png", { type: "image/png" });
                return navigator.canShare({ files: [testFile] });
            } catch (e) {
                return false;
            }
        })();

        // Prefer toBlob to avoid data URL size limits and improve compatibility
        if (canvas.toBlob) {
            canvas.toBlob((blob) => {
                if (!blob) {
                    // Fallback to data URL if blob creation failed
                    const dataUrlFallback = canvas.toDataURL('image/png');
                    this.triggerDataUrlDownload(dataUrlFallback, filename, isMobile && (isSafari || isIOS));
                    return;
                }

                // Try Web Share API with files (iOS/Android modern browsers)
                if (isMobile && canUseFileShare) {
                    try {
                        const file = new File([blob], filename, { type: 'image/png' });
                        const shareData = {
                            files: [file],
                            title: 'addicted route',
                            text: 'Route preview from addicted.design'
                        };
                        navigator.share(shareData)
                            .then(() => console.log('📤 Canvas shared via Web Share API'))
                            .catch((shareError) => {
                                if (shareError?.name === 'AbortError') {
                                    console.log('ℹ️ Share cancelled by user');
                                } else {
                                    console.warn('⚠️ Share failed, fallback to download:', shareError);
                                    this.triggerBlobDownload(blob, filename);
                                }
                            });
                        return;
                    } catch (err) {
                        console.warn('⚠️ Web Share not available, fallback to download:', err);
                        // proceed to default download
                    }
                }

                // For Safari/iOS fallback to opening data URL in new tab to allow "Save Image"
                if (isMobile && (isSafari || isIOS)) {
                    const dataUrl = canvas.toDataURL('image/png');
                    this.triggerDataUrlDownload(dataUrl, filename, true);
                    return;
                }

                if (isMobile && isAndroid) {
                    // Modern Chrome/Android handles direct download fine
                    this.triggerBlobDownload(blob, filename);
                    return;
                }

                if (!isMobile) {
                    // Desktop experience: save directly to Downloads
                    this.triggerBlobDownload(blob, filename);
                    return;
                }

                // Generic mobile fallback
                this.triggerBlobDownload(blob, filename);
            }, 'image/png', 0.95);
        } else {
            // Safari/iOS often blocks programmatic downloads of blob URLs or toBlob not supported
            const dataUrl = canvas.toDataURL('image/png');
            this.triggerDataUrlDownload(dataUrl, filename, isSafari || isIOS);
        }
    }

    triggerBlobDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        console.log('📥 Canvas downloaded via blob URL');
    }

    triggerDataUrlDownload(dataUrl, filename, openInNewTab = false) {
        if (openInNewTab) {
            window.open(dataUrl, '_blank', 'noopener');
        } else {
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        console.log('📥 Canvas downloaded via data URL fallback');
    }
    
    shareToInstagram() {
        if (!this.polymerCanvas) {
            this.showError('Canvas not available');
            return;
        }
        
        const canvas = this.polymerCanvas.canvas;
        if (!canvas) {
            this.showError('Canvas not found');
            return;
        }
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (!blob) {
                this.showError('Failed to create image');
                return;
            }
            
            // Create a temporary URL for the blob
            const url = URL.createObjectURL(blob);
            
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.download = `addicted-workout-${new Date().toISOString().split('T')[0]}.png`;
            
            // Trigger download first
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            // Show instructions
            alert('Image downloaded! Now you can:\n\n1. Open Instagram Stories\n2. Add the downloaded image\n3. Share your workout!');
            
            console.log('📱 Instagram share prepared');
        }, 'image/png', 0.9);
    }

    logout() {
        this.stage = 'login';
        localStorage.removeItem('strava_token');
        
        this.stravaToken = null;
        this.currentWorkout = null;
        this.workouts = [];
        
        document.getElementById('connected')?.classList.add('hidden');
        document.getElementById('not-connected')?.classList.remove('hidden');
        
        // Автоматически обновляем страницу для возврата к экрану входа
        setTimeout(() => {
            window.location.reload();
        }, 100);
        
        // Кнопка теперь в HTML, не создаем её динамически
        
        if (this.polymerCanvas && this.polymerCanvas.ctx) {
            this.polymerCanvas.ctx.clearRect(0, 0, this.polymerCanvas.canvas.width, this.polymerCanvas.canvas.height);
        }
        
        console.log('Logged out successfully');
    }

    // Utility methods
    formatDistance(meters) {
        if (!meters || meters === 0) return '—';
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)} km`;
        }
        return `${meters} m`;
    }

    formatElevation(meters) {
        if (!meters || meters === 0) return '—';
        return `${meters} m`;
    }

    formatTime(seconds) {
        if (!seconds || seconds === 0) return '—';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
}

// Initialize app when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, initializing SznApp with addicted Logic');
            const app = new SznApp();
            // Дополнительная подстройка после отрисовки DOM: ещё раз проставим размер канваса
            setTimeout(() => app.updateCanvas(), 0);
        });

// Force show not connected state if no token
if (!localStorage.getItem('strava_token')) {
    console.log('No token found, forcing not connected state');
    setTimeout(() => {
        const loading = document.getElementById('loading');
        const notConnected = document.getElementById('not-connected');
        if (loading) loading.classList.add('hidden');
        if (notConnected) notConnected.classList.remove('hidden');
    }, 100);
}

// Handle OAuth callback
if (window.location.pathname.includes('/oauth/')) {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        console.log('OAuth code received:', code);
        localStorage.setItem('strava_token', 'mock_token');
        window.location.href = '/rout/';
    }
}
