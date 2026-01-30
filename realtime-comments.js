// ================================================
// REAL-TIME COMMENT UPDATES - FIXED VERSION
// ================================================

class RealTimeCommentUpdater {
    constructor() {
        this.currentVideoId = null;
        this.lastCommentIds = []; // Store IDs instead of count
        this.isRunning = false;
        this.checkInterval = null;
        
        console.log('🔄 Real-time comment updater loaded');
        this.init();
    }
    
    init() {
        // Hook into video opening
        this.hookIntoVideoPlayer();
        
        // Setup cross-tab communication
        this.setupCrossTab();
        
        console.log('✅ Real-time ready');
    }
    
    hookIntoVideoPlayer() {
        // Override the playVideoInStreamView function
        const originalPlayVideo = window.playVideoInStreamView;
        if (originalPlayVideo) {
            window.playVideoInStreamView = function(video) {
                // Call original
                originalPlayVideo(video);
                
                // Start real-time for this video
                if (video && video.id) {
                    setTimeout(() => {
                        if (window.realtimeCommentUpdater) {
                            window.realtimeCommentUpdater.startForVideo(video.id);
                        }
                    }, 1000);
                }
            };
        }
    }
    
    async startForVideo(videoId) {
        if (!videoId) return;
        
        console.log('👀 Starting real-time for video:', videoId);
        
        // Stop previous
        this.stop();
        
        this.currentVideoId = videoId;
        this.isRunning = true;
        
        // Get initial comments and store their IDs
        await this.updateCommentIds();
        
        // Update comment count display
        this.updateCommentCountDisplay(this.lastCommentIds.length);
        
        // Start checking every 2 seconds
        this.checkInterval = setInterval(() => {
            this.checkForUpdates();
        }, 2000);
    }
    
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        this.currentVideoId = null;
        this.lastCommentIds = [];
    }
    
    async updateCommentIds() {
        if (!this.currentVideoId) return;
        
        try {
            const response = await fetch(`https://pazzle-store-api.mus00204.workers.dev/comments?video=${this.currentVideoId}`);
            if (response.ok) {
                const comments = await response.json();
                this.lastCommentIds = comments.map(c => c.id);
                console.log(`📥 Stored ${this.lastCommentIds.length} comment IDs`);
            }
        } catch (error) {
            console.log('❌ Failed to get comments:', error);
        }
    }
    
    async checkForUpdates() {
        if (!this.isRunning || !this.currentVideoId) return;
        
        try {
            const response = await fetch(`https://pazzle-store-api.mus00204.workers.dev/comments?video=${this.currentVideoId}&_=${Date.now()}`);
            if (response.ok) {
                const currentComments = await response.json();
                const currentIds = currentComments.map(c => c.id);
                
                // Find new comments (IDs in current but not in last)
                const newCommentIds = currentIds.filter(id => !this.lastCommentIds.includes(id));
                
                if (newCommentIds.length > 0) {
                    console.log(`🎉 Found ${newCommentIds.length} new comment(s)!`);
                    
                    // Update stored IDs
                    this.lastCommentIds = currentIds;
                    
                    // Update comment count display
                    this.updateCommentCountDisplay(currentIds.length);
                    
                    // Refresh the comments display
                    this.refreshComments();
                    
                    // Show notification
                    this.showNotification(newCommentIds.length);
                    
                    // Notify other tabs
                    this.notifyOtherTabs();
                }
                
                // Also update count if comments were deleted
                if (currentIds.length !== this.lastCommentIds.length) {
                    this.updateCommentCountDisplay(currentIds.length);
                }
            }
        } catch (error) {
            console.log('❌ Check failed:', error);
        }
    }
    
    refreshComments() {
        // Refresh using existing comment system
        if (window.commentSystem && this.currentVideoId) {
            window.commentSystem.loadComments(this.currentVideoId);
        } else if (window.cs && this.currentVideoId) {
            window.cs.loadComments(this.currentVideoId);
        }
    }
    
    // UPDATE COMMENT COUNT IN HEADER
    updateCommentCountDisplay(count) {
        // Look for the comments header
        const commentsHeader = document.querySelector('.comments-header h3');
        if (commentsHeader) {
            commentsHeader.textContent = `Comments (${count})`;
            return;
        }
        
        // If not found by that selector, try other ways
        const allH3 = document.querySelectorAll('h3');
        allH3.forEach(h3 => {
            if (h3.textContent.includes('Comments') || 
                h3.textContent.includes('comments') ||
                h3.textContent.match(/Comments\s*\(\d+\)/)) {
                h3.textContent = `Comments (${count})`;
            }
        });
        
        // Also check for any element containing "Comments ("
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.textContent && el.textContent.includes('Comments (')) {
                el.textContent = `Comments (${count})`;
            }
        });
    }
    
    showNotification(count) {
        // Don't show if page is hidden
        if (document.hidden) return;
        
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #6c5ecf;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10002;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease;
            ">
                <span>💬 ${count} new comment${count > 1 ? 's' : ''}</span>
                <button style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                ">✕</button>
            </div>
        `;
        
        // Add animation styles
        if (!document.getElementById('rt-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'rt-notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        const container = notification.querySelector('div');
        const closeBtn = notification.querySelector('button');
        
        // Close button
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            container.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };
        
        // Click notification to refresh
        container.onclick = (e) => {
            if (e.target !== closeBtn) {
                this.refreshComments();
                container.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        };
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                container.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }
    
    setupCrossTab() {
        // Listen for updates from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'rt_comment_update') {
                try {
                    const data = JSON.parse(e.newValue || '{}');
                    if (data.videoId === this.currentVideoId) {
                        console.log('📡 Update from other tab detected');
                        setTimeout(() => this.checkForUpdates(), 500);
                    }
                } catch (e) {
                    // Ignore errors
                }
            }
        });
    }
    
    notifyOtherTabs() {
        if (!this.currentVideoId) return;
        
        localStorage.setItem('rt_comment_update', JSON.stringify({
            videoId: this.currentVideoId,
            timestamp: Date.now()
        }));
    }
}

// Create instance when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.realtimeCommentUpdater = new RealTimeCommentUpdater();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (window.realtimeCommentUpdater) {
            window.realtimeCommentUpdater.stop();
        }
    });
    
    // Also listen for page visibility changes
    document.addEventListener('visibilitychange', function() {
        if (window.realtimeCommentUpdater) {
            if (document.hidden) {
                window.realtimeCommentUpdater.isRunning = false;
            } else {
                window.realtimeCommentUpdater.isRunning = true;
                if (window.realtimeCommentUpdater.currentVideoId) {
                    setTimeout(() => {
                        window.realtimeCommentUpdater.checkForUpdates();
                    }, 1000);
                }
            }
        }
    });
});