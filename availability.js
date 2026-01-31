// availability.js - SMALLER CURVED AV / N-AV BUTTONS
console.log('🎯 Dot Availability System');

// Store availability data
let videoAvailabilities = {};

// Initialize based on page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing availability system...');
    
    if (window.location.pathname.includes('admin.html')) {
        setupAdminPage();
    } else {
        setupMainPage();
    }
});

// ==================== ADMIN PAGE ====================
function setupAdminPage() {
    console.log('🛠️ Setting up admin page...');
    
    // Load current availability
    loadAvailability();
    
    // Add toggle buttons to videos
    addToggleButtons();
    
    // Keep adding buttons as videos load
    setInterval(addToggleButtons, 2000);
}

async function loadAvailability() {
    try {
        const response = await fetch('https://pazzle-store-api.mus00204.workers.dev/availability-api?action=get_all');
        const data = await response.json();
        
        if (data.success) {
            videoAvailabilities = data.availabilities || {};
            console.log(`📊 Loaded ${Object.keys(videoAvailabilities).length} video availabilities`);
        }
    } catch (error) {
        console.error('❌ Failed to load availability:', error);
    }
}

function addToggleButtons() {
    const videoItems = document.querySelectorAll('.video-item');
    
    videoItems.forEach(item => {
        // Skip if already has button
        if (item.querySelector('.availability-toggle')) return;
        
        // Get video ID from delete button
        const deleteBtn = item.querySelector('.delete-btn');
        if (!deleteBtn) return;
        
        const videoId = deleteBtn.getAttribute('data-video-id');
        if (!videoId) return;
        
        // Get current status
        const status = videoAvailabilities[videoId] || 'available';
        
        // Create toggle button - EXTRA SMALL and curved
        const btn = document.createElement('button');
        btn.className = 'availability-toggle';
        btn.dataset.videoId = videoId;
        btn.textContent = status === 'available' ? 'AV' : 'N-AV';
        btn.style.cssText = `
            padding: 2px 6px;
            margin: 1px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 9px;
            font-weight: 600;
            color: white;
            background: ${status === 'available' ? '#22b07d' : '#ff7551'};
            min-width: 35px;
            height: 20px;
            line-height: 1;
            transition: all 0.2s;
            letter-spacing: 0.2px;
        `;
        
        // Add hover effect
        btn.onmouseenter = () => {
            btn.style.transform = 'scale(1.02)';
        };
        btn.onmouseleave = () => {
            btn.style.transform = 'scale(1)';
        };
        
        // Add click handler
        btn.onclick = function() {
            toggleVideoAvailability(videoId, btn);
        };
        
        // Add to video actions - insert before delete button
        const actions = item.querySelector('.video-actions');
        if (actions) {
            actions.insertBefore(btn, deleteBtn);
        }
    });
}

async function toggleVideoAvailability(videoId, button) {
    const currentText = button.textContent;
    const newStatus = currentText === 'AV' ? 'not_available' : 'available';
    
    // Update button immediately
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = '...';
    
    try {
        // Save to database
        await saveAvailabilityToDB(videoId, newStatus);
        
        // Update button
        button.textContent = newStatus === 'available' ? 'AV' : 'N-AV';
        button.style.background = newStatus === 'available' ? '#22b07d' : '#ff7551';
        button.disabled = false;
        
        // Update local data
        videoAvailabilities[videoId] = newStatus;
        
        // Notify main page
        notifyMainPage(videoId, newStatus);
        
    } catch (error) {
        console.error('❌ Error:', error);
        button.textContent = originalText;
        button.disabled = false;
    }
}

async function saveAvailabilityToDB(videoId, status) {
    const formData = new FormData();
    formData.append('action', 'update');
    formData.append('video_id', videoId);
    formData.append('availability', status);
    
    const response = await fetch('https://pazzle-store-api.mus00204.workers.dev', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to save');
    }
    
    return result;
}

function notifyMainPage(videoId, status) {
    // Use localStorage to notify main page
    localStorage.setItem('videoAvailabilityChanged', JSON.stringify({
        videoId: videoId,
        status: status,
        timestamp: Date.now()
    }));
    
    // Also trigger event on current page
    setTimeout(() => {
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'videoAvailabilityChanged',
            newValue: JSON.stringify({ videoId, status, timestamp: Date.now() })
        }));
    }, 100);
}

// ==================== MAIN PAGE ====================
function setupMainPage() {
    console.log('📺 Setting up main page...');
    
    // Load availability data
    loadAvailabilityForMain();
    
    // Update dots when videos load
    if (window.loadVideosFromServer) {
        const originalLoad = window.loadVideosFromServer;
        window.loadVideosFromServer = async function() {
            const result = await originalLoad.apply(this, arguments);
            setTimeout(updateAllDotsOnMainPage, 1000);
            return result;
        };
    }
    
    // Listen for updates from admin
    window.addEventListener('storage', function(e) {
        if (e.key === 'videoAvailabilityChanged') {
            try {
                const data = JSON.parse(e.newValue);
                if (data && data.videoId) {
                    videoAvailabilities[data.videoId] = data.status;
                    updateAllDotsOnMainPage();
                }
            } catch (err) {
                console.error('Error parsing update:', err);
            }
        }
    });
    
    // Also update dots periodically
    setInterval(updateAllDotsOnMainPage, 3000);
}

async function loadAvailabilityForMain() {
    try {
        const response = await fetch('https://pazzle-store-api.mus00204.workers.dev/availability-api?action=get_all');
        const data = await response.json();
        
        if (data.success) {
            videoAvailabilities = data.availabilities || {};
            console.log(`📊 Loaded ${Object.keys(videoAvailabilities).length} availabilities for dots`);
            
            // Update dots after loading
            setTimeout(updateAllDotsOnMainPage, 500);
        }
    } catch (error) {
        console.error('❌ Failed to load availability:', error);
    }
}

function updateAllDotsOnMainPage() {
    // Update dots in chat messages
    updateChatMessageDots();
    
    // Update dots in video list
    updateVideoListDots();
}

function updateChatMessageDots() {
    const messages = document.querySelectorAll('.message');
    
    messages.forEach(message => {
        const videoId = message.getAttribute('data-video-id');
        if (!videoId) return;
        
        // Find the dot (small circle) in the message
        const allElements = message.querySelectorAll('*');
        
        allElements.forEach(element => {
            const style = window.getComputedStyle(element);
            
            // Check if this is a dot (small circle)
            if (style.borderRadius === '50%' &&
                (style.width === '8px' || style.width === '6px') &&
                (style.height === '8px' || style.height === '6px')) {
                
                // Get availability status
                const status = videoAvailabilities[videoId] || 'available';
                const color = status === 'available' ? '#22b07d' : '#ff7551';
                
                // Update dot color
                element.style.backgroundColor = color;
            }
        });
    });
}

function updateVideoListDots() {
    const videos = document.querySelectorAll('.video');
    
    videos.forEach(video => {
        const videoId = video.getAttribute('data-video-id');
        if (!videoId) return;
        
        // Update classes for CSS styling
        const statusElements = video.querySelectorAll('.video-by, [class*="status"]');
        
        statusElements.forEach(element => {
            const status = videoAvailabilities[videoId] || 'available';
            
            element.classList.remove('available', 'not-available', 'online', 'offline');
            
            if (status === 'available') {
                element.classList.add('available', 'online');
            } else {
                element.classList.add('not-available', 'offline');
            }
        });
        
        // Also update inline dots
        const allElements = video.querySelectorAll('*');
        allElements.forEach(element => {
            const style = window.getComputedStyle(element);
            if (style.borderRadius === '50%' && 
                (style.width === '8px' || style.width === '6px')) {
                
                const status = videoAvailabilities[videoId] || 'available';
                const color = status === 'available' ? '#22b07d' : '#ff7551';
                element.style.backgroundColor = color;
            }
        });
    });
}

// Manual controls for debugging
window.updateDotsNow = updateAllDotsOnMainPage;

console.log('✅ Availability system loaded');