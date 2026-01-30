// login.js - COMPLETE VERSION WITH STYLED DROPDOWN
const API_URL = 'https://pazzle-store-api.mus00204.workers.dev/php/api';

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Login system loaded');
    
    // Check if user is already logged in
    checkLoginStatus();
    
    // Make user area clickable
    makeUserAreaClickable();
    
    // Setup enter key
    setupEnterKey();
    
    // Protect password.html if accessed directly
    protectPasswordPage();
});

function protectPasswordPage() {
    // Only run on password.html page
    if (window.location.pathname.includes('password.html')) {
        const session = localStorage.getItem('user_session');
        if (!session) {
            // Redirect to main page if not logged in
            window.location.href = '/hex/';
            return;
        }
        
        // Verify user ID in URL matches session
        const urlParams = new URLSearchParams(window.location.search);
        const urlUserId = urlParams.get('user');
        
        if (urlUserId) {
            try {
                const userData = JSON.parse(session);
                if (userData.user_id != urlUserId) {
                    // User ID mismatch, redirect to main page
                    window.location.href = '/hex/';
                }
            } catch (e) {
                window.location.href = '/hex/';
            }
        }
    }
}

function checkLoginStatus() {
    const session = localStorage.getItem('user_session');
    if (session) {
        try {
            const userData = JSON.parse(session);
            updateUserInterface(userData);
            console.log('User is logged in:', userData);
        } catch (e) {
            console.error('Error parsing session:', e);
            localStorage.removeItem('user_session');
        }
    }
}

function makeUserAreaClickable() {
    // Only target specific elements, NOT the entire user-settings container
    const userElements = document.querySelectorAll('.user-name, .user-img');
    userElements.forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Check if user is logged in
            const session = localStorage.getItem('user_session');
            if (session) {
                // User is logged in - show dropdown
                toggleUserDropdown();
            } else {
                // User is not logged in - show login modal
                showLoginModal();
            }
        });
    });
    
    // Also make the user-settings container clickable but not notification area
    const userSettings = document.querySelector('.user-settings');
    if (userSettings) {
        userSettings.style.cursor = 'pointer';
        userSettings.addEventListener('click', function(e) {
            // Check if click is on notification area
            if (e.target.closest('.notify') || e.target.closest('.notification')) {
                return; // Don't show dropdown for notification clicks
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            const session = localStorage.getItem('user_session');
            if (session) {
                toggleUserDropdown();
            } else {
                showLoginModal();
            }
        });
    }
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-name') && 
            !e.target.closest('.user-img') && 
            !e.target.closest('.user-settings') && 
            !e.target.closest('.user-dropdown')) {
            hideUserDropdown();
        }
    });
}

function setupEnterKey() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const modal = document.getElementById('loginModal');
            if (modal && modal.style.display !== 'none') {
                handleLoginSubmit();
            }
        }
    });
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Reset everything
        const mainInput = document.getElementById('loginMainInput');
        const passwordInput = document.getElementById('loginPasswordInput');
        const passwordContainer = document.getElementById('passwordFieldContainer');
        const messageDiv = document.getElementById('loginMessage');
        const btn = document.getElementById('loginSubmitBtn');
        
        if (mainInput) {
            mainInput.value = '';
            setTimeout(() => mainInput.focus(), 100);
        }
        if (passwordInput) passwordInput.value = '';
        if (passwordContainer) passwordContainer.style.display = 'none';
        if (messageDiv) {
            messageDiv.style.display = 'none';
            messageDiv.textContent = '';
        }
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'CONTINUE';
        }
    }
}

function hidePasswordField() {
    const passwordContainer = document.getElementById('passwordFieldContainer');
    if (passwordContainer) {
        passwordContainer.style.display = 'none';
    }
}

function showPasswordField() {
    const passwordContainer = document.getElementById('passwordFieldContainer');
    if (passwordContainer) {
        passwordContainer.style.display = 'block';
        const passwordInput = document.getElementById('loginPasswordInput');
        if (passwordInput) passwordInput.focus();
    }
}

function showMessage(text, type = 'info') {
    const messageDiv = document.getElementById('loginMessage');
    if (!messageDiv) return;
    
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
    
    switch(type) {
        case 'success':
            messageDiv.style.background = 'rgba(46, 204, 113, 0.1)';
            messageDiv.style.color = '#2ecc71';
            messageDiv.style.border = '1px solid rgba(46, 204, 113, 0.2)';
            break;
        case 'error':
            messageDiv.style.background = 'rgba(231, 76, 60, 0.1)';
            messageDiv.style.color = '#e74c3c';
            messageDiv.style.border = '1px solid rgba(231, 76, 60, 0.2)';
            break;
        case 'warning':
            messageDiv.style.background = 'rgba(241, 196, 15, 0.1)';
            messageDiv.style.color = '#f1c40f';
            messageDiv.style.border = '1px solid rgba(241, 196, 15, 0.2)';
            break;
        default:
            messageDiv.style.background = 'rgba(52, 152, 219, 0.1)';
            messageDiv.style.color = '#3498db';
            messageDiv.style.border = '1px solid rgba(52, 152, 219, 0.2)';
    }
}

async function handleLoginSubmit() {
    const identifier = document.getElementById('loginMainInput')?.value.trim() || '';
    const password = document.getElementById('loginPasswordInput')?.value || '';
    const btn = document.getElementById('loginSubmitBtn');
    
    if (!identifier) {
        showMessage('Please enter phone (05XXXXXXXX) or email', 'error');
        return;
    }
    
    // Validate input
    const isPhone = /^0\d{9}$/.test(identifier);
    const isEmail = identifier.includes('@') && identifier.includes('.');
    
    if (!isPhone && !isEmail) {
        if (identifier.startsWith('0')) {
            showMessage('Phone must be 10 digits (05XXXXXXXX)', 'error');
        } else {
            showMessage('Please enter valid phone or email', 'error');
        }
        return;
    }
    
    // Disable button and show loading
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⟳</span> Processing...';
    }
    
    try {
        if (!password) {
            // STEP 1: User is trying to signup or login (no password yet)
            console.log('Checking user:', identifier);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'signup_user',
                    identifier: identifier
                })
            });
            
            // Get raw response first
            const rawText = await response.text();
            console.log('Raw response:', rawText);
            
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.error('JSON parse error:', e);
                showMessage('Server error. Please try again.', 'error');
                return;
            }
            
            console.log('Parsed data:', data);
            
            if (data.success) {
                if (data.exists) {
                    // CASE 1: User EXISTS in system
                    showMessage('✅ User exists. Please enter your password.', 'info');
                    showPasswordField();
                    
                    // Update button text
                    if (btn) {
                        btn.textContent = 'LOGIN';
                    }
                    
                } else if (data.new_user) {
                    // CASE 2: NEW user created
                    if (isPhone) {
                        showMessage(`✅ Account created! Password sent to admin. They will SMS you shortly.`, 'success');
                    } else {
                        showMessage(`✅ Account created! Password sent to your email.`, 'success');
                    }
                    
                    // Show password field and auto-fill password
                    showPasswordField();
                    const passwordInput = document.getElementById('loginPasswordInput');
                    if (passwordInput && data.password) {
                        passwordInput.value = data.password;
                        passwordInput.focus();
                    }
                    
                    // Update button text
                    if (btn) {
                        btn.textContent = 'LOGIN WITH PASSWORD';
                    }
                    
                } else {
                    // CASE 3: Should not happen
                    showMessage('Please try again.', 'error');
                }
                
            } else {
                // CASE 4: User NOT found in system (error from API)
                showMessage('❌ ' + (data.error || 'User not found in system'), 'error');
                hidePasswordField();
            }
            
        } else {
            // STEP 2: User is trying to LOGIN with password
            console.log('Validating login with password');
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'validate_login',
                    identifier: identifier,
                    password: password
                })
            });
            
            const data = await response.json();
            console.log('Login validation:', data);
            
            if (data.success) {
                // LOGIN SUCCESS
                showMessage('✅ Login successful! Welcome!', 'success');
                
                // Store session with first_name
                localStorage.setItem('user_session', JSON.stringify({
                    user_id: data.user_id,
                    session_token: data.session_token,
                    phone: data.phone,
                    email: data.email,
                    first_name: data.first_name || data.phone?.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') || data.email?.split('@')[0] || 'User',
                    expires: data.expires
                }));
                
                // Update user interface
                updateUserInterface({
                    user_id: data.user_id,
                    phone: data.phone,
                    email: data.email,
                    first_name: data.first_name || data.phone?.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') || data.email?.split('@')[0] || 'User'
                });
                
                // Close modal after delay (NO REDIRECT)
                setTimeout(() => {
                    const modal = document.getElementById('loginModal');
                    if (modal) modal.style.display = 'none';
                    
                    // Create dropdown menu if it doesn't exist
                    createUserDropdown();
                }, 1500);
                
            } else {
                showMessage('❌ ' + (data.error || 'Incorrect password'), 'error');
            }
        }
        
    } catch (error) {
        console.error('Network error:', error);
        showMessage('❌ Network error. Please check connection.', 'error');
    } finally {
        // Reset button
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'CONTINUE';
        }
    }
}

function updateUserInterface(userData) {
    // Update user name in header
    const userName = document.querySelector('.user-name');
    if (userName && userData.first_name) {
        userName.textContent = userData.first_name;
    } else if (userName && userData.phone) {
        userName.textContent = userData.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (userName && userData.email) {
        userName.textContent = userData.email.split('@')[0];
    }
    
    // Update user image tooltip
    const userImg = document.querySelector('.user-img');
    if (userImg && userData.first_name) {
        userImg.title = `Logged in as ${userData.first_name}`;
    } else if (userImg) {
        userImg.title = `Logged in as ${userData.phone || userData.email}`;
    }
    
    // Create dropdown menu
    createUserDropdown();
}

function createUserDropdown() {
    // Remove existing dropdown if any
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    // Get user data
    const session = localStorage.getItem('user_session');
    if (!session) return;
    
    const userData = JSON.parse(session);
    
    // Find user settings container for positioning
    const userSettings = document.querySelector('.user-settings');
    if (!userSettings) return;
    
    // Get position
    const rect = userSettings.getBoundingClientRect();
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.style.cssText = `
        position: fixed;
        top: ${rect.bottom + window.scrollY}px;
        right: ${window.innerWidth - rect.right}px;
        background: #1a1a2e;
        border: 1px solid rgba(108, 92, 231, 0.3);
        border-radius: 12px;
        padding: 8px 0;
        min-width: 220px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        z-index: 1000;
        display: none;
        backdrop-filter: blur(10px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    
    dropdown.innerHTML = `
        <div style="
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            background: rgba(108, 92, 231, 0.05);
            border-radius: 12px 12px 0 0;
        ">
            <div style="font-weight: 600; color: white; margin-bottom: 4px; font-size: 14px;">
                ${userData.first_name || 'User'}
            </div>
            <div style="font-size: 12px; color: #808191;">
                ${userData.phone || userData.email}
            </div>
        </div>
        <div class="dropdown-item" data-action="profile" style="
            padding: 12px 20px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s;
            font-size: 14px;
            border-left: 3px solid transparent;
        ">
            <i class="fas fa-user" style="margin-right: 12px; color: #6c5ce7; width: 16px; text-align: center;"></i>
            <span>Profile</span>
        </div>
        <div class="dropdown-item" data-action="logout" style="
            padding: 12px 20px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s;
            font-size: 14px;
            border-left: 3px solid transparent;
        ">
            <i class="fas fa-sign-out-alt" style="margin-right: 12px; color: #e74c3c; width: 16px; text-align: center;"></i>
            <span>Logout</span>
        </div>
        <div style="
            padding: 8px 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 11px;
            color: #666;
            text-align: center;
        ">
            Skateboard Platform
        </div>
    `;
    
    document.body.appendChild(dropdown);
    
    // Add hover effects and click handlers
    dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.background = 'rgba(108, 92, 231, 0.15)';
            item.style.borderLeft = '3px solid #6c5ce7';
            item.style.paddingLeft = '17px';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
            item.style.borderLeft = '3px solid transparent';
            item.style.paddingLeft = '20px';
        });
        
// In the dropdown logout click handler:
item.addEventListener('click', function() {
    const action = this.getAttribute('data-action');
    if (action === 'profile') {
        const userSession = localStorage.getItem('user_session');
        if (userSession) {
            const user = JSON.parse(userSession);
            window.location.href = `/hex/-/php/password.html?user=${user.user_id}`;
        }
    } else if (action === 'logout') {
        // Clear session and broadcast logout
        localStorage.removeItem('user_session');
        localStorage.setItem('user_logged_out', 'true');
        
        // If on password.html, redirect to main page
        if (window.location.pathname.includes('password.html')) {
            window.location.href = 'index.html';
        } else {
            // Reload current page (main page)
            location.reload();
        }
    }
    hideUserDropdown();
});
    });
}

function toggleUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        if (dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        } else {
            // Update position before showing
            const userSettings = document.querySelector('.user-settings');
            if (userSettings) {
                const rect = userSettings.getBoundingClientRect();
                dropdown.style.top = `${rect.bottom + window.scrollY}px`;
                dropdown.style.right = `${window.innerWidth - rect.right}px`;
            }
            dropdown.style.display = 'block';
        }
    } else {
        createUserDropdown();
        const newDropdown = document.querySelector('.user-dropdown');
        if (newDropdown) {
            newDropdown.style.display = 'block';
        }
    }
}


// session-manager.js - Shared session management across tabs
(function() {
    console.log('🔐 Session Manager loaded');
    
    const SessionManager = {
        // Get current session
        getSession: function() {
            const session = localStorage.getItem('user_session');
            return session ? JSON.parse(session) : null;
        },
        
        // Set session and broadcast to other tabs
        setSession: function(userData) {
            localStorage.setItem('user_session', JSON.stringify(userData));
            
            // Broadcast login event
            const event = new CustomEvent('sessionChanged', { 
                detail: { action: 'login', userData: userData }
            });
            window.dispatchEvent(event);
            
            // Also use storage event for cross-tab communication
            localStorage.setItem('session_updated', Date.now());
        },
        
        // Clear session and broadcast logout
        clearSession: function() {
            localStorage.removeItem('user_session');
            
            // Broadcast logout event
            const event = new CustomEvent('sessionChanged', { 
                detail: { action: 'logout' }
            });
            window.dispatchEvent(event);
            
            // Use storage event for cross-tab
            localStorage.setItem('session_cleared', Date.now());
            setTimeout(() => {
                localStorage.removeItem('session_cleared');
            }, 1000);
        },
        
        // Check if user is logged in
        isLoggedIn: function() {
            return !!localStorage.getItem('user_session');
        },
        
        // Initialize cross-tab listeners
        init: function() {
            // Listen for storage events (other tabs)
            window.addEventListener('storage', function(e) {
                if (e.key === 'user_session') {
                    console.log('Session changed in another tab');
                    
                    // Dispatch custom event for easier handling
                    const action = e.newValue ? 'login' : 'logout';
                    const event = new CustomEvent('sessionChanged', { 
                        detail: { 
                            action: action,
                            userData: e.newValue ? JSON.parse(e.newValue) : null
                        }
                    });
                    window.dispatchEvent(event);
                }
                
                // Check for session update flags
                if (e.key === 'session_updated' || e.key === 'session_cleared') {
                    // Force a UI update
                    const session = localStorage.getItem('user_session');
                    const event = new CustomEvent('sessionChanged', { 
                        detail: { 
                            action: session ? 'login' : 'logout',
                            userData: session ? JSON.parse(session) : null
                        }
                    });
                    window.dispatchEvent(event);
                }
            });
            
            // Listen for custom session events
            window.addEventListener('sessionChanged', function(e) {
                console.log('Session changed event:', e.detail.action);
                
                // You can handle this event in your main code
                // For example, update UI based on login/logout
            });
            
            console.log('✅ Session Manager initialized');
        }
    };
    
    // Initialize
    SessionManager.init();
    
    // Make it globally available
    window.SessionManager = SessionManager;
})();
// Add to login.js after checkLoginStatus() function
function setupCrossTabSessionSync() {
    console.log('🔄 Setting up cross-tab session sync');
    
    // Listen for storage changes (when another tab logs in/out)
    window.addEventListener('storage', function(e) {
        console.log('Storage change detected:', e.key, e.newValue);
        
        if (e.key === 'user_session') {
            if (e.newValue) {
                // Another tab logged IN
                console.log('Another tab logged in, updating UI...');
                try {
                    const userData = JSON.parse(e.newValue);
                    updateUserInterface(userData);
                    createUserDropdown();
                } catch (error) {
                    console.error('Error parsing session from storage:', error);
                }
            } else {
                // Another tab logged OUT
                console.log('Another tab logged out, updating UI...');
                // Clear UI and show logged out state
                const userName = document.querySelector('.user-name');
                if (userName) userName.textContent = 'Thomas'; // Default name
                
                // Remove dropdown
                const dropdown = document.querySelector('.user-dropdown');
                if (dropdown) dropdown.remove();
                
                // Clear any login modal
                const modal = document.getElementById('loginModal');
                if (modal) modal.style.display = 'none';
            }
        }
        
        // Check for login/logout flags
        if (e.key === 'user_logged_in') {
            if (e.newValue === 'true') {
                console.log('Login detected from another tab');
                // Trigger a session check
                checkLoginStatus();
            }
        }
        
        if (e.key === 'user_logged_out') {
            if (e.newValue === 'true') {
                console.log('Logout detected from another tab');
                // Clear session and UI
                localStorage.removeItem('user_session');
                const userName = document.querySelector('.user-name');
                if (userName) userName.textContent = 'Thomas';
                
                // Remove dropdown
                const dropdown = document.querySelector('.user-dropdown');
                if (dropdown) dropdown.remove();
                
                // Clear the flag
                localStorage.removeItem('user_logged_out');
            }
        }
    });
    
    // Also check session when page becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('Page became visible, checking session...');
            checkLoginStatus();
        }
    });
    
    // Broadcast when we log in
    window.addEventListener('userLoggedIn', function() {
        localStorage.setItem('user_logged_in', 'true');
        // Remove flag after a short delay
        setTimeout(() => {
            localStorage.removeItem('user_logged_in');
        }, 1000);
    });
    
    console.log('✅ Cross-tab session sync ready');
}

// Update the login success handler to trigger event
// In handleLoginSubmit() function, after successful login:
// Add this after localStorage.setItem('user_session', ...)
const loginEvent = new Event('userLoggedIn');
window.dispatchEvent(loginEvent);
function hideUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// Add spin animation and dropdown styles
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Dropdown animation */
    .user-dropdown {
        animation: dropdownFadeIn 0.2s ease-out;
    }
    
    @keyframes dropdownFadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Make sure notification button doesn't trigger dropdown */
    .notify, .notification {
        cursor: default !important;
    }
    .notify:hover, .notification:hover {
        opacity: 1 !important;
        transform: none !important;
    }
    
    /* User area hover effects */
    .user-name:hover, .user-img:hover {
        opacity: 0.8 !important;
    }
    
    .user-settings:hover > .user-name,
    .user-settings:hover > .user-img {
        opacity: 0.8 !important;
    }
`;
document.head.appendChild(style);

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('loginModal');
    if (modal && modal.style.display === 'flex' && e.target === modal) {
        modal.style.display = 'none';
    }
});

// Close button
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close-login-modal')) {
        const modal = document.getElementById('loginModal');
        if (modal) modal.style.display = 'none';
    }
});

console.log('✅ Login.js ready. Click user area to login/signup.');