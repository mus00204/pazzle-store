// ===== CONFIGURATION =====
const WORKER_URL = 'https://pazzle-store-api.mus00204.workers.dev';
const VIDEO_PLAYER_SELECTOR = '#video-player';
const THUMBNAIL_GRID_SELECTOR = '.thumbnail-grid';
const VIDEO_LIST_SELECTOR = '.video-list-container';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Pazzle Store...');
    
    // Load initial videos
    await loadVideos();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load comments for first video if exists
    const firstVideo = window.currentVideos?.[0];
    if (firstVideo) {
        await loadComments(firstVideo.id);
    }
});

// ===== VIDEO LOADING =====
async function loadVideos() {
    try {
        console.log('Loading videos from API...');
        showLoading('Loading videos...');
        
        const response = await fetch(`${WORKER_URL}/api/videos`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const videos = await response.json();
        
        console.log('Videos loaded:', videos.length);
        
        // Store videos globally WITH LIKE PROCESSING
        window.currentVideos = videos.map(video => ({
            ...video,
            likes: parseInt(video.likes) || 0
        }));
        
        // Render videos
        renderVideoThumbnails();
        renderVideoList();
        
        hideLoading();
        
    } catch (error) {
        console.error('Error loading videos:', error);
        showError('Failed to load videos. Please try again later.');
        hideLoading();
    }
}

// ===== COMMENTS SYSTEM =====
async function loadComments(videoId) {
    try {
        const response = await fetch(`${WORKER_URL}/api/comments?video_id=${videoId}`);
        
        if (!response.ok) throw new Error('Failed to load comments');
        
        const comments = await response.json();
        renderComments(comments);
        
    } catch (error) {
        console.error('Error loading comments:', error);
        renderComments([]);
    }
}

async function submitComment(videoId, commentText, userId) {
    try {
        const response = await fetch(`${WORKER_URL}/api/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                video_id: videoId,
                user_id: userId || 1, // Default user for now
                comment: commentText
            })
        });
        
        if (!response.ok) throw new Error('Failed to submit comment');
        
        // Reload comments
        await loadComments(videoId);
        return true;
        
    } catch (error) {
        console.error('Error submitting comment:', error);
        showError('Failed to post comment');
        return false;
    }
}

// ===== LIKES SYSTEM =====
async function toggleLike(videoId) {
    try {
        // Check if already liked
        const likedVideos = JSON.parse(localStorage.getItem('likedVideos') || '[]');
        const isLiked = likedVideos.includes(videoId);
        
        // Update local storage
        if (isLiked) {
            likedVideos.splice(likedVideos.indexOf(videoId), 1);
        } else {
            likedVideos.push(videoId);
        }
        localStorage.setItem('likedVideos', JSON.stringify(likedVideos));
        
        // Send to API
        const response = await fetch(`${WORKER_URL}/api/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                video_id: videoId,
                user_id: 1, // Default user for now
                action: isLiked ? 'unlike' : 'like'
            })
        });
        
        // Update UI immediately
        updateLikeUI(videoId, !isLiked);
        
        // Update video data
        const videoIndex = window.currentVideos.findIndex(v => v.id === videoId);
        if (videoIndex !== -1) {
            window.currentVideos[videoIndex].likes += isLiked ? -1 : 1;
        }
        
    } catch (error) {
        console.error('Error toggling like:', error);
        showError('Failed to update like');
    }
}

// ===== AVAILABILITY SYSTEM =====
async function updateAvailability(videoId, isAvailable) {
    try {
        const response = await fetch(`${WORKER_URL}/api/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                video_id: videoId,
                available: isAvailable
            })
        });
        
        if (!response.ok) throw new Error('Failed to update availability');
        
        return true;
        
    } catch (error) {
        console.error('Error updating availability:', error);
        showError('Failed to update availability');
        return false;
    }
}

// ===== UI RENDERING FUNCTIONS =====
function renderVideoThumbnails() {
    const grid = document.querySelector(THUMBNAIL_GRID_SELECTOR);
    if (!grid || !window.currentVideos) return;
    
    grid.innerHTML = '';
    
    window.currentVideos.forEach(video => {
        const thumb = createThumbnailElement(video);
        grid.appendChild(thumb);
    });
}

function renderVideoList() {
    const container = document.querySelector(VIDEO_LIST_SELECTOR);
    if (!container || !window.currentVideos) return;
    
    container.innerHTML = '';
    
    window.currentVideos.forEach(video => {
        const item = createVideoListItem(video);
        container.appendChild(item);
    });
}

function renderComments(comments) {
    const container = document.querySelector('.comments-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!comments || comments.length === 0) {
        container.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
        return;
    }
    
    comments.forEach(comment => {
        const commentEl = createCommentElement(comment);
        container.appendChild(commentEl);
    });
}

// ===== UI HELPER FUNCTIONS =====
function createThumbnailElement(video) {
    const div = document.createElement('div');
    div.className = 'thumbnail-item';
    div.innerHTML = `
        <img src="${video.thumbnail_url}" alt="${video.title}" onclick="playVideo(${video.id})">
        <div class="video-info">
            <h3>${video.title}</h3>
            <p>${video.views || 0} views • ${formatDuration(video.duration)}</p>
            <p class="price">$${video.price || '0.00'}</p>
        </div>
    `;
    return div;
}

function createVideoListItem(video) {
    const div = document.createElement('div');
    div.className = 'video-list-item';
    div.innerHTML = `
        <div class="video-list-thumb">
            <img src="${video.thumbnail_url}" alt="${video.title}" onclick="playVideo(${video.id})">
            <span class="duration">${formatDuration(video.duration)}</span>
        </div>
        <div class="video-list-info">
            <h3 onclick="playVideo(${video.id})">${video.title}</h3>
            <p class="channel">${video.username || 'Unknown'} • ${video.views || 0} views</p>
            <p class="description">${video.description || 'No description available.'}</p>
            <div class="stats">
                <span class="likes" onclick="toggleLike(${video.id})">
                    ❤️ ${video.likes || 0}
                </span>
                <span class="comments" onclick="focusComments(${video.id})">
                    💬 ${video.comment_count || 0}
                </span>
            </div>
        </div>
    `;
    return div;
}

function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment';
    div.innerHTML = `
        <img src="${comment.avatar || '/avatars/default.jpg'}" class="comment-avatar">
        <div class="comment-content">
            <div class="comment-header">
                <strong>${comment.username || 'User'}</strong>
                <span class="comment-time">${formatTime(comment.created_at)}</span>
            </div>
            <p>${comment.comment}</p>
        </div>
    `;
    return div;
}

// ===== EVENT HANDLERS =====
function setupEventListeners() {
    // Comment form submission
    const commentForm = document.querySelector('.comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = commentForm.querySelector('input, textarea');
            const currentVideo = window.currentVideo;
            
            if (input.value.trim() && currentVideo) {
                await submitComment(currentVideo.id, input.value.trim());
                input.value = '';
            }
        });
    }
    
    // Like buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.like-button')) {
            const videoId = parseInt(e.target.closest('.like-button').dataset.videoId);
            if (videoId) toggleLike(videoId);
        }
    });
}

// ===== UTILITY FUNCTIONS =====
function showLoading(message = 'Loading...') {
    let loader = document.querySelector('.loading-overlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `<div class="loader">${message}</div>`;
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

function hideLoading() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) loader.style.display = 'none';
}

function showError(message) {
    // Create or update error message
    let error = document.querySelector('.error-message');
    if (!error) {
        error = document.createElement('div');
        error.className = 'error-message';
        document.body.appendChild(error);
    }
    error.textContent = message;
    error.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        error.style.display = 'none';
    }, 5000);
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

// ===== GLOBAL FUNCTIONS (for onclick handlers) =====
window.playVideo = function(videoId) {
    const video = window.currentVideos?.find(v => v.id === videoId);
    if (!video) return;
    
    window.currentVideo = video;
    
    // Update video player
    const player = document.querySelector(VIDEO_PLAYER_SELECTOR);
    if (player) {
        const videoEl = player.querySelector('video');
        if (videoEl) {
            videoEl.src = video.video_url;
            videoEl.poster = video.thumbnail_url;
            videoEl.load();
        }
        
        // Update video info
        const titleEl = player.querySelector('.video-title');
        if (titleEl) titleEl.textContent = video.title;
        
        const descEl = player.querySelector('.video-description');
        if (descEl) descEl.textContent = video.description;
        
        const viewsEl = player.querySelector('.video-views');
        if (viewsEl) viewsEl.textContent = `${video.views || 0} views`;
    }
    
    // Load comments for this video
    loadComments(videoId);
};

window.focusComments = function(videoId) {
    playVideo(videoId);
    const commentsSection = document.querySelector('.comments-section');
    if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
};

window.updateLikeUI = function(videoId, isLiked) {
    const likeButtons = document.querySelectorAll(`[onclick*="toggleLike(${videoId})"], [data-video-id="${videoId}"]`);
    likeButtons.forEach(btn => {
        if (isLiked) {
            btn.classList.add('liked');
            btn.innerHTML = btn.innerHTML.replace('🤍', '❤️');
        } else {
            btn.classList.remove('liked');
            btn.innerHTML = btn.innerHTML.replace('❤️', '🤍');
        }
    });
};