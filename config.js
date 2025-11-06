// addicted Web - Configuration
// Update these values for your environment

const CONFIG = {
    // Strava API Configuration
    STRAVA: {
        CLIENT_ID: 'YOUR_STRAVA_CLIENT_ID', // Replace with your Strava Client ID
        CLIENT_SECRET: 'YOUR_STRAVA_CLIENT_SECRET', // Replace with your Strava Client Secret
        REDIRECT_URI: window.location.origin + '/route/oauth/',
        SCOPE: 'read,activity:read_all',
        API_BASE_URL: 'https://www.strava.com/api/v3'
    },
    
    // Environment Settings
    ENV: {
        PRODUCTION: window.location.hostname !== 'localhost',
        DEBUG: window.location.hostname === 'localhost', // Enable console logging in dev only
        MOCK_DATA: false // Set to true for testing without real Strava API calls
    },
    
    // App Settings
    APP: {
        NAME: 'addicted',
        VERSION: '1.0.0',
        DEFAULT_WORKOUTS_COUNT: 10
    }
};

// Development helpers
if (CONFIG.ENV.DEBUG) {
    console.log('🔧 addicted Web - Development Mode');
    console.log('📋 Configuration:', CONFIG);
}

// No auto-connect - user must explicitly connect via Strava

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
