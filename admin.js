// Add shuffle button event listener
document.addEventListener('DOMContentLoaded', function() {
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', function() {
            console.log('🔀 Shuffle button clicked');
            loadVideos(); // This will reshuffle since loadVideos() uses shuffleArray
        });
    }
});

// Function to shuffle array randomly
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

console.log('Admin script starting...');

// API Configuration - UPDATED for Cloudflare Worker
const API_URL = 'https://pazzle-store-api.mus00204.workers.dev';

// Track file usage
let fileChoiceMade = false;
let chosenFileType = null;

// Function to update file input availability
function updateFileInputAvailability() {
    const videoFileInput = document.getElementById('videoFile');
    const imageFileInput = document.getElementById('authorImageFile');
    const videoFileStatus = document.getElementById('videoFileStatus');
    const imageFileStatus = document.getElementById('imageFileStatus');

    if (fileChoiceMade) {
        if (chosenFileType === 'video') {
            videoFileInput.disabled = false;
            imageFileInput.disabled = true;
            
            if (videoFileStatus) {
                videoFileStatus.textContent = 'Video file selected';
                videoFileStatus.className = 'file-status used';
            }
            if (imageFileStatus) {
                imageFileStatus.textContent = 'Cannot upload image when video is selected';
                imageFileStatus.className = 'file-status unavailable';
            }
        } else if (chosenFileType === 'image') {
            videoFileInput.disabled = true;
            imageFileInput.disabled = false;
            
            if (videoFileStatus) {
                videoFileStatus.textContent = 'Cannot upload video when image is selected';
                videoFileStatus.className = 'file-status unavailable';
            }
            if (imageFileStatus) {
                imageFileStatus.textContent = 'Image file selected';
                imageFileStatus.className = 'file-status used';
            }
        }
    } else {
        videoFileInput.disabled = false;
        imageFileInput.disabled = false;
        
        if (videoFileStatus) {
            videoFileStatus.textContent = '';
            videoFileStatus.className = 'file-status';
        }
        if (imageFileStatus) {
            imageFileStatus.textContent = '';
            imageFileStatus.className = 'file-status';
        }
    }
}

// Reset file choice
function resetFileChoice() {
    fileChoiceMade = false;
    chosenFileType = null;
    updateFileInputAvailability();
}

// Enhanced function to notify other pages about video updates
function notifyVideosUpdated() {
    console.log('📢 Notifying ALL pages that videos were updated');
    
    localStorage.setItem('videosUpdated', Date.now().toString());
    localStorage.setItem('videoDataChanged', Date.now().toString());
    
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const channel = new BroadcastChannel('video_updates');
            channel.postMessage({ 
                type: 'videosUpdated', 
                timestamp: Date.now(),
                action: 'videosChanged'
            });
        } catch (e) {
            console.log('BroadcastChannel not available');
        }
    }
}

async function handleFormSubmit(e) {
    console.log('🟢 Form submitted!');
    e.preventDefault();
    
    const submitBtn = document.querySelector('.submit-btn');
    const form = document.getElementById('addVideoForm');
    
    // Check if editing
    const videoId = form.getAttribute('data-editing-id');
    const isEditing = videoId && videoId !== 'null' && videoId !== 'undefined' && videoId !== 'new';
    
    // Disable button immediately
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = isEditing ? 'Updating...' : 'Uploading...';
    }
    
    // Get ALL form data
    const title = document.getElementById('videoTitle').value;
    const author = document.getElementById('videoAuthor').value;
    const price = document.getElementById('videoTime').value;
    const views = document.getElementById('videoViews').value;
    const timeAgo = document.getElementById('timeAgo').value;
    const status = document.getElementById('videoStatus').value;
    const description = document.getElementById('videoDescription').value;
    
    console.log('📝 Form data:', { title, author, price, views, timeAgo, status, description, isEditing, videoId });
    
    try {
        // Validate required fields
        if (!title || !author) {
            throw new Error('Title and Author are required');
        }
        
        // Clean views
        const cleanViews = views.toString().replace(/[^0-9]/g, '') || 0;
        
        // Prepare video data
        const videoData = {
            title: title.trim(),
            author: author.trim(),
            description: description || '',
            price: price || '0',
            views: cleanViews.toString(),
            timeAgo: timeAgo || 'Just now',
            status: status || 'online',
            availability: 'available',
            likes: 0,
            // Image URLs will be added after upload
            author_img: '/avatars/default.jpg',
            video_url: '',  // No video file support yet
            thumbnail_url: '/avatars/default.jpg'
        };
        
        // Add ID if editing
        if (isEditing) {
            videoData.id = videoId;
        }
        
        // ===== NEW UPLOAD FLOW =====
        // 1. Upload image first (if provided)
        const imageFileInput = document.getElementById('authorImageFile');
        const imageFile = imageFileInput?.files[0];
        
        if (imageFile) {
            console.log('📤 Uploading image to GitHub...');
            
            try {
                const formData = new FormData();
                formData.append('image', imageFile);
                
                const uploadResponse = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!uploadResponse.ok) {
                    throw new Error(`Upload failed: ${uploadResponse.status}`);
                }
                
                const uploadResult = await uploadResponse.json();
                console.log('📦 Upload response:', uploadResult);
                
                if (uploadResult.success && uploadResult.url) {
                    // Use the uploaded image for both author and thumbnail
                    videoData.author_img = uploadResult.url;
                    videoData.thumbnail_url = uploadResult.url;
                    console.log('✅ Image uploaded to:', uploadResult.url);
                } else {
                    console.log('⚠️ Image upload returned no URL, using defaults');
                }
            } catch (uploadError) {
                console.error('❌ Upload error:', uploadError);
                // Continue with default images - don't fail the whole submission
                showErrorMessage(`Note: Image upload failed (${uploadError.message}), using default images`);
            }
        }
        
        console.log('📤 Sending video data to API:', videoData);
        
        // 2. Send video data to API
        const videoResponse = await fetch(`${API_URL}/api/videos`, {
            method: isEditing ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(videoData)
        });
        
        console.log('📥 Video API Response status:', videoResponse.status);
        
        const result = await videoResponse.json();
        console.log('📦 Video API Response:', result);
        
        if (result.success) {
            const message = isEditing ? '✅ Video updated successfully!' : '✅ Video added successfully!';
            showSuccessMessage(message);
            
            if (isEditing) {
                // INSTANT UPDATE: Update video in list without reloading
                const updatedData = {
                    title: title.trim(),
                    author: author.trim(),
                    description: description || timeAgo || 'Video',
                    price: price || '0',
                    views: cleanViews,
                    likes: 0,
                    status: status
                };
                
                updateStatusButtonInList(videoId, status);
                updateEditedVideoInList(videoId, updatedData);
                
            } else {
                // For NEW videos: Load at TOP
                loadNewVideoAtTop();
            }
            
            // Notify main page
            notifyVideosUpdated();
            
            // Clear form
            resetFormToAddMode();
            
        } else {
            throw new Error(result.error || result.message || 'Unknown error occurred');
        }
        
    } catch (error) {
        console.error('❌ Form processing error:', error);
        showErrorMessage(`❌ Error: ${error.message}`);
        resetSubmitButton();
    }
}

// Function to load NEW video at TOP (no shuffle)
function loadNewVideoAtTop() {
    console.log('🆕 Loading NEW video to add at TOP...');
    
    fetch(`${API_URL}/api/videos`)
        .then(response => response.json())
        .then(videos => {
            if (videos.length > 0) {
                // Get the NEWEST video (should be first from API)
                const newVideo = videos[0];
                
                // Create HTML for new video
                const displayAuthor = newVideo.author || 'Unknown';
                const displayDescription = newVideo.description || '';
                
                // Use the actual image URLs from the video data
                const thumbnailSrc = newVideo.thumbnail_url || newVideo.coverImg || newVideo.authorImg || getThumbnailUrl('');
                const displayTitle = newVideo.title || 'Untitled Video';
                const displayViews = newVideo.views ? newVideo.views.toLocaleString() + ' views' : '0 views';
                const displayLikes = newVideo.likes || 0;
                const displayStatus = newVideo.status || 'online';
                
                const statusClass = displayStatus === 'online' ? 'status-btn status-online' : 'status-btn status-offline';
                const statusText = displayStatus === 'online' ? 'Online' : 'Offline';
                
                const newVideoHTML = `
                    <div class="video-item">
                        <div class="video-thumbnail">
                            <img src="${thumbnailSrc}" alt="${displayTitle}" 
                                 style="width: 100%; height: 120px; object-fit: cover;"
                                 onerror="this.src='${getThumbnailUrl('')}'">
                        </div>
                        <div class="video-info">
                            <h4>${displayTitle}</h4>
                            <p>By ${displayAuthor}</p>
                            <p>${displayDescription.substring(0, 80)}${displayDescription.length > 80 ? '...' : ''}</p>
                            <p><small>Price: ${newVideo.price || '0'} SAR | Views: ${displayViews} | Likes: ${displayLikes}</small></p>
                            <p><small>ID: ${newVideo.id || 'unknown'}</small></p>
                        </div>
                        <div class="video-actions">
                            <button class="${statusClass}" data-video-id="${newVideo.id}" data-current-status="${displayStatus}">
                                ${statusText}
                            </button>
                            <button class="edit-btn" data-video-id="${newVideo.id}">Edit</button>
                            <button class="delete-btn" data-video-id="${newVideo.id}">Delete</button>
                        </div>
                    </div>
                `;
                
                // Add to TOP of videos list
                const videosList = document.querySelector('.videos-list');
                if (videosList) {
                    // Insert after the header
                    const header = videosList.querySelector('h3');
                    if (header) {
                        header.insertAdjacentHTML('afterend', newVideoHTML);
                    } else {
                        videosList.insertAdjacentHTML('afterbegin', newVideoHTML);
                    }
                    
                    // Setup event listeners for the new video
                    const newItem = videosList.querySelector(`[data-video-id="${newVideo.id}"]`)?.closest('.video-item');
                    if (newItem) {
                        setupVideoItemEvents(newItem);
                    }
                    
                    // Remove "no videos" message if it exists
                    const noVideosMsg = videosList.querySelector('.no-videos');
                    if (noVideosMsg) {
                        noVideosMsg.remove();
                    }
                }
                
                console.log('✅ New video added to TOP');
            }
        })
        .catch(error => {
            console.error('❌ Error loading new video:', error);
            // Fallback: reload all videos normally
            loadVideos();
        });
}

// Setup event listeners for a video item
function setupVideoItemEvents(videoItem) {
    const statusBtn = videoItem.querySelector('.status-btn');
    const editBtn = videoItem.querySelector('.edit-btn');
    const deleteBtn = videoItem.querySelector('.delete-btn');
    
    if (statusBtn) {
        statusBtn.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            const currentStatus = this.getAttribute('data-current-status');
            const newStatus = currentStatus === 'online' ? 'offline' : 'online';
            toggleVideoStatus(videoId, newStatus, this);
        });
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            editVideo(videoId);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            deleteVideo(videoId);
        });
    }
}

// Update status button in the list immediately
function updateStatusButtonInList(videoId, newStatus) {
    const buttons = document.querySelectorAll(`.status-btn[data-video-id="${videoId}"]`);
    
    buttons.forEach(button => {
        if (newStatus === 'online') {
            button.className = 'status-btn status-online';
            button.textContent = 'Online';
            button.setAttribute('data-current-status', 'online');
        } else {
            button.className = 'status-btn status-offline';
            button.textContent = 'Offline';
            button.setAttribute('data-current-status', 'offline');
        }
    });
    
    console.log(`✅ Updated button for video ${videoId} to ${newStatus}`);
}

// Function to update edited video in the list instantly (no shuffle)
function updateEditedVideoInList(videoId, updatedData) {
    console.log('🔄 Updating video in list:', videoId, updatedData);
    
    const videoElement = document.querySelector(`.video-item .status-btn[data-video-id="${videoId}"]`)?.closest('.video-item');
    
    if (videoElement) {
        // Update title
        const titleEl = videoElement.querySelector('h4');
        if (titleEl && updatedData.title) {
            titleEl.textContent = updatedData.title;
        }
        
        // Update author
        const authorEl = videoElement.querySelector('p:nth-child(2)');
        if (authorEl && updatedData.author) {
            authorEl.textContent = 'By ' + updatedData.author;
        }
        
        // Update description
        const descEl = videoElement.querySelector('p:nth-child(3)');
        if (descEl && updatedData.description) {
            descEl.textContent = updatedData.description.substring(0, 80) + (updatedData.description.length > 80 ? '...' : '');
        }
        
        // Update details
        const detailsEl = videoElement.querySelector('p small');
        if (detailsEl) {
            const views = updatedData.views ? updatedData.views.toLocaleString() + ' views' : '0 views';
            detailsEl.textContent = `Price: ${updatedData.price || '0'} SAR | Views: ${views} | Likes: ${updatedData.likes || 0}`;
        }
        
        // Update status button
        const statusBtn = videoElement.querySelector('.status-btn');
        if (statusBtn && updatedData.status) {
            if (updatedData.status === 'online') {
                statusBtn.className = 'status-btn status-online';
                statusBtn.textContent = 'Online';
                statusBtn.setAttribute('data-current-status', 'online');
            } else {
                statusBtn.className = 'status-btn status-offline';
                statusBtn.textContent = 'Offline';
                statusBtn.setAttribute('data-current-status', 'offline');
            }
        }
        
        console.log('✅ Video updated in list instantly');
    }
}

// Complete form reset function
function resetFormToAddMode() {
    console.log('🔄 Resetting form to Add mode...');
    
    // Clear all form fields
    document.getElementById('videoTitle').value = '';
    document.getElementById('videoAuthor').value = '';
    document.getElementById('videoTime').value = '';
    document.getElementById('videoViews').value = '';
    document.getElementById('timeAgo').value = '';
    document.getElementById('videoStatus').value = 'online';
    document.getElementById('videoDescription').value = '';
    
    // Clear file inputs
    document.getElementById('videoFile').value = '';
    document.getElementById('authorImageFile').value = '';
    
    // Remove editing mode
    const form = document.getElementById('addVideoForm');
    form.removeAttribute('data-editing-id');
    
    // Reset button to "Add Video"
    resetSubmitButtonToAdd();
    
    // Reset file choices
    resetFileChoice();
    
    console.log('✅ Form reset to Add mode');
}

// Helper function to reset button to "Add Video" state
function resetSubmitButtonToAdd() {
    const btn = document.querySelector('.submit-btn');
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Add Video';
        console.log('🔄 Button reset to "Add Video"');
    }
}

// Helper function to reset button (generic)
function resetSubmitButton() {
    const btn = document.querySelector('.submit-btn');
    if (btn) {
        btn.disabled = false;
        const isEditing = document.getElementById('addVideoForm').getAttribute('data-editing-id');
        btn.textContent = isEditing ? 'Update Video' : 'Add Video';
        console.log('🔄 Button reset:', btn.textContent);
    }
}

// Show success message function
function showSuccessMessage(message) {
    const successMsg = document.getElementById('successMessage');
    if (successMsg) {
        successMsg.textContent = message;
        successMsg.style.display = 'block';
        
        const errorMsg = document.getElementById('errorMessage');
        if (errorMsg) errorMsg.style.display = 'none';
        
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Show error message function
function showErrorMessage(message) {
    const errorMsg = document.getElementById('errorMessage');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        
        const successMsg = document.getElementById('successMessage');
        if (successMsg) successMsg.style.display = 'none';
        
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Get thumbnail URL with fallback
function getThumbnailUrl(thumbnail) {
    if (!thumbnail || thumbnail === 'api.php?file=' || thumbnail === '') {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzNENEU1RiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
    }
    
    if (thumbnail.startsWith('api.php?file=')) {
        return thumbnail;
    }
    
    if (thumbnail === 'test.jpg') {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzNENEU1RiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+RGVmYXVsdDwvdGV4dD48L3N2Zz4=';
    }
    
    return thumbnail;
}

// Load videos when page loads with error handling
function loadVideos() {
    console.log('📋 Loading videos for admin panel...');
    
    // UPDATED for Cloudflare Worker
    fetch(`${API_URL}/api/videos`)
        .then(response => {
            console.log('📥 Admin API Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(videos => {
            console.log(`📊 Found ${videos.length} videos for admin panel`);
            
            // 🔄 SHUFFLE on page load only
            // Check if videos is an array
if (Array.isArray(videos)) {
  displayVideos(shuffleArray([...videos]));
} else {
  console.error('Videos is not an array:', videos);
  displayVideos([]);
}        })
        .catch(error => {
            console.error('❌ Error loading videos:', error);
            displayVideos([]);
        });
}

function displayVideos(videos) {
    const videosList = document.querySelector('.videos-list');
    if (!videosList) return;
    
    let html = '<h3>Products Table Videos</h3>';
    
    if (!videos || videos.length === 0) {
        html += '<div class="no-videos">No videos in products table yet</div>';
    } else {
        videos.forEach(video => {
            // Extract author from description or use author field
            const description = video.description || '';
            let displayAuthor = video.author || 'Unknown';
            let displayDescription = description;
            
            const thumbnailSrc = video.thumbnail_url || video.coverImg || video.authorImg || getThumbnailUrl('');
            const displayTitle = video.title || 'Untitled Video';
            const displayViews = video.views ? video.views.toLocaleString() + ' views' : '0 views';
            const displayLikes = video.likes || 0;
            const displayStatus = video.status || 'online';
            
            // Status button
            const statusClass = displayStatus === 'online' ? 'status-btn status-online' : 'status-btn status-offline';
            const statusText = displayStatus === 'online' ? 'Online' : 'Offline';
            
            html += `
                <div class="video-item">
                    <div class="video-thumbnail">
                        <img src="${thumbnailSrc}" alt="${displayTitle}" 
                             style="width: 100%; height: 120px; object-fit: cover;">
                    </div>
                    <div class="video-info">
                        <h4>${displayTitle}</h4>
                        <p>By ${displayAuthor}</p>
                        <p>${displayDescription.substring(0, 80)}${displayDescription.length > 80 ? '...' : ''}</p>
                        <p><small>Price: ${video.price || '0'} SAR | Views: ${displayViews} | Likes: ${displayLikes}</small></p>
                        <p><small>ID: ${video.id || 'unknown'}</small></p>
                    </div>
                    <div class="video-actions">
                        <button class="${statusClass}" data-video-id="${video.id}" data-current-status="${displayStatus}">
                            ${statusText}
                        </button>
                        <button class="edit-btn" data-video-id="${video.id}">Edit</button>
                        <button class="delete-btn" data-video-id="${video.id}">Delete</button>
                    </div>
                </div>
            `;
        });
    }
    
    videosList.innerHTML = html;
    
    // Setup button listeners
    setupDeleteButtons();
    setupEditButtons();
    setupStatusButtons();
}

// Setup delete buttons
function setupDeleteButtons() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            console.log('🗑️ Delete button clicked for video:', videoId);
            deleteVideo(videoId);
        });
    });
}

// Delete video - Updated for Cloudflare Worker
function deleteVideo(id) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    console.log('🗑️ Deleting video:', id);
    
    // UPDATED for Cloudflare Worker
    fetch(`${API_URL}/api/videos/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showSuccessMessage('✅ Video deleted successfully!');
            // NOTIFY MAIN PAGE TO UPDATE
            notifyVideosUpdated();
            
            // Remove the video element from the page
            const videoElement = document.querySelector(`.video-item .status-btn[data-video-id="${id}"]`)?.closest('.video-item');
            if (videoElement) {
                videoElement.remove();
            }
            
            // If no videos left, show "no videos" message
            const videosList = document.querySelector('.videos-list');
            if (videosList) {
                const videoItems = videosList.querySelectorAll('.video-item');
                if (videoItems.length === 0) {
                    const header = videosList.querySelector('h3');
                    if (header) {
                        header.insertAdjacentHTML('afterend', '<div class="no-videos">No videos in products table yet</div>');
                    }
                }
            }
        } else {
            showErrorMessage('❌ Error: ' + (result.error || 'Failed to delete video'));
        }
    })
    .catch(error => {
        showErrorMessage('❌ Error deleting video: ' + error.message);
    });
}

// Setup edit buttons
function setupEditButtons() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            console.log('✏️ Edit button clicked for video:', videoId);
            editVideo(videoId);
        });
    });
}

// Setup status toggle buttons
function setupStatusButtons() {
    document.querySelectorAll('.status-btn').forEach(button => {
        button.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            const currentStatus = this.getAttribute('data-current-status');
            const newStatus = currentStatus === 'online' ? 'offline' : 'online';
            
            console.log('🔄 Toggling status for video:', videoId, currentStatus + ' → ' + newStatus);
            toggleVideoStatus(videoId, newStatus, this);
        });
    });
}

function toggleVideoStatus(videoId, newStatus, buttonElement) {
    const originalText = buttonElement.textContent;
    buttonElement.textContent = 'Updating...';
    buttonElement.disabled = true;

    // UPDATED for Cloudflare Worker - Update video status via PUT
    const updateData = { status: newStatus };
    
    fetch(`${API_URL}/api/videos/${videoId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Status update response:', result);
        
        if (result.success) {
            if (newStatus === 'online') {
                buttonElement.className = 'status-btn status-online';
                buttonElement.textContent = 'Online';
                buttonElement.setAttribute('data-current-status', 'online');
            } else {
                buttonElement.className = 'status-btn status-offline';
                buttonElement.textContent = 'Offline';
                buttonElement.setAttribute('data-current-status', 'offline');
            }
            
            showSuccessMessage(`✅ Video set to ${newStatus}!`);
            
        } else {
            throw new Error(result.error || result.message || 'Failed to update status');
        }
    })
    .catch(error => {
        console.error('❌ Status update error:', error);
        showErrorMessage(`❌ Error: ${error.message}`);
        buttonElement.textContent = originalText;
    })
    .finally(() => {
        buttonElement.disabled = false;
    });
}

function editVideo(id) {
    console.log('🔍 Loading video for editing:', id);
    
    // Try to get video from current displayed list
    const videoElement = document.querySelector(`.video-item .status-btn[data-video-id="${id}"]`)?.closest('.video-item');
    
    if (videoElement) {
        // Get data from displayed video
        const title = videoElement.querySelector('h4')?.textContent || '';
        const authorText = videoElement.querySelector('p:nth-child(2)')?.textContent || '';
        const author = authorText.replace('By ', '');
        const description = videoElement.querySelector('p:nth-child(3)')?.textContent || '';
        
        // Get price from details text
        const detailsText = videoElement.querySelector('p small')?.textContent || '';
        let price = '0';
        if (detailsText.includes('Price:')) {
            const priceMatch = detailsText.match(/Price: (.*?) SAR/);
            if (priceMatch) price = priceMatch[1];
        }
        
        // Get views
        let views = '0';
        if (detailsText.includes('Views:')) {
            const viewsMatch = detailsText.match(/Views: (.*?) views/);
            if (viewsMatch) views = viewsMatch[1].replace(/,/g, '');
        }
        
        // Get status
        const statusBtn = videoElement.querySelector('.status-btn');
        const status = statusBtn?.getAttribute('data-current-status') || 'online';
        
        // Fill form
        document.getElementById('videoTitle').value = title;
        document.getElementById('videoAuthor').value = author;
        document.getElementById('videoDescription').value = description;
        document.getElementById('videoTime').value = price;
        document.getElementById('videoViews').value = views;
        document.getElementById('timeAgo').value = 'Recently';
        document.getElementById('videoStatus').value = status;
        
        // Set editing mode
        const form = document.getElementById('addVideoForm');
        form.setAttribute('data-editing-id', id);
        
        // Update button text
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) submitBtn.textContent = 'Update Video';
        
        resetFileChoice();
        updateFileInputAvailability();
        document.querySelector('.video-form')?.scrollIntoView({ behavior: 'smooth' });
        
        console.log('✅ Form populated from displayed video');
        
    } else {
        // Fallback: Fetch from API
        console.log('⚠️ Video not in list, fetching from API...');
        fetch(`${API_URL}/api/videos`)
            .then(response => response.json())
            .then(videos => {
                const videoToEdit = videos.find(video => video.id == id);
                
                if (videoToEdit) {
                    document.getElementById('videoTitle').value = videoToEdit.title || '';
                    document.getElementById('videoAuthor').value = videoToEdit.author || '';
                    document.getElementById('videoDescription').value = videoToEdit.description || '';
                    document.getElementById('videoTime').value = videoToEdit.price || '';
                    document.getElementById('videoViews').value = videoToEdit.views || 0;
                    document.getElementById('timeAgo').value = videoToEdit.timeAgo || 'Recently';
                    document.getElementById('videoStatus').value = videoToEdit.status || 'online';
                    
                    const form = document.getElementById('addVideoForm');
                    form.setAttribute('data-editing-id', id);
                    
                    const submitBtn = document.querySelector('.submit-btn');
                    if (submitBtn) submitBtn.textContent = 'Update Video';
                    
                    resetFileChoice();
                    updateFileInputAvailability();
                    document.querySelector('.video-form')?.scrollIntoView({ behavior: 'smooth' });
                }
            });
    }
}

// Clean up orphaned files
function cleanupOrphanedFiles() {
    if (!confirm('This will check for uploaded files that are not used by any videos. Continue?')) {
        return;
    }
    
    console.log('🗑️ Starting orphaned files cleanup...');
    showSuccessMessage('🔄 Checking for orphaned files...');
    
    fetch(`${API_URL}/api/videos`)
        .then(response => response.json())
        .then(videos => {
            showSuccessMessage(`✅ Found ${videos.length} videos in database.`);
        })
        .catch(error => {
            console.error('❌ Cleanup error:', error);
            showErrorMessage('❌ Error during cleanup: ' + error.message);
        });
}

// Manual reset button
function manualResetForm() {
    console.log('🔄 Manual form reset triggered');
    resetFormToAddMode();
}

// Make functions globally available
window.openMainPage = function() {
    window.open('./index.html', '_blank');
};

window.testForm = function() {
    console.log('🧪 Testing form functionality...');
    showSuccessMessage('🧪 Form test completed - check console for details');
};

window.cleanupOrphanedFiles = cleanupOrphanedFiles;
window.manualResetForm = manualResetForm;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Admin panel initialized');
    
    const form = document.getElementById('addVideoForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        
        const videoFileInput = document.getElementById('videoFile');
        const imageFileInput = document.getElementById('authorImageFile');
        
        if (videoFileInput) {
            videoFileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    fileChoiceMade = true;
                    chosenFileType = 'video';
                    updateFileInputAvailability();
                } else {
                    resetFileChoice();
                }
            });
        }
        
        if (imageFileInput) {
            imageFileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    fileChoiceMade = true;
                    chosenFileType = 'image';
                    updateFileInputAvailability();
                } else {
                    resetFileChoice();
                }
            });
        }
    }
    
    updateFileInputAvailability();
    loadVideos();
});