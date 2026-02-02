// ===== CONFIGURATION =====
const WORKER_URL = 'https://pazzle-store-api.mus00204.workers.dev';
let editingVideoId = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Admin panel initializing...');
    
    // Load videos on startup
    await loadVideos();
    
    // Setup event listeners
    setupAdminEventListeners();
    
    // Check admin authentication
    checkAdminAuth();
});

// ===== VIDEO MANAGEMENT =====
async function loadVideos() {
    try {
        showAdminLoading('Loading videos...');
        
        console.log('Fetching videos from:', `${WORKER_URL}/api/videos`);
        const response = await fetch(`${WORKER_URL}/api/videos`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const videos = await response.json();
        console.log('Videos received:', videos);
        
        renderVideoTable(videos);
        hideAdminLoading();
        
    } catch (error) {
        console.error('Error loading videos:', error);
        showAdminError(`Failed to load videos: ${error.message}`);
        hideAdminLoading();
        renderVideoTable([]); // Show empty table
    }
}

async function saveVideo(videoData) {
    try {
        showAdminLoading('Saving video...');
        
        const method = editingVideoId ? 'PUT' : 'POST';
        const url = editingVideoId ? 
            `${WORKER_URL}/api/videos/${editingVideoId}` : 
            `${WORKER_URL}/api/videos`;
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(videoData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        showAdminSuccess(editingVideoId ? 'Video updated!' : 'Video added!');
        await loadVideos(); // Refresh the list
        closeVideoModal();
        
        return result;
        
    } catch (error) {
        console.error('Error saving video:', error);
        showAdminError(`Save failed: ${error.message}`);
        return null;
    }
}

async function deleteVideo(videoId) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
        showAdminLoading('Deleting video...');
        
        const response = await fetch(`${WORKER_URL}/api/videos/${videoId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        showAdminSuccess('Video deleted!');
        await loadVideos(); // Refresh the list
        
    } catch (error) {
        console.error('Error deleting video:', error);
        showAdminError(`Delete failed: ${error.message}`);
    }
}

// ===== COMMENT MANAGEMENT =====
async function loadComments(videoId = null) {
    try {
        let url = `${WORKER_URL}/api/comments`;
        if (videoId) {
            url += `?video_id=${videoId}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Failed to load comments');
        
        const comments = await response.json();
        renderCommentTable(comments);
        
    } catch (error) {
        console.error('Error loading comments:', error);
        showAdminError('Failed to load comments');
        renderCommentTable([]);
    }
}

async function deleteComment(commentId) {
    if (!confirm('Delete this comment?')) return;
    
    try {
        const response = await fetch(`${WORKER_URL}/api/comments/${commentId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Delete failed');
        
        showAdminSuccess('Comment deleted');
        await loadComments();
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        showAdminError('Failed to delete comment');
    }
}

// ===== USER MANAGEMENT =====
async function loadUsers() {
    try {
        const response = await fetch(`${WORKER_URL}/api/users`);
        
        if (!response.ok) throw new Error('Failed to load users');
        
        const users = await response.json();
        renderUserTable(users);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showAdminError('Failed to load users');
        renderUserTable([]);
    }
}

async function updateUser(userId, userData) {
    try {
        const response = await fetch(`${WORKER_URL}/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) throw new Error('Update failed');
        
        showAdminSuccess('User updated');
        await loadUsers();
        
    } catch (error) {
        console.error('Error updating user:', error);
        showAdminError('Failed to update user');
    }
}

// ===== ORDER MANAGEMENT =====
async function loadOrders() {
    try {
        const response = await fetch(`${WORKER_URL}/api/orders`);
        
        if (!response.ok) throw new Error('Failed to load orders');
        
        const orders = await response.json();
        renderOrderTable(orders);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showAdminError('Failed to load orders');
        renderOrderTable([]);
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`${WORKER_URL}/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        
        if (!response.ok) throw new Error('Status update failed');
        
        showAdminSuccess('Order status updated');
        await loadOrders();
        
    } catch (error) {
        console.error('Error updating order:', error);
        showAdminError('Failed to update order');
    }
}

// ===== PRODUCT MANAGEMENT =====
async function loadProducts() {
    try {
        const response = await fetch(`${WORKER_URL}/api/products`);
        
        if (!response.ok) throw new Error('Failed to load products');
        
        const products = await response.json();
        renderProductTable(products);
        
    } catch (error) {
        console.error('Error loading products:', error);
        showAdminError('Failed to load products');
        renderProductTable([]);
    }
}

async function saveProduct(productData) {
    try {
        showAdminLoading('Saving product...');
        
        const method = productData.id ? 'PUT' : 'POST';
        const url = productData.id ? 
            `${WORKER_URL}/api/products/${productData.id}` : 
            `${WORKER_URL}/api/products`;
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) throw new Error('Save failed');
        
        showAdminSuccess(productData.id ? 'Product updated!' : 'Product added!');
        await loadProducts();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showAdminError(`Save failed: ${error.message}`);
    }
}

// ===== UI RENDERING =====
function renderVideoTable(videos) {
    const tbody = document.querySelector('#video-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!videos || videos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No videos found</td>
            </tr>
        `;
        return;
    }
    
    videos.forEach(video => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${video.id}</td>
            <td><img src="${video.thumbnail_url}" alt="Thumb" style="width: 80px; height: 45px; object-fit: cover;"></td>
            <td>${video.title}</td>
            <td>${video.duration || '0:00'}</td>
            <td>$${video.price || '0.00'}</td>
            <td>${video.views || 0}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editVideo(${video.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteVideo(${video.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderCommentTable(comments) {
    const tbody = document.querySelector('#comment-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!comments || comments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No comments found</td>
            </tr>
        `;
        return;
    }
    
    comments.forEach(comment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${comment.id}</td>
            <td>${comment.video_id}</td>
            <td>${comment.username || 'User ' + comment.user_id}</td>
            <td>${comment.comment.substring(0, 50)}${comment.comment.length > 50 ? '...' : ''}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteComment(${comment.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderUserTable(users) {
    const tbody = document.querySelector('#user-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No users found</td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td><img src="${user.avatar || '/avatars/default.jpg'}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%;"></td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>
                <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-secondary'}">
                    ${user.role}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderOrderTable(orders) {
    const tbody = document.querySelector('#order-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No orders found</td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.user_id}</td>
            <td>$${order.total_amount}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(order.status)}">
                    ${order.status}
                </span>
            </td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
            <td>
                <select class="form-select form-select-sm" onchange="updateOrderStatus(${order.id}, this.value)" style="width: 120px;">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderProductTable(products) {
    const tbody = document.querySelector('#product-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No products found</td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${product.image_url}" alt="Product" style="width: 60px; height: 60px; object-fit: cover;"></td>
            <td>${product.name}</td>
            <td>$${product.price}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ===== MODAL FUNCTIONS =====
function openVideoModal(video = null) {
    editingVideoId = video ? video.id : null;
    
    const modal = document.getElementById('video-modal');
    const form = document.getElementById('video-form');
    
    if (video) {
        // Edit mode
        document.getElementById('video-title').value = video.title || '';
        document.getElementById('video-description').value = video.description || '';
        document.getElementById('video-url').value = video.video_url || '';
        document.getElementById('thumbnail-url').value = video.thumbnail_url || '';
        document.getElementById('video-price').value = video.price || '';
        document.getElementById('video-duration').value = video.duration || '';
        document.getElementById('video-views').value = video.views || 0;
    } else {
        // Add mode
        form.reset();
    }
    
    modal.style.display = 'block';
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    modal.style.display = 'none';
    editingVideoId = null;
    document.getElementById('video-form').reset();
}

// ===== EVENT LISTENERS =====
function setupAdminEventListeners() {
    // Video form submission
    const videoForm = document.getElementById('video-form');
    if (videoForm) {
        videoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const videoData = {
                title: document.getElementById('video-title').value,
                description: document.getElementById('video-description').value,
                video_url: document.getElementById('video-url').value,
                thumbnail_url: document.getElementById('thumbnail-url').value,
                price: parseFloat(document.getElementById('video-price').value) || 0,
                duration: document.getElementById('video-duration').value,
                views: parseInt(document.getElementById('video-views').value) || 0
            };
            
            await saveVideo(videoData);
        });
    }
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal, .cancel-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeVideoModal);
    });
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab (WITH SAFETY CHECK)
    const tabElement = document.getElementById(`${tabName}-tab`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Activate selected button
    const buttonElement = document.querySelector(`[data-tab="${tabName}"]`);
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
    
    // Load data for the tab
    switch(tabName) {
        case 'videos':
            loadVideos();
            break;
        case 'comments':
            loadComments();
            break;
        case 'users':
            loadUsers();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'products':
            loadProducts();
            break;
    }
}

// ===== UI HELPER FUNCTIONS =====
function showAdminLoading(message) {
    let loader = document.getElementById('admin-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'admin-loader';
        loader.className = 'admin-loader';
        document.body.appendChild(loader);
    }
    loader.innerHTML = `<div class="loader-content">${message}</div>`;
    loader.style.display = 'flex';
}

function hideAdminLoading() {
    const loader = document.getElementById('admin-loader');
    if (loader) loader.style.display = 'none';
}

function showAdminSuccess(message) {
    showAdminNotification(message, 'success');
}

function showAdminError(message) {
    showAdminNotification(message, 'error');
}

function showAdminNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'completed': return 'bg-success';
        case 'processing': return 'bg-warning';
        case 'pending': return 'bg-info';
        case 'cancelled': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function checkAdminAuth() {
    // TEMPORARY: Skip login for testing
    console.log('Admin auth check: SKIPPED for testing');
    return true;
}

// ===== GLOBAL FUNCTIONS (for onclick handlers) =====
window.editVideo = function(videoId) {
    // Find the video in current list
    const video = window.currentVideos?.find(v => v.id === videoId);
    if (video) {
        openVideoModal(video);
    } else {
        showAdminError('Video not found. Please refresh the list.');
    }
};

window.editProduct = function(productId) {
    // Implement product edit modal
    alert('Product edit feature coming soon!');
};

window.deleteProduct = async function(productId) {
    if (!confirm('Delete this product?')) return;
    
    try {
        const response = await fetch(`${WORKER_URL}/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Delete failed');
        
        showAdminSuccess('Product deleted');
        await loadProducts();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showAdminError('Failed to delete product');
    }
};

// Initialize first tab
switchTab('videos');