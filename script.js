// Function to shuffle array randomly
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Global variable to track current videos
window.currentVideos = [];

// Main page video loader
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 Initializing main page...');
    initializeMainPage();
});

function initializeMainPage() {
    loadVideosFromServer();
    setupMainPageEvents();
    setupSimpleRealtimeUpdates();
}

// SIMPLE and RELIABLE real-time updates
function setupSimpleRealtimeUpdates() {
    console.log('📡 Setting up real-time updates...');
    
    // Listen for storage events from admin panel
    window.addEventListener('storage', function(e) {
        console.log('📡 Storage event detected:', e.key);
        
        if (e.key === 'videosUpdated' || e.key === 'videoDataChanged') {
            console.log('🔄 Video data changed, reloading...');
            loadVideosFromServer();
        }
    });
    
    // Listen for BroadcastChannel messages
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const channel = new BroadcastChannel('video_updates');
            channel.onmessage = function(event) {
                console.log('📡 Broadcast message:', event.data.type);
                if (event.data.type === 'videosUpdated') {
                    console.log('🔄 Video update via BroadcastChannel');
                    loadVideosFromServer();
                }
            };
        } catch (e) {
            console.log('📡 BroadcastChannel not available');
        }
    }
    
    // Check for updates when tab becomes focused
    window.addEventListener('focus', function() {
        console.log('🔍 Tab focused - checking for updates');
        checkForVideoUpdates();
    });
}

// Check for video updates without auto-refresh
async function checkForVideoUpdates() {
    try {
        const response = await fetch('./api.php?_check=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        let videos = [];
        if (Array.isArray(data)) {
            videos = data;
        } else if (data && Array.isArray(data.videos)) {
            videos = data.videos;
        }
        
        // Simple check: if number of videos changed
        if (videos.length !== window.currentVideos.length) {
            console.log('🔄 Video count changed, reloading...');
            loadVideosFromServer();
            return;
        }
        
        // Check if any video data changed
        let changed = false;
        for (let i = 0; i < videos.length; i++) {
            const newVideo = videos[i];
            const oldVideo = window.currentVideos.find(v => v.id === newVideo.id);
            
            if (!oldVideo) {
                changed = true;
                break;
            }
            
            if (oldVideo.title !== newVideo.title ||
                oldVideo.author !== newVideo.author ||
                oldVideo.views !== newVideo.views ||
                oldVideo.timeAgo !== newVideo.timeAgo ||
                oldVideo.status !== newVideo.status) {
                changed = true;
                break;
            }
        }
        
        if (changed) {
            console.log('🔄 Video data changed, reloading...');
            loadVideosFromServer();
        }
        
    } catch (error) {
        console.log('❌ Update check failed:', error);
    }
}

async function loadVideosFromServer() {
    console.log('📡 Loading videos from MySQL database...');

    try {
        // SIMPLE: Just fetch the API without extra parameters
       const response = await fetch('https://pazzle-store-api.mus00204.workers.dev/api/videos?_=' + Date.now());
        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the response as text first to debug
        const responseText = await response.text();
        console.log('📄 Raw response (first 500 chars):', responseText.substring(0, 500));

        // Parse JSON
        const videos = JSON.parse(responseText);
        console.log(`✅ Found ${videos.length} videos`);

        // Store videos globally WITH LIKE PROCESSING
        window.currentVideos = videos.map(video => ({ 
            ...video,
            likes: parseInt(video.likes) || 0
        }));

        if (window.currentVideos.length > 0) {
            const shuffledVideos = shuffleArray([...window.currentVideos]);

            displayVideos(shuffledVideos);
            updateChatAreaWithVideos(window.currentVideos);

            // Update stars for ALL videos
            updateAllVideoStars();

        } else {
            console.log('📭 No videos found');
            displayVideos([]);
            updateChatAreaWithVideos([]);
        }
    } catch (error) {
        console.error('❌ Error loading videos:', error);
        displayVideos([]);
        updateChatAreaWithVideos([]);
    }
}

// In like.js - MODIFY THIS FUNCTION:
function updateAllVideoStars() {
    console.log('⭐ Updating stars for all videos...');
    
    if (!window.currentVideos || !Array.isArray(window.currentVideos)) {
        console.log('⚠️ No videos loaded yet');
        return;
    }
    
    window.currentVideos.forEach(video => {
        if (video && video.id) {
            const likes = parseInt(video.likes) || 0;
            
            // Calculate stars - USE THE SAME CALCULATION EVERYWHERE
            let stars = 0;
            if (likes >= 100) stars = 5;
            else if (likes >= 50) stars = 4;
            else if (likes >= 25) stars = 3;
            else if (likes >= 10) stars = 2;
            else if (likes >= 1) stars = 1;
            
            const starsPercentage = (stars / 5) * 100;
            
            // ⭐⭐ CRITICAL FIX: Use BOTH selectors for mobile/desktop
            const videoElements = document.querySelectorAll(`.video[data-video-id="${video.id}"] .stars-fill`);
            const messageElements = document.querySelectorAll(`.message[data-video-id="${video.id}"] .stars-fill`);
            
            // Combine all star elements
            const allStarElements = [...videoElements, ...messageElements];
            
            allStarElements.forEach(starsFill => {
                // Force the width - important for mobile
                starsFill.style.width = starsPercentage + '%';
                starsFill.style.cssText += `width: ${starsPercentage}% !important;`;
            });
        }
    });
    
    console.log(`✅ Stars updated for ${window.currentVideos.length} videos`);
}

// Function to update video status indicators
function updateVideoStatusIndicators(videos) {
    if (!videos || !Array.isArray(videos)) return;
    
    const videoElements = document.querySelectorAll('.video');
    videoElements.forEach(videoElement => {
        const authorElement = videoElement.querySelector('.video-by');
        const videoId = videoElement.getAttribute('data-video-id');
        
        if (authorElement && videoId) {
            const videoData = videos.find(v => v.id === videoId);
            if (videoData) {
                if (videoData.status === 'online') {
                    authorElement.classList.remove('offline');
                    authorElement.classList.add('online');
                } else {
                    authorElement.classList.remove('online');
                    authorElement.classList.add('offline');
                }
            }
        }
    });
}



// Display videos in main area
function displayVideos(videos) {
    const videosContainer = document.querySelector('.videos');
    
    if (!videosContainer) {
        console.error('❌ Videos container not found');
        return;
    }
    
    videosContainer.innerHTML = '';
    
    if (!videos || videos.length === 0) {
        videosContainer.innerHTML = `
            <div class="no-videos" style="text-align: center; padding: 40px; color: #808191;">
                <h3>No videos available</h3>
                <p>Check the admin panel to add videos</p>
            </div>
        `;
        return;
    }
    
    videos.forEach((video, index) => {
        const videoElement = createVideoElement(video, index);
        if (videoElement) {
            videosContainer.appendChild(videoElement);
        }
    });
    
    updateVideoStatusIndicators(videos);
    setupVideoInteractions();
}

// Update chat area with SHUFFLED videos
function updateChatAreaWithVideos(videos) {
    console.log('🔄 Updating chat area with', videos.length, 'videos');
    
    const messageContainer = document.querySelector('.message-container');
    if (!messageContainer) {
        console.log('ℹ️ Message container not found - chat area might not exist');
        return;
    }
    
    messageContainer.innerHTML = '';
    
    if (!videos || videos.length === 0) {
        messageContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #808191;">
                <p>No videos available</p>
            </div>
        `;
        return;
    }
    
    const shuffledVideos = shuffleArray([...videos]);
    
    shuffledVideos.forEach((video, index) => {
        const videoElement = createSimpleChatVideoElement(video, index);
        if (videoElement) {
            messageContainer.appendChild(videoElement);
        }
    });
    
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
        chatHeader.innerHTML = `
            Random Videos
            <span>
                <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M14.212 7.762c0 2.644-2.163 4.763-4.863 4.763-2.698 0-4.863-2.119-4.863-4.763C4.486 5.12 6.651 3 9.35 3c2.7 0 4.863 2.119 4.863 4.762zM2 17.917c0-2.447 3.386-3.06 7.35-3.06 3.985 0 7.349.634 7.349 3.083 0 2.448-3.386 3.06-7.35 3.06C5.364 21 2 20.367 2 17.917zM16.173 7.85a6.368 6.368 0 01-1.137 3.646c-.075.107-.008.252.123.275.182.03.369.048.56.052 1.898.048 3.601-1.148 4.072-2.95.697-2.675-1.35-5.077-3.957-5.077a4.16 4.16 0 00-.818.082c-.036.008-.075.025-.095.055-.025.040-.007.09.019.124a6.414 6.414 0 011.233 3.793zm3.144 5.853c1.276.245 2.115.742 2.462 1.467a2.107 2.107 0 010 1.878c-.531 1.123-2.245 1.485-2.912 1.578a.207.207 0 01-.234-.232c.34-3.113-2.367-4.588-3.067-4.927-.03-.017-.036-.04-.034-.055.002-.01.015-.025.038-.028 1.515-.028 3.145.176 3.747.32z" />
                </svg>
                ${shuffledVideos.length} videos • Random order
            </span>
        `;
    }
    
    const chatFooter = document.querySelector('.chat-footer');
    if (chatFooter) {
        chatFooter.style.display = 'none';
    }
}

// Create video element for the chat area - UPDATED VERSION
function createSimpleChatVideoElement(video, index) {
    if (!video || typeof video !== 'object') return null;
    
    // CALCULATE STARS LIKE MAIN VIDEOS
    const likes = parseInt(video.likes) || 0;
    let stars = 0;
    if (likes >= 100) stars = 5;
    else if (likes >= 50) stars = 4;
    else if (likes >= 25) stars = 3;
    else if (likes >= 10) stars = 2;
    else if (likes >= 1) stars = 1;
    const starsPercentage = (stars / 5) * 100;
    
    const chatDiv = document.createElement('div');
    chatDiv.className = 'message anim';
    chatDiv.style.setProperty('--delay', `${0.1 + (index % 10) * 0.1}s`);
    
    const thumbnailSrc = video.coverImg || video.authorImg || getDefaultVideoCover(index);
    // Check both status and availability
    const isAvailable = video.availability === 'available';    
    chatDiv.innerHTML = `
        <div style="display: flex; align-items: center; width: 100%;">
            <div style="margin-right: 12px; flex-shrink: 0; position: relative;">
                <img src="${thumbnailSrc}" alt="${video.title}" 
                     style="width: 60px; height: 40px; border-radius: 6px; object-fit: cover;"
                     onerror="this.onerror=null; this.src='${getDefaultVideoCover(index)}'">
                <div style="position: absolute; top: 4px; left: 4px; width: 8px; height: 8px; border-radius: 50%; border: 1px solid #252836; background-color: ${isAvailable ? '#22b07d' : '#ff7551'};"></div>
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13px; color: #fff; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${video.title || 'Untitled Video'}
                </div>
                <div style="font-size: 11px; color: #808191; display: flex; align-items: center; justify-content: space-between;">
                    <span>${video.author || 'Unknown'} • ${video.views || '0 views'}</span>
                    <span style="background: rgba(0, 0, 0, 0.5); padding: 2px 4px; border-radius: 4px; margin-left: 8px;">
                        <span style="position: relative; display: inline-block; font-size: 10px; color: #353340; letter-spacing: 0.5px;">
                            <span style="color: #353340;">★★★★★</span>
                            <!-- FIXED: Uses actual star percentage -->
                            <span style="position: absolute; top: 0; left: 0; color: #FFD700; overflow: hidden; width: ${starsPercentage}%">★★★★★</span>
                        </span>
                    </span>
                </div>
            </div>
        </div>
    `;
    
    chatDiv.addEventListener('click', function() {
        playVideoInStreamView(video);
    });
    
    return chatDiv;
}

// ===== MAIN PLAY VIDEO FUNCTION =====
function playVideoInStreamView(video) {
    if (!video) return;
    
    console.log('🎬 Playing video in stream view:', video.title);
    console.log('🎯 Video ID for comments:', video.id);
    
    // Update stream view title
    const videoTitle = document.querySelector(".video-p-title");
    if (videoTitle) videoTitle.textContent = video.title || 'Untitled Video';
    
    // Update author info
    const videoName = document.querySelector(".video-p-name");
    if (videoName) {
        videoName.textContent = video.author || 'Unknown Author';
        if (video.status === 'online') {
            videoName.classList.remove('offline');
            videoName.classList.add('online');
        } else {
            videoName.classList.remove('online');
            videoName.classList.add('offline');
        }
    }
    
    // Update author image
    const authorImg = document.querySelector(".video-detail .author-img");
    if (authorImg) {
        authorImg.src = video.authorImg || getDefaultAuthorImage(0);
    }
    
    // Update description
    const videoSubtitle = document.querySelector(".video-p-subtitle");
    if (videoSubtitle) videoSubtitle.textContent = video.description || 'No description available';
    
    // Update the main video player
    const streamVideo = document.querySelector(".video-stream video");
    const streamSource = document.querySelector(".video-stream source");
    const videoCover = document.querySelector(".video-stream .vjs-poster");
    if (streamVideo && streamSource) {
        // Check if video has an actual video file
        if (video.videoSrc && video.videoSrc.trim() !== '') {
            // Video has a video file - play it
            streamVideo.pause();
            streamSource.src = video.videoSrc;
            streamVideo.load();
            
            // Hide the cover if showing
            if (videoCover) {
                videoCover.style.display = 'none';
            }
            
            // Play the video
            setTimeout(() => {
                streamVideo.play().catch(e => {
                    console.log('Video play failed:', e);
                    // If video fails to play, show cover
                    if (videoCover) {
                        videoCover.style.display = 'block';
                    }
                });
            }, 100);
        } else {
            // Video only has image - show the cover image
            streamVideo.pause();
            streamSource.src = '';
            streamVideo.load();
            
            // Show the cover image
            const coverImage = video.coverImg || video.authorImg || getDefaultVideoCover(0);
            if (videoCover) {
                videoCover.style.backgroundImage = `url('${coverImage}')`;
                videoCover.style.backgroundSize = 'cover';
                videoCover.style.backgroundPosition = 'center';
                videoCover.style.display = 'block';
            }
        }
    }
    
    // Show stream view
    const mainContainer = document.querySelector(".main-container");
    if (mainContainer) mainContainer.classList.add("show");
    
    // Scroll to top of stream view
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // ===== CRITICAL LIKE SYSTEM FIX =====
    // Tell the like system which video is playing
    if (window.setCurrentVideoForLikes) {
        window.setCurrentVideoForLikes(video.id);
    }
    // ===== END FIX =====
    
    // ===== CRITICAL CART SYSTEM FIX =====
    // Tell the cart system which video is playing
    if (window.cartSystem && window.cartSystem.updateCurrentVideoForBuy) {
        console.log('🛒 Setting current video for cart:', video.id);
        const videoPrice = parseFloat(video.time) || 0;
        window.cartSystem.updateCurrentVideoForBuy(video.id, videoPrice);
    } else {
        console.log('⚠️ Cart system not available yet');
        // Try to set it directly
        if (window.cartSystem && window.cartSystem.setCurrentVideo) {
            const videoPrice = parseFloat(video.time) || 0;
            window.cartSystem.setCurrentVideo(video.id, videoPrice);
        }
    }
    // ===== END CART FIX =====
    
    // Load comments for this video
    if (window.commentSystem && video.id) {
        console.log('💬 Loading comments for video ID:', video.id);
        
        window.commentSystem.currentVideoId = video.id;
        window.commentSystem.updateUserDisplay();
        
        setTimeout(() => {
            window.commentSystem.loadComments(video.id);
        }, 500);
    } else {
        console.error('❌ Comment system not available or video ID missing');
    }
    
    // Initialize share button
    setTimeout(() => {
        initializeShareButton();
    }, 450);
}

// Get default author images
function getDefaultAuthorImage(index) {
    const defaultImages = [
        'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500',
        'https://images.pexels.com/photos/3370021/pexels-photo-3370021.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500',
        'https://images.pexels.com/photos/1870163/pexels-photo-1870163.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500',
        'https://images.pexels.com/photos/2889942/pexels-photo-2889942.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500'
    ];
    return defaultImages[index % defaultImages.length];
}

// Get default video cover images
function getDefaultVideoCover(index) {
    const defaultCovers = [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2thdGVib2FyZHxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80',
        'https://images.unsplash.com/photo-1547447138-6f813b7f8d17?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHNrYXRlYm9hcmR8ZW58MHx8MHx8fDA%3D&w=1000&q=80',
        'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHNrYXRlYm9hcmR8ZW58MHx8MHx8fDA%3D&w=1000&q=80'
    ];
    return defaultCovers[index % defaultCovers.length];
}

// Set up video interactions
function setupVideoInteractions() {
    const videos = document.querySelectorAll('.video');
    
    videos.forEach(video => {
        const videoElement = video.querySelector('video');
        const videoCover = video.querySelector('.video-cover');
        const videoPlayOverlay = video.querySelector('.video-play-overlay');
        
        if (videoElement && videoElement.src) {
            video.addEventListener('mouseenter', function() {
                if (videoElement.src && !videoElement.src.includes('#')) {
                    if (videoCover) videoCover.style.display = 'none';
                    if (videoPlayOverlay) videoPlayOverlay.style.display = 'none';
                    videoElement.style.display = 'block';
                    
                    videoElement.play().catch(e => {
                        if (videoCover) videoCover.style.display = 'block';
                        if (videoPlayOverlay) videoPlayOverlay.style.display = 'flex';
                        videoElement.style.display = 'none';
                    });
                }
            });
            
            video.addEventListener('mouseleave', function() {
                if (videoElement) {
                    videoElement.pause();
                    videoElement.currentTime = 0;
                    videoElement.style.display = 'none';
                }
                if (videoCover) videoCover.style.display = 'block';
                if (videoPlayOverlay) videoPlayOverlay.style.display = 'flex';
            });
        }
        
        video.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            const videoData = window.currentVideos.find(v => v.id === videoId);
            
            if (videoData) {
                playVideoInStreamView(videoData);
            }
        });
    });
}

// Set up main page events
function setupMainPageEvents() {
    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll(".sidebar-link");
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            sidebarLinks.forEach(l => l.classList.remove("is-active"));
            this.classList.add("is-active");
        });
    });
    
    // Home/Discover click
    const homeElements = document.querySelectorAll(".logo, .logo-expand, .discover");
    homeElements.forEach(element => {
        element.addEventListener('click', function(e) {
            const mainContainer = document.querySelector(".main-container");
            if (mainContainer) {
                mainContainer.classList.remove("show");
                mainContainer.scrollTop = 0;
            }
        });
    });
    
    // Mobile layout
    window.addEventListener('resize', function() {
        const sidebar = document.querySelector(".sidebar");
        if (sidebar) {
            if (window.innerWidth > 1090) {
                sidebar.classList.remove("collapse");
            } else {
                sidebar.classList.add("collapse");
            }
        }
    });
    
    // Trigger initial resize
    window.dispatchEvent(new Event('resize'));
}

// ===== SHARE BUTTON =====
function initializeShareButton() {
    const shareBtn = document.getElementById('shareButton');
    
    if (shareBtn) {
        const newShareBtn = shareBtn.cloneNode(true);
        shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
        
        const freshShareBtn = document.getElementById('shareButton');
        
        freshShareBtn.addEventListener('click', function() {
            shareCurrentVideo();
        });
    }
}

function shareCurrentVideo() {
    const videoTitle = document.querySelector(".video-p-title")?.textContent || 'Skateboard Video';
    const videoAuthor = document.querySelector(".video-p-name")?.textContent || 'Unknown Author';
    const videoId = window.commentSystem?.currentVideoId || '';
    let currentUrl = window.location.href;
    
    currentUrl = currentUrl.split('?')[0];
    
    if (videoId) {
        currentUrl += `?video=${videoId}`;
    }
    
    if (history.replaceState) {
        history.replaceState(null, '', currentUrl);
    }
    
    const shareText = `Check out "${videoTitle}" by ${videoAuthor} on Skateboard Platform!`;
    
    // ALWAYS show our custom share modal (ignore native browser share)
    fallbackShare(shareText, currentUrl, videoTitle);
}

// Fallback share function (modal)
function fallbackShare(shareText, shareUrl, videoTitle) {
    const shareModal = document.createElement('div');
    shareModal.className = 'share-modal';
    shareModal.innerHTML = `
        <div class="share-modal-content">
            <h3>Share "${videoTitle}"</h3>
            <div class="share-options">
                <div class="share-option" data-type="whatsapp">
                    <span class="share-icon">📱</span>
                    <span>WhatsApp</span>
                </div>
                <div class="share-option" data-type="facebook">
                    <span class="share-icon">📘</span>
                    <span>Facebook</span>
                </div>
                <div class="share-option" data-type="twitter">
                    <span class="share-icon">🐦</span>
                    <span>Twitter</span>
                </div>
                <div class="share-option" data-type="instagram">
                    <span class="share-icon">📸</span>
                    <span>Instagram</span>
                </div>
                <div class="share-option" data-type="telegram">
                    <span class="share-icon">✈️</span>
                    <span>Telegram</span>
                </div>
                <div class="share-option" data-type="reddit">
                    <span class="share-icon">👾</span>
                    <span>Reddit</span>
                </div>
                <div class="share-option" data-type="linkedin">
                    <span class="share-icon">💼</span>
                    <span>LinkedIn</span>
                </div>
                <div class="share-option" data-type="email">
                    <span class="share-icon">📧</span>
                    <span>Email</span>
                </div>
                <div class="share-option" data-type="copy">
                    <span class="share-icon">📋</span>
                    <span>Copy Link</span>
                </div>
            </div>
            <div class="share-link" style="display: flex; gap: 10px; margin: 20px 0;">
                <input type="text" value="${shareUrl}" readonly>
                <button class="copy-btn" id="copyLinkBtn">Copy</button>
            </div>
            <div style="text-align: center;">
                <button class="cancel-share">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(shareModal);
    
    // Close modal
    shareModal.addEventListener('click', function(e) {
        if (e.target === this || e.target.classList.contains('cancel-share')) {
            this.style.opacity = '0';
            setTimeout(() => {
                if (this.parentNode) {
                    this.parentNode.removeChild(this);
                }
            }, 300);
        }
    });
    
    // Copy link button
    const copyBtn = shareModal.querySelector('#copyLinkBtn');
    copyBtn.addEventListener('click', function() {
        const input = shareModal.querySelector('input[type="text"]');
        input.select();
        input.setSelectionRange(0, 99999);
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showShareNotification('Link copied to clipboard!');
            } else {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    showShareNotification('Link copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    showShareNotification('Failed to copy link', true);
                });
            }
        } catch (err) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showShareNotification('Link copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy:', err);
                showShareNotification('Failed to copy link', true);
            });
        }
    });
    
    // Platform sharing
    const shareOptions = shareModal.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
        option.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            let shareUrlEncoded = encodeURIComponent(shareUrl);
            let textEncoded = encodeURIComponent(shareText);
            
            let shareWindowUrl = '';
            
            switch(type) {
                case 'whatsapp':
                    shareWindowUrl = `https://wa.me/?text=${textEncoded}%20${shareUrlEncoded}`;
                    break;
                case 'facebook':
                    shareWindowUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`;
                    break;
                case 'twitter':
                    shareWindowUrl = `https://twitter.com/intent/tweet?text=${textEncoded}&url=${shareUrlEncoded}`;
                    break;
                case 'telegram':
                    shareWindowUrl = `https://t.me/share/url?url=${shareUrlEncoded}&text=${textEncoded}`;
                    break;
                case 'linkedin':
                    shareWindowUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrlEncoded}`;
                    break;
                case 'reddit':
                    shareWindowUrl = `https://reddit.com/submit?url=${shareUrlEncoded}&title=${textEncoded}`;
                    break;
                case 'email':
                    shareWindowUrl = `mailto:?subject=${encodeURIComponent(videoTitle)}&body=${textEncoded}%0A%0A${shareUrlEncoded}`;
                    break;
                case 'instagram':
                    showShareNotification('Share to Instagram by copying the link', false);
                    return;
                case 'copy':
                    // Already handled by copy button
                    return;
            }
            
            if (shareWindowUrl) {
                window.open(shareWindowUrl, '_blank', 'width=600,height=400');
            }
        });
    });
    // ===== VIDEO TRACKING FOR LIKE SYSTEM =====
// Add this ONE function ONLY - at the very end of the file:
window.updateLikeButtonForVideo = function(videoId) {
    if (!videoId) return;
    
    // Store the current video ID for the like system
    window.currentPlayingVideoId = videoId;
    console.log(`🎬 Video tracking for like system: ${videoId}`);
    
    // Get the like button and update it
    const btn = document.getElementById('mainLikeBtn');
    if (btn) {
        // Get current like count from video data
        let likes = 0;
        if (window.currentVideos) {
            const video = window.currentVideos.find(v => v.id === videoId);
            if (video) {
                likes = parseInt(video.likes) || 0;
                console.log(`📊 Found ${likes} likes for video: ${videoId}`);
            }
        }
        
        // Update count display
        const countEl = btn.querySelector('.like-count');
        if (countEl) {
            countEl.textContent = likes;
        }
        
        // Check if user liked this specific video
        const isLiked = localStorage.getItem(`user_liked_${videoId}`) === 'true';
        console.log(`❤️ User liked ${videoId}: ${isLiked}`);
        
        if (isLiked) {
            // Liked state - RED
            btn.classList.add('active');
            btn.classList.remove('purple');
            btn.querySelector('svg').style.fill = 'currentColor';
            btn.querySelector('.like-text').textContent = 'Liked';
        } else {
            // Not liked state - PURPLE
            btn.classList.remove('active');
            btn.classList.add('purple');
            btn.querySelector('svg').style.fill = 'none';
            btn.querySelector('.like-text').textContent = 'Like';
        }
    }
};
}
function showShareNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = 'share-notification' + (isError ? ' error' : '');
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

