// ===== FIXED LIKE SYSTEM =====
// Works with localStorage and optionally with database

// Global variable
let currentVideoForLikes = null;
let isProcessingLike = false; // Prevent double-clicks

document.addEventListener('DOMContentLoaded', function() {
    console.log('❤️ Like system loaded');
    setupLikeButton();
    monitorVideoPlayback();
    
    // Update stars after videos load
    setTimeout(() => {
        if (window.currentVideos && window.currentVideos.length > 0) {
            updateAllVideoStars();
        }
    }, 2000);
});

// Monitor for video playback
function monitorVideoPlayback() {
    console.log('👀 Monitoring video playback...');
    
    // Check when stream view opens
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const mainContainer = document.querySelector('.main-container');
                if (mainContainer && mainContainer.classList.contains('show')) {
                    setTimeout(detectCurrentVideo, 500);
                }
            }
        });
    });
    
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
        observer.observe(mainContainer, { attributes: true });
    }
    
    // Check every 2 seconds
    setInterval(detectCurrentVideo, 2000);
}

// Detect current video
function detectCurrentVideo() {
    if (window.commentSystem && window.commentSystem.currentVideoId) {
        updateCurrentVideo(window.commentSystem.currentVideoId);
    }
}

// Update current video
function updateCurrentVideo(videoId) {
    if (currentVideoForLikes === videoId) return;
    
    console.log('🎬 Video detected:', videoId);
    currentVideoForLikes = videoId;
    
    updateLikeButtonForVideo(videoId);
}

// Setup like button
function setupLikeButton() {
    const likeBtn = document.getElementById('mainLikeBtn');
    
    if (likeBtn) {
        console.log('✅ Found like button');
        initializeLikeButton(likeBtn);
    } else {
        setTimeout(setupLikeButton, 500);
    }
}

// Initialize the like button
function initializeLikeButton(likeBtn) {
    // Clone to remove existing listeners
    const newBtn = likeBtn.cloneNode(true);
    likeBtn.parentNode.replaceChild(newBtn, likeBtn);
    
    const freshBtn = document.getElementById('mainLikeBtn');
    
    // Add click handler
    freshBtn.addEventListener('click', handleLikeClick);
    
    console.log('✅ Like button ready');
}

// Handle like button click
async function handleLikeClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double-clicks
    if (isProcessingLike) return;
    isProcessingLike = true;
    
    if (!currentVideoForLikes) {
        alert('Please play a video first');
        isProcessingLike = false;
        return;
    }
    
    const videoId = currentVideoForLikes;
    const likeBtn = this;
    const isLiked = localStorage.getItem(`liked_${videoId}`) === 'true';
    
    // Get current likes count
    let videoLikes = getVideoLikes(videoId);
    
    // Use CSS animation
    likeBtn.classList.add('clicked');
    setTimeout(() => {
        likeBtn.classList.remove('clicked');
    }, 200);
    
    // Update UI IMMEDIATELY for better UX
    const heartIcon = likeBtn.querySelector('i.fa-heart');
    const countEl = likeBtn.querySelector('.like-count');
    
    if (isLiked) {
        // Unlike - turn back to WHITE
        likeBtn.classList.remove('active');
        likeBtn.classList.add('purple');
        if (heartIcon) heartIcon.style.color = '#ffffff'; // WHITE
        if (countEl) countEl.textContent = Math.max(0, videoLikes - 1);
        localStorage.removeItem(`liked_${videoId}`);
        
        // Update likes count locally
        const newLikes = Math.max(0, videoLikes - 1);
        updateVideoLikesLocally(videoId, newLikes);
        
        // Try to update database (optional)
        tryUpdateLikesInDatabase(videoId, 'unlike', newLikes);
        
    } else {
        // Like - turn to RED
        likeBtn.classList.add('active');
        likeBtn.classList.remove('purple');
        if (heartIcon) heartIcon.style.color = '#ea5f5f'; // RED
        if (countEl) countEl.textContent = videoLikes + 1;
        localStorage.setItem(`liked_${videoId}`, 'true');
        showLikeNotification();
        
        // Update likes count locally
        const newLikes = videoLikes + 1;
        updateVideoLikesLocally(videoId, newLikes);
        
        // Try to update database (optional)
        tryUpdateLikesInDatabase(videoId, 'like', newLikes);
    }
    
    isProcessingLike = false;
}

// Update likes locally in localStorage
function updateVideoLikesLocally(videoId, newLikes) {
    // Save to localStorage
    localStorage.setItem(`video_likes_${videoId}`, newLikes.toString());
    
    // Update in window.currentVideos if exists
    if (window.currentVideos && Array.isArray(window.currentVideos)) {
        const videoIndex = window.currentVideos.findIndex(v => v.id === videoId);
        if (videoIndex !== -1) {
            window.currentVideos[videoIndex].likes = newLikes;
        }
    }
    
    // Update stars
    updateStarsForVideo(videoId, newLikes);
    
    return newLikes;
}

// Try to update database (won't fail if api.php doesn't support it)
async function tryUpdateLikesInDatabase(videoId, action, newLikes) {
    try {
        console.log(`📤 Trying to update database: ${action} for ${videoId}`);
        
        // Create form data
        const formData = new FormData();
        formData.append('action', 'update_video_likes'); // Changed action name
        formData.append('video_id', videoId);
        formData.append('likes', newLikes);
        
        // Send to api.php
        const response = await fetch('https://pazzle-store-api.mus00204.workers.dev/api', {
            method: 'POST',
            body: formData
        });
        
        const responseText = await response.text();
        
        // Try to parse response
        try {
            const data = JSON.parse(responseText);
            if (response.ok && data.success) {
                console.log(`✅ Database updated: ${data.likes} likes`);
                return { success: true, data: data };
            } else {
                console.log(`ℹ️ Database update returned:`, data);
                return { success: false, data: data };
            }
        } catch (parseError) {
            // If response is not JSON, api.php probably doesn't support this action
            console.log(`ℹ️ api.php doesn't support like updates yet`);
            return { success: false, error: 'API not configured for likes' };
        }
        
    } catch (error) {
        console.log(`ℹ️ Could not update database:`, error.message);
        return { success: false, error: error.message };
    }
}

// Get video likes from localStorage or currentVideos
function getVideoLikes(videoId) {
    // Check localStorage for saved likes
    const savedLikes = localStorage.getItem(`video_likes_${videoId}`);
    if (savedLikes !== null) {
        return parseInt(savedLikes) || 0;
    }
    
    // Fall back to video data
    if (window.currentVideos && Array.isArray(window.currentVideos)) {
        const videoData = window.currentVideos.find(v => v.id === videoId);
        if (videoData) {
            const likes = parseInt(videoData.likes) || 0;
            // Save to localStorage for consistency
            localStorage.setItem(`video_likes_${videoId}`, likes.toString());
            return likes;
        }
    }
    
    return 0;
}

// Show notification
function showLikeNotification() {
    const existing = document.querySelector('.like-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'like-notification';
    notification.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span>Liked!</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Update like button for specific video
function updateLikeButtonForVideo(videoId) {
    console.log('🔄 Updating like button for video:', videoId);
    currentVideoForLikes = videoId;
    
    const likeBtn = document.getElementById('mainLikeBtn');
    if (!likeBtn) return;
    
    // Get video likes
    const videoLikes = getVideoLikes(videoId);
    
    // Set count
    const countEl = likeBtn.querySelector('.like-count');
    if (countEl) {
        countEl.textContent = videoLikes;
    }
    
    // Check if user has liked this video
    const hasLiked = localStorage.getItem(`liked_${videoId}`) === 'true';
    const heartIcon = likeBtn.querySelector('i.fa-heart');
    
    // FIXED: White by default, red when liked
    if (hasLiked) {
        likeBtn.classList.add('active');
        likeBtn.classList.remove('purple');
        if (heartIcon) heartIcon.style.color = '#ea5f5f'; // RED when liked
    } else {
        likeBtn.classList.remove('active');
        likeBtn.classList.add('purple');
        if (heartIcon) heartIcon.style.color = '#ffffff'; // WHITE when not liked
    }
    
    // Update stars
    updateStarsForVideo(videoId, videoLikes);
}

// Calculate stars
function calculateStars(likes) {
    likes = parseInt(likes) || 0;
    if (likes >= 100) return 5;
    if (likes >= 50) return 4;
    if (likes >= 25) return 3;
    if (likes >= 10) return 2;
    if (likes >= 1) return 1;
    return 0;
}

// Update stars for video
function updateStarsForVideo(videoId, likes) {
    if (!videoId) return;
    
    const stars = calculateStars(likes);
    const starsPercentage = (stars / 5) * 100;
    
    // Update stars in thumbnails
    const videoElements = document.querySelectorAll(`[data-video-id="${videoId}"] .stars-fill`);
    videoElements.forEach(starsFill => {
        starsFill.style.width = starsPercentage + '%';
    });
    
    // Update stars in stream view if this is the current video
    if (window.commentSystem && window.commentSystem.currentVideoId === videoId) {
        const streamStars = document.querySelector('.stream-area .stars-fill');
        if (streamStars) {
            streamStars.style.width = starsPercentage + '%';
        }
    }
}

// Update all video stars
function updateAllVideoStars() {
    if (!window.currentVideos || !Array.isArray(window.currentVideos)) return;
    
    window.currentVideos.forEach(video => {
        if (video.id && video.likes !== undefined) {
            updateStarsForVideo(video.id, getVideoLikes(video.id));
        }
    });
}

// Add this route to your api.php to enable database updates
window.addLikeRouteToAPI = function() {
    console.log('📝 Add this code to your api.php after other routes:');
    console.log(`
// === ADD TO api.php FOR DATABASE LIKE UPDATES ===
// Route: Update video likes in database
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_video_likes') {
    $videoId = escape($_POST['video_id'] ?? '');
    $likes = intval($_POST['likes'] ?? 0);
    
    if (empty($videoId)) {
        echo json_encode(['success' => false, 'error' => 'Video ID required']);
        exit;
    }
    
    // Update likes in database
    $sql = "UPDATE products SET likes = $likes WHERE id = '$videoId'";
    
    if (mysqli_query($conn, $sql)) {
        echo json_encode([
            'success' => true,
            'likes' => $likes,
            'message' => 'Likes updated successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update: ' . mysqli_error($conn)]);
    }
    exit;
}
// === END ADD TO api.php ===
    `);
};

// Compatibility function
window.setCurrentVideoForLikes = updateLikeButtonForVideo;

// Debug
window.likeSystem = {
    getCurrentVideo: () => currentVideoForLikes,
    forceLike: () => {
        const btn = document.getElementById('mainLikeBtn');
        if (btn) btn.click();
    },
    getLikes: (videoId) => getVideoLikes(videoId),
    resetLikes: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('liked_') || key.startsWith('video_likes_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('✅ All likes reset');
    }
};

// Initialize on page load
window.addEventListener('load', function() {
    console.log('🚀 Page fully loaded');
    
    // Show how to add database support
    setTimeout(() => {
        window.addLikeRouteToAPI();
    }, 5000);
    
    // Wait a bit for everything to render
    setTimeout(() => {
        if (window.currentVideos && window.currentVideos.length > 0) {
            console.log('⭐ Initial star update on page load');
            updateAllVideoStars();
        }
    }, 1000);
});