// ================================================
// WORKING COMMENT SYSTEM - WITH ORIGINAL NICKNAME BOX
// ================================================

console.log('🎬 Loading comment system...');

class CommentSystem {
    constructor() {
        this.currentUser = this.getOrCreateUser();
        this.currentVideoId = null;
        this.comments = [];
        this.replyingTo = null; // Track which comment we're replying to
        
        console.log('✅ System ready for:', this.currentUser.name);
    }
    
    getOrCreateUser() {
        let user = localStorage.getItem('videoCommentUser');
        
        if (!user) {
            user = {
                id: 'user_' + Math.random().toString(36).substr(2, 9),
                name: 'Skater' + Math.floor(Math.random() * 999),
                avatar: '🔥',
                hasChangedName: false
            };
            localStorage.setItem('videoCommentUser', JSON.stringify(user));
        } else {
            user = JSON.parse(user);
        }
        
        return user;
    }
    
updateUserDisplay() {
    const userBtn = document.getElementById('commentUserBtn');
    if (userBtn) {
        // Check if avatar is an image (ends with .jpg, .png, .jpeg, .gif, .webp, or contains http)
        const isImage = this.currentUser.avatar && (
            this.currentUser.avatar.includes('.jpg') || 
            this.currentUser.avatar.includes('.png') || 
            this.currentUser.avatar.includes('.jpeg') ||
            this.currentUser.avatar.includes('.gif') ||
            this.currentUser.avatar.includes('.webp') ||
            this.currentUser.avatar.includes('http') ||
            this.currentUser.avatar.includes('./avatars/')
        );
        
        userBtn.innerHTML = `
            <span class="user-avatar-mini clickable-avatar" style="
                ${isImage ? 'background: transparent; padding: 0; width: 32px; height: 32px;' : ''}
            ">
                ${isImage ? 
                  `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" 
                        style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"
                        onerror="this.onerror=null; this.src='./avatars/avatar1.jpg';">` : 
                  this.currentUser.avatar}
            </span>
            <span class="user-name-mini ${this.currentUser.hasChangedName ? 'name-changed' : 'name-changeable'}">
                <strong>${this.currentUser.name}</strong>
                ${this.currentUser.hasChangedName ? ' ✓' : ' ✎'}
            </span>
        `;
    }
    
    // Update comment input avatar
    const inputAvatar = document.querySelector('.comment-input-avatar');
    if (inputAvatar) {
        const isImage = this.currentUser.avatar && (
            this.currentUser.avatar.includes('.jpg') || 
            this.currentUser.avatar.includes('.png') || 
            this.currentUser.avatar.includes('.jpeg') ||
            this.currentUser.avatar.includes('.gif') ||
            this.currentUser.avatar.includes('.webp') ||
            this.currentUser.avatar.includes('http') ||
            this.currentUser.avatar.includes('./avatars/')
        );
        
        if (isImage) {
            inputAvatar.innerHTML = `
                <img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" 
                     style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"
                     onerror="this.onerror=null; this.src='./avatars/avatar1.jpg';">`;
            inputAvatar.className = 'comment-input-avatar clickable-avatar';
        } else {
            inputAvatar.textContent = this.currentUser.avatar;
            inputAvatar.className = 'comment-input-avatar clickable-avatar';
        }
    }
}
    
    showNameChangeDialog() {
        // YOUR ORIGINAL NAME CHANGE DIALOG
        if (this.currentUser.hasChangedName) {
            alert('You can only change your name once!');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'comment-settings-modal';
        modal.innerHTML = `
            <div class="comment-settings-content">
                <h3>Change Your Nickname</h3>
                <p style="color: #808191; margin-bottom: 20px; font-size: 14px; text-align: center;">
                    You can only change your nickname <strong>once</strong>. Choose wisely!
                </p>
                
                <div class="current-user-info" style="margin: 20px 0; padding: 15px; background: var(--button-bg); border-radius: 12px; text-align: center;">
                <div class="user-avatar-preview">
                 ${this.currentUser.avatar && (this.currentUser.avatar.includes('.jpg') || this.currentUser.avatar.includes('.png') || this.currentUser.avatar.includes('.jpeg') || this.currentUser.avatar.includes('.gif') || this.currentUser.avatar.includes('.webp') || this.currentUser.avatar.includes('http') || this.currentUser.avatar.includes('./avatars/')) ? `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}">` : this.currentUser.avatar}
                </div>                    <div class="user-name-preview" style="color: #fff; font-size: 16px; font-weight: bold;">
                        Current: <span style="color: #6c5ecf;">${this.currentUser.name}</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label style="color: #fff; margin-bottom: 8px; display: block;">New Nickname</label>
                    <div style="margin-top: 15px;">
                        <input type="text" id="customUserName" placeholder="Type your new nickname..." 
                               style="width: 100%; padding: 12px; background: var(--button-bg); border: 1px solid var(--border-color); border-radius: 8px; color: #fff; font-size: 14px;">
                    </div>
                </div>
                
                <div class="button-group" style="display: flex; gap: 10px; margin-top: 25px;">
                    <button class="save-btn" style="flex: 1; background: #6c5ecf; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 500; cursor: pointer;">Save Changes</button>
                    <button class="cancel-btn" style="flex: 1; background: transparent; color: #808191; border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        const saveBtn = modal.querySelector('.save-btn');
        saveBtn.addEventListener('click', () => {
            const customInput = modal.querySelector('#customUserName');
            const newName = customInput.value.trim();
            
            if (newName && newName.length >= 3) {
                this.currentUser.name = newName;
                this.currentUser.hasChangedName = true;
                localStorage.setItem('videoCommentUser', JSON.stringify(this.currentUser));
                this.updateUserDisplay();
                document.body.removeChild(modal);
               
            } else {
                alert('Please enter a name with at least 3 characters');
            }
        });
        
        modal.querySelector('#customUserName').focus();
    }
    
async showAvatarChangeDialog() {
    let imageAvatars = [];
    
    try {
        // Try to fetch all images from avatars folder using PHP script
        const response = await fetch('./get-avatars.php');
        if (response.ok) {
            const serverAvatars = await response.json();
            if (serverAvatars && serverAvatars.length > 0) {
                imageAvatars = serverAvatars;
                console.log('Found avatars from server:', imageAvatars.length);
            }
        }
    } catch (error) {
        console.log('Server fetch failed, using fallback:', error);
    }
    
    // If no avatars from server, use fallback numbered avatars
    if (imageAvatars.length === 0) {
        console.log('Using fallback avatars');
        for (let i = 1; i <= 12; i++) {
            imageAvatars.push(`./avatars/avatar${i}.jpg`);
        }
    }
    
    // Create the modal
    const modal = document.createElement('div');
    modal.className = 'comment-settings-modal';
    modal.innerHTML = `
        <div class="comment-settings-content">
            <h3>Choose Your Avatar</h3>
            
            <div class="current-user-info">
                <div class="user-avatar-preview">
                    ${this.currentUser.avatar && (this.currentUser.avatar.includes('.jpg') || this.currentUser.avatar.includes('.png') || this.currentUser.avatar.includes('.jpeg') || this.currentUser.avatar.includes('.gif') || this.currentUser.avatar.includes('.webp') || this.currentUser.avatar.includes('http')) ? 
                      `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" onerror="this.onerror=null; this.src='./avatars/avatar1.jpg';">` : 
                      `<div>${this.currentUser.avatar || '👤'}</div>`}
                </div>
                <div class="user-name-preview">
                    Current avatar for: <strong>${this.currentUser.name}</strong>
                </div>
            </div>
            
            <div class="form-group">
                <label>Choose Profile Picture (${imageAvatars.length} available)</label>
                <div class="avatar-grid" style="margin-top: 10px;">
                    ${imageAvatars.map((url, index) => `
                        <div class="avatar-option ${this.currentUser.avatar === url ? 'selected' : ''}" 
                             data-avatar="${url}">
                            <img src="${url}" alt="Avatar ${index + 1}"
                                 style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                                 onerror="this.onerror=null; this.src='./avatars/avatar1.jpg';">
                        </div>
                    `).join('')}
                </div>
                
                <label style="margin-top: 20px;">Or Choose Emoji</label>
                <div class="avatar-grid">
                    ${this.getAvatarOptions()}
                </div>
            </div>
            
            <div class="button-group">
                <button class="cancel-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Image avatar selection - NOW USES SAME CLASS AS EMOJIS
    modal.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', () => {
            const newAvatar = option.dataset.avatar;
            this.currentUser.avatar = newAvatar;
            localStorage.setItem('videoCommentUser', JSON.stringify(this.currentUser));
            this.updateUserDisplay();
            document.body.removeChild(modal);
        });
    });
}
    
   getAvatarOptions() {
    const emojis = [
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒',
        '🚐', '🚚', '🚛', '🚜', '🛻', '🚔', '🚍', '🚘', '🚖',
        '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅',
        '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '🛹', '🔥', '⭐'
    ];
    
    return emojis.map(emoji => 
        `<div class="avatar-option ${emoji === this.currentUser.avatar ? 'selected' : ''}" 
              data-avatar="${emoji}">${emoji}</div>`
    ).join('');
}
    
    async loadComments(videoId) {
        this.currentVideoId = videoId;
        
        try {
            const response = await fetch(`https://pazzle-store-api.mus00204.workers.dev/comments?video=${videoId}`);
            if (response.ok) {
                this.comments = await response.json();
                this.showComments();
            }
        } catch (error) {
            console.error('Load error:', error);
            this.comments = [];
            this.showComments();
        }
    }
    
    showComments() {
        const container = document.getElementById('commentsList');
        if (!container) return;
        
        if (this.comments.length === 0) {
            container.innerHTML = '<div class="no-comments">No comments yet</div>';
              this.updateCommentCountDisplay(0);
            return;
        }
        
        let html = '';
        
        // First, create a map of comments by ID for easy lookup
        const commentMap = {};
        this.comments.forEach(comment => {
            commentMap[comment.id] = comment;
            comment.replies = [];
        });
        
        // Build a tree structure
        const rootComments = [];
        this.comments.forEach(comment => {
            if (comment.parentId) {
                // This is a reply, add it to parent's replies
                if (commentMap[comment.parentId]) {
                    if (!commentMap[comment.parentId].replies) {
                        commentMap[comment.parentId].replies = [];
                    }
                    commentMap[comment.parentId].replies.push(comment);
                }
            } else {
                // This is a root comment
                rootComments.push(comment);
            }
        });
        
          // Sort root comments by timestamp (newest first)
        rootComments.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        // Render the tree
        rootComments.forEach(comment => {
            html += this.renderCommentWithReplies(comment, 0);
        });
        
        container.innerHTML = html;
         // UPDATE COMMENT COUNT - ADD THIS LINE
        this.updateCommentCountDisplay(this.comments.length);
    }
     // ADD THIS NEW METHOD to the CommentSystem class
    updateCommentCountDisplay(count) {
        const commentsHeader = document.querySelector('.comments-header h3');
        if (commentsHeader) {
            commentsHeader.textContent = `Comments (${count})`;
        }
    }
    
renderCommentWithReplies(comment, level) {
    const isOwn = comment.userId === this.currentUser.id;
    const isLiked = comment.likedBy && comment.likedBy.includes(this.currentUser.id);
    
    // DEBUG: Check what avatar we have
    console.log('Rendering comment avatar:', comment.userAvatar);
    console.log('Is image?', comment.userAvatar && (
        comment.userAvatar.includes('.jpg') || 
        comment.userAvatar.includes('.png') || 
        comment.userAvatar.includes('.jpeg') ||
        comment.userAvatar.includes('.gif') ||
        comment.userAvatar.includes('.webp') ||
        comment.userAvatar.includes('http')
    ));
    
    // SIMPLE FIX: Always check if it contains a dot (.) for image files
    let avatarHTML = '👤'; // default
    
    if (comment.userAvatar) {
        // If it contains ANY dot, treat it as an image URL
        if (comment.userAvatar.includes('.')) {
            avatarHTML = `<img src="${comment.userAvatar}" alt="${comment.userName}" 
                           style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                           onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='👤';">`;
        } else {
            // It's an emoji
            avatarHTML = comment.userAvatar;
        }
    }
    
    let html = `
        <div class="comment-item" data-id="${comment.id}" data-level="${level}">
            <div class="comment-avatar">${avatarHTML}</div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${comment.userName}</span>
                    <span class="comment-time">${this.getTime(comment.timestamp)}</span>
                    ${isOwn ? `<button class="comment-delete-btn" onclick="window.commentSystem.deleteNow('${comment.id}')">🗑️</button>` : ''}
                </div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-actions">
                    <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="window.commentSystem.likeNow('${comment.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor">
                            <path d="M14 20.408c-.492.308-.903.546-1.192.709-.153.086-.308.17-.463.252h-.002a.75.75 0 01-.686 0 16.709 16.709 0 01-.465-.252 31.147 31.147 0 01-4.803-3.34C3.8 15.572 1 12.331 1 8.513 1 5.052 3.829 2.5 6.736 2.5 9.03 2.5 10.881 3.726 12 5.605 13.12 3.726 14.97 2.5 17.264 2.5 20.17 2.5 23 5.052 23 8.514c0 3.818-2.801 7.06-5.389 9.262A31.146 31.146 0 0114 20.408z"/>
                        </svg>
                        <span>${comment.likes || 0}</span>
                    </button>
                    <button class="reply-btn" onclick="window.commentSystem.replyTo('${comment.id}', this)">Reply</button>
                </div>
            </div>
        </div>
    `;
    
    // Add replies if any
    if (comment.replies && comment.replies.length > 0) {
        html += '<div class="comment-replies">';
        
        // Sort replies by timestamp (newest first)
        const sortedReplies = comment.replies.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        sortedReplies.forEach(reply => {
            html += this.renderCommentWithReplies(reply, level + 1);
        });
        html += '</div>';
    }
    
    return html;
}
    
    getTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        return date.toLocaleDateString();
    }
    
async addComment(text, parentId = null) {
    if (!text.trim()) {
        alert('Enter a comment');
        return;
    }
    
    if (!this.currentVideoId) {
        alert('Select a video first');
        return;
    }
    
    console.log('Current user avatar:', this.currentUser.avatar); // DEBUG
    
    const comment = {
        videoId: this.currentVideoId,
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        userAvatar: this.currentUser.avatar, // This should be './avatars/avatar1.jpg' etc.
        text: text.trim(),
        parentId: parentId,
        timestamp: new Date().toISOString()
    };
    
    console.log('Sending comment with avatar:', comment.userAvatar); // DEBUG
    

        
        try {
            const response = await fetch('./comments.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(comment)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Clear input
                if (parentId) {
                    const replyBox = document.querySelector('.reply-box');
                    if (replyBox) replyBox.remove();
                    this.replyingTo = null;
                } else {
                    document.getElementById('commentInput').value = '';
                }
                
                // Reload comments
                await this.loadComments(this.currentVideoId);
            }
        } catch (error) {
            console.error('Add error:', error);
            alert('Error posting comment');
        }
    }
    
    async deleteNow(commentId) {
        // Delete immediately - no confirmation
        try {
            await fetch('./comments.php', {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    commentId: commentId,
                    userId: this.currentUser.id
                })
            });
            
            // Remove from UI
            const element = document.querySelector(`[data-id="${commentId}"]`);
            if (element) element.remove();
            
        } catch (error) {
            console.error('Delete error:', error);
        }
    }
    
    async likeNow(commentId) {
        try {
            await fetch('./comments.php', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    commentId: commentId,
                    userId: this.currentUser.id
                })
            });
            
            // Update UI
            const likeBtn = document.querySelector(`.like-btn[onclick*="${commentId}"]`);
            if (likeBtn) {
                const isLiked = likeBtn.classList.contains('liked');
                const countSpan = likeBtn.querySelector('span');
                const svg = likeBtn.querySelector('svg');
                
                if (isLiked) {
                    likeBtn.classList.remove('liked');
                    svg.style.fill = 'none';
                    if (countSpan) {
                        countSpan.textContent = parseInt(countSpan.textContent) - 1;
                    }
                } else {
                    likeBtn.classList.add('liked');
                    svg.style.fill = 'currentColor';
                    if (countSpan) {
                        countSpan.textContent = parseInt(countSpan.textContent) + 1;
                    }
                }
            }
        } catch (error) {
            console.error('Like error:', error);
        }
    }
    
    replyTo(commentId, button) {
        // Set replying to this comment
        this.replyingTo = commentId;
        
        // Remove any existing reply boxes
        const existing = document.querySelector('.reply-box');
        if (existing) existing.remove();
        
        const commentElement = button.closest('.comment-item');
        if (!commentElement) return;
        
        // Find where to insert the reply box (after the comment actions)
        const commentActions = commentElement.querySelector('.comment-actions');
        if (!commentActions) return;
        
        const replyDiv = document.createElement('div');
        replyDiv.className = 'reply-box';
        replyDiv.innerHTML = `
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <div class="comment-input-avatar">
    ${this.currentUser.avatar && (this.currentUser.avatar.includes('.jpg') || this.currentUser.avatar.includes('.png') || this.currentUser.avatar.includes('.jpeg') || this.currentUser.avatar.includes('.gif') || this.currentUser.avatar.includes('.webp') || this.currentUser.avatar.includes('http') || this.currentUser.avatar.includes('./avatars/')) ? 
      `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : 
      this.currentUser.avatar}
</div>                <div style="flex: 1;">
                    <textarea placeholder="Write a reply..." rows="2" style="width: 100%; padding: 8px; background: #353340; border: 1px solid #40434f; border-radius: 6px; color: white;"></textarea>
                    <div style="display: flex; gap: 10px; margin-top: 8px;">
                        <button onclick="this.closest('.reply-box').remove(); window.commentSystem.replyingTo = null;" 
                                style="background: transparent; color: #808191; border: 1px solid #40434f; padding: 6px 12px; border-radius: 6px;">Cancel</button>
                        <button onclick="window.commentSystem.sendReply('${commentId}', this)" 
                                style="background: #6c5ecf; color: white; border: none; padding: 6px 12px; border-radius: 6px;">Reply</button>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after the comment actions
        commentActions.parentNode.insertBefore(replyDiv, commentActions.nextSibling);
        replyDiv.querySelector('textarea').focus();
    }
    
    sendReply(commentId, button) {
        const replyDiv = button.closest('.reply-box');
        const textarea = replyDiv.querySelector('textarea');
        const text = textarea.value.trim();
        
        if (text) {
            this.addComment(text, commentId);
        }
    }
    
    setupListeners() {
        console.log('🔧 Setting up listeners');
        
        // Submit comment
        const submitBtn = document.getElementById('submitCommentBtn');
        if (submitBtn) {
            submitBtn.onclick = (e) => {
                e.preventDefault();
                const text = document.getElementById('commentInput').value;
                this.addComment(text, null);
            };
        }
        
        // Cancel button
        const cancelBtn = document.querySelector('.cancel-comment-btn');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                document.getElementById('commentInput').value = '';
            };
        }
        
        // User info button - YOUR ORIGINAL DESIGN
        const userBtn = document.getElementById('commentUserBtn');
        if (userBtn) {
            userBtn.onclick = (e) => {
                if (e.target.classList.contains('user-name-mini') || 
                    e.target.closest('.user-name-mini')) {
                    this.showNameChangeDialog();
                }
                if (e.target.classList.contains('clickable-avatar') || 
                    e.target.closest('.clickable-avatar')) {
                    this.showAvatarChangeDialog();
                }
            };
        }
        
        // Enter key for main comment
        const commentInput = document.getElementById('commentInput');
        if (commentInput) {
            commentInput.onkeydown = (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    this.addComment(e.target.value, null);
                }
            };
        }
    }
    
    init() {
        this.updateUserDisplay();
        this.setupListeners();
        console.log('✅ System ready');
    }
}

// ===== SHARE BUTTON FUNCTIONS =====

// Function to initialize share button
function initializeShareButton() {
    const shareBtn = document.getElementById('shareButton');
    
    if (shareBtn) {
        // Remove any existing listeners
        const newShareBtn = shareBtn.cloneNode(true);
        shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
        
        // Get fresh reference
        const freshShareBtn = document.getElementById('shareButton');
        
        freshShareBtn.addEventListener('click', function() {
            shareCurrentVideo();
        });
    }
}

// Function to share current video
function shareCurrentVideo() {
    // Get current video details
    const videoTitle = document.querySelector(".video-p-title")?.textContent || 'Skateboard Video';
    const videoAuthor = document.querySelector(".video-p-name")?.textContent || 'Unknown Author';
    const videoId = window.commentSystem?.currentVideoId || '';
    let currentUrl = window.location.href;
    
    // Clean URL - remove existing video parameters
    currentUrl = currentUrl.split('?')[0];
    
    // Add video ID to URL for direct linking
    if (videoId) {
        currentUrl += `?video=${videoId}`;
    }
    
    // Update browser URL without reloading
    if (history.replaceState) {
        history.replaceState(null, '', currentUrl);
    }
    
    // Create share text
    const shareText = `Check out "${videoTitle}" by ${videoAuthor} on Skateboard Platform!`;
    
    // Use native Web Share API if available (mobile/desktop)
    if (navigator.share) {
        navigator.share({
            title: videoTitle,
            text: shareText,
            url: currentUrl
        })
        .then(() => console.log('Shared successfully'))
        .catch(error => {
            console.log('Share failed:', error);
            // Only show fallback if user didn't cancel
            if (error.name !== 'AbortError') {
                fallbackShare(shareText, currentUrl, videoTitle);
            }
        });
    } else {
        // Fallback for browsers without Web Share API
        fallbackShare(shareText, currentUrl, videoTitle);
    }
}

// Fallback share modal
function fallbackShare(shareText, url, title) {
    // Create a modal with share options
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
        <div class="share-modal-content">
            <h3>Share Video</h3>
            <p style="color: #808191; text-align: center; margin-bottom: 20px; font-size: 14px;">
                Share "${title}" with others
            </p>
            
            <div class="share-options">
                <button class="share-option" data-type="copy" title="Copy link">
                    <span class="share-icon">📋</span>
                    <span>Copy Link</span>
                </button>
                <button class="share-option" data-type="whatsapp" title="Share on WhatsApp">
                    <span class="share-icon"><i class="fab fa-whatsapp"></i></span>
                    <span>WhatsApp</span>
                </button>
                <button class="share-option" data-type="facebook" title="Share on Facebook">
                    <span class="share-icon"><i class="fab fa-facebook-f"></i></span>
                    <span>Facebook</span>
                </button>
                <button class="share-option" data-type="twitter" title="Share on Twitter">
                    <span class="share-icon"><i class="fab fa-twitter"></i></span>
                    <span>Twitter</span>
                </button>
                <button class="share-option" data-type="instagram" title="Share on Instagram">
                    <span class="share-icon"><i class="fab fa-instagram"></i></span>
                    <span>Instagram</span>
                </button>
                <button class="share-option" data-type="telegram" title="Share on Telegram">
                    <span class="share-icon"><i class="fab fa-telegram-plane"></i></span>
                    <span>Telegram</span>
                </button>
                <button class="share-option" data-type="reddit" title="Share on Reddit">
                    <span class="share-icon"><i class="fab fa-reddit-alien"></i></span>
                    <span>Reddit</span>
                </button>
                <button class="share-option" data-type="linkedin" title="Share on LinkedIn">
                    <span class="share-icon"><i class="fab fa-linkedin-in"></i></span>
                    <span>LinkedIn</span>
                </button>
                <button class="share-option" data-type="email" title="Share via Email">
                    <span class="share-icon"><i class="fas fa-envelope"></i></span>
                    <span>Email</span>
                </button>
            </div>
            
            <div class="share-link" style="margin-top: 20px;">
                <div style="font-size: 12px; color: #808191; margin-bottom: 8px;">Video Link:</div>
                <div style="display: flex; gap: 10px;">
                    <input type="text" readonly value="${url}" id="shareUrlInput" 
                           style="flex: 1; padding: 12px; background: var(--button-bg); border: 1px solid var(--border-color); border-radius: 8px; color: #fff; font-size: 14px;">
                    <button class="copy-btn" style="background: #6c5ecf; color: white; border: none; padding: 0 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">Copy</button>
                </div>
            </div>
            
            <div class="share-actions" style="display: flex; justify-content: center; margin-top: 25px;">
                <button class="cancel-share" style="background: transparent; color: #808191; border: 1px solid var(--border-color); padding: 10px 30px; border-radius: 8px; cursor: pointer; font-size: 14px;">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add click handlers
    modal.querySelector('.cancel-share').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Copy button
    modal.querySelector('.copy-btn').addEventListener('click', () => {
        const input = modal.querySelector('#shareUrlInput');
        input.select();
        copyToClipboard(url);
        showNotification('✅ Link copied to clipboard!');
    });
    
    // Share option handlers
    modal.querySelectorAll('.share-option').forEach(option => {
        option.addEventListener('click', () => {
            const type = option.dataset.type;
            handleShareOption(type, shareText, url);
            
            // Close modal after sharing
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 500);
        });
    });
    
    // Auto-select the URL text
    setTimeout(() => {
        const input = modal.querySelector('#shareUrlInput');
        input.select();
    }, 100);
}

// Handle specific share options
function handleShareOption(type, text, url) {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    
    let shareUrl = '';
    const windowFeatures = 'width=600,height=400,menubar=no,toolbar=no,location=no,status=no';
    
    switch(type) {
        case 'copy':
            copyToClipboard(url);
            showNotification('✅ Link copied to clipboard!');
            return;
            
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
            break;
            
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
            break;
            
        case 'twitter':
            const tweetText = encodeURIComponent(`${text} ${url}`);
            shareUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
            break;
            
        case 'instagram':
            // Instagram doesn't have direct share URL, so we copy to clipboard
            copyToClipboard(url);
            showNotification('✅ Link copied! Paste it in your Instagram story or post.');
            return;
            
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
            break;
            
        case 'reddit':
            shareUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
            break;
            
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
            break;
            
        case 'email':
            const subject = encodeURIComponent('Check out this skateboard video!');
            const body = encodeURIComponent(`${text}\n\n${url}`);
            shareUrl = `mailto:?subject=${subject}&body=${body}`;
            // For email, we want to open mail client, not new window
            window.location.href = shareUrl;
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', windowFeatures);
    }
}

// Copy to clipboard function
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard:', text);
    }).catch(err => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            console.log('Fallback copy successful');
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    });
}

// Show notification function
function showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.share-notification');
    if (existing) {
        document.body.removeChild(existing);
    }
    
    const notification = document.createElement('div');
    notification.className = 'share-notification';
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

// ===== LIKE BUTTON FUNCTIONS =====

// Function to initialize main video like button
function initializeMainVideoLikeButton() {
    const likeBtn = document.getElementById('likeButton');
    const dislikeBtn = document.getElementById('dislikeButton');
    
    if (likeBtn && dislikeBtn) {
        // Remove existing event listeners first
        const newLikeBtn = likeBtn.cloneNode(true);
        const newDislikeBtn = dislikeBtn.cloneNode(true);
        
        likeBtn.parentNode.replaceChild(newLikeBtn, likeBtn);
        dislikeBtn.parentNode.replaceChild(newDislikeBtn, dislikeBtn);
        
        // Get fresh references
        const freshLikeBtn = document.getElementById('likeButton');
        const freshDislikeBtn = document.getElementById('dislikeButton');
        
        // Check localStorage for liked status
        const videoTitle = document.querySelector(".video-p-title")?.textContent || '';
        const likedKey = `liked_${videoTitle}`;
        const isLiked = localStorage.getItem(likedKey) === 'true';
        
        // Set initial state
        if (isLiked) {
            freshLikeBtn.style.display = 'none';
            freshDislikeBtn.style.display = 'flex';
        } else {
            freshLikeBtn.style.display = 'flex';
            freshDislikeBtn.style.display = 'none';
        }
        
        // Like button click
        freshLikeBtn.addEventListener('click', function() {
            localStorage.setItem(likedKey, 'true');
            freshLikeBtn.style.display = 'none';
            freshDislikeBtn.style.display = 'flex';
            
            // Show animation or notification
            showLikeNotification();
        });
        
        // Dislike button click
        freshDislikeBtn.addEventListener('click', function() {
            localStorage.removeItem(likedKey);
            freshLikeBtn.style.display = 'flex';
            freshDislikeBtn.style.display = 'none';
        });
    }
}

// Function to show like notification
function showLikeNotification() {
    const notification = document.createElement('div');
    notification.className = 'like-notification';
    notification.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span>Liked!</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after animation
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

// ===== VIDEO COVER HELPERS =====

window.getDefaultAuthorImage = function(index) {
    const defaultImages = [
        'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500',
        'https://images.pexels.com/photos/3370021/pexels-photo-3370021.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500',
        'https://images.pexels.com/photos/1870163/pexels-photo-1870163.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500',
        'https://images.pexels.com/photos/2889942/pexels-photo-2889942.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500'
    ];
    return defaultImages[index % defaultImages.length];
};

window.getDefaultVideoCover = function(index) {
    const defaultCovers = [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2thdGVib2FyZHxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80',
        'https://images.unsplash.com/photo-1547447138-6f813b7f8d17?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHNrYXRlYm9hcmR8ZW58MHx8MHx8fDA%3D&w=1000&q=80',
        'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHNrYXRlYm9hcmR8ZW58MHx8MHx8fDA%3D&w=1000&q=80'
    ];
    return defaultCovers[index % defaultCovers.length];
};

// ===== MAIN PLAY VIDEO FUNCTION =====

window.playVideoInStreamView = function(video) {
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
    
    // CRITICAL FIX: Load comments for this video with the ACTUAL video ID
    if (window.commentSystem && video.id) {
        console.log('💬 Loading comments for video ID:', video.id);
        
        // Set the current video ID in the comment system
        window.commentSystem.currentVideoId = video.id;
        
        // Update the user display with current video context
        window.commentSystem.updateUserDisplay();
        
        // Load comments for this specific video
        setTimeout(() => {
            window.commentSystem.loadComments(video.id);
        }, 500);
    } else {
        console.error('❌ Comment system not available or video ID missing');
    }
    
    // Initialize like button when video changes
    setTimeout(() => {
        initializeMainVideoLikeButton();
    }, 100);
    
    // Initialize share button when video changes
    setTimeout(() => {
        initializeShareButton();
    }, 100);
};

// ===== INITIALIZE EVERYTHING ON PAGE LOAD =====

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM ready - initializing comment system');
    
    // Create and initialize the comment system
    window.commentSystem = new CommentSystem();
    window.cs = window.commentSystem; // Keep both for compatibility
    window.commentSystem.init();
    
    // Initialize share button on page load
    setTimeout(() => {
        initializeShareButton();
    }, 500);
    
    // Initialize like button on page load (for default video)
    setTimeout(() => {
        initializeMainVideoLikeButton();
    }, 500);
});