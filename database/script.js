// ===== CART AND SHOPPING SYSTEM =====

// Global variables for cart system
let cartItems = [];
let currentVideoPrice = 0;
let currentVideoId = null;
let paymentMethod = 'credit_card';
let savedShippingAddress = null;

// Initialize cart system
function initializeCartSystem() {
    console.log('🛒 Initializing cart system...');
    
    // Load cart from localStorage
    loadCart();
    loadShipping();
    
    // Setup event listeners
    setupCartEventListeners();
    setupModalEvents();
    
    // Update cart display
    updateCartBadge();
    updateAllBuyButtons();
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('skateboard_cart');
    if (savedCart) {
        try {
            cartItems = JSON.parse(savedCart);
            console.log('📦 Loaded cart from localStorage:', cartItems);
            
            // Update badge immediately
            updateCartBadge();
            
            // Update buy button colors
            setTimeout(updateAllBuyButtons, 500);
        } catch (e) {
            console.error('Error loading cart:', e);
            cartItems = [];
        }
    } else {
        console.log('📦 No saved cart found');
        cartItems = [];
    }
}
    

// Load shipping address
function loadShipping() {
    const savedShipping = localStorage.getItem('skateboard_shipping');
    if (savedShipping) {
        try {
            savedShippingAddress = JSON.parse(savedShipping);
        } catch (e) {
            console.error('Error loading shipping:', e);
            savedShippingAddress = null;
        }
    }
}

// Save cart to localStorage
function saveCart() {
    console.log('💾 Saving cart:', cartItems);
    localStorage.setItem('skateboard_cart', JSON.stringify(cartItems));
    updateCartBadge();
    updateAllBuyButtons();
}

// Save shipping address
function saveShipping(address) {
    console.log('💾 Saving shipping address:', address);
    
    // Save to localStorage
    savedShippingAddress = address;
    localStorage.setItem('skateboard_shipping', JSON.stringify(address));
    
    // Save to server (shipping.json)
    const formData = new FormData();
    formData.append('action', 'save_shipping');
    formData.append('shipping_data', JSON.stringify(address));
    
    fetch('https://pazzle-store-api.mus00204.workers.dev/database/api', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Shipping saved to server:', data);
        } else {
            console.log('⚠️ Server save failed:', data.message);
        }
    })
    .catch(error => {
        console.log('⚠️ Could not save to server:', error);
    });
}

// Update cart badge in header
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = totalItems || '0';
    }
}

// Update ALL buy button cart icon colors ONLY
function updateAllBuyButtons() {
    // Update top-edge buy buttons (thumbnail videos)
    document.querySelectorAll('.buy-button-top .fa-shopping-cart').forEach(icon => {
        const buyButton = icon.closest('.buy-button-top');
        const videoId = buyButton.getAttribute('data-video-id');
        const isInCart = cartItems.some(item => item.video_id === videoId);
        
        if (isInCart) {
            icon.classList.add('in-cart'); // Add red class
            icon.classList.remove('not-in-cart'); // Remove white class
        } else {
            icon.classList.remove('in-cart'); // Remove red class
            icon.classList.add('not-in-cart'); // Add white class
        }
    });
    
    // Update stream-area buy button
    const streamIcon = document.querySelector('#buyButton .fa-shopping-cart');
    if (streamIcon && currentVideoId) {
        const isInCart = cartItems.some(item => item.video_id === currentVideoId);
        
        if (isInCart) {
            streamIcon.classList.add('in-cart'); // Add red class
            streamIcon.classList.remove('not-in-cart'); // Remove white class
        } else {
            streamIcon.classList.remove('in-cart'); // Remove red class
            streamIcon.classList.add('not-in-cart'); // Add white class
        }
    }
}
// Setup cart event listeners
function setupCartEventListeners() {
    // Header cart button - ONLY THIS opens the modal
    const cartHeaderIcon = document.querySelector('.cart-header-icon');
    if (cartHeaderIcon) {
        cartHeaderIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            openShoppingModal();
        });
    }
    
// Stream-area buy button - NO MODAL, JUST ADD TO CART
const buyButton = document.getElementById('buyButton');
if (buyButton) {
    buyButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if (currentVideoId) {
            toggleVideoInCart(currentVideoId); // ONLY THIS - NO MODAL
        } else {
            showNotification('Please select a video first', 'error');
        }
    });
}
}

// Toggle video in cart (add/remove) - NO MODAL
function toggleVideoInCart(videoId) {
    const videoCard = document.querySelector(`.video[data-video-id="${videoId}"]`);
    if (!videoCard) return;
    
    const videoTitle = videoCard.querySelector('.video-name')?.textContent || 'Video';
    const videoAuthor = videoCard.querySelector('.video-by')?.textContent.replace('•', '').trim() || 'Unknown';
    const videoPriceText = videoCard.querySelector('.video-time')?.textContent.replace('SAR', '').trim() || '0';
    const videoPrice = parseFloat(videoPriceText) || 0;
    const videoThumbnail = videoCard.querySelector('.video-cover img')?.src || '';
    
    const existingIndex = cartItems.findIndex(item => item.video_id === videoId);
    
    if (existingIndex >= 0) {
        // Remove from cart
        cartItems.splice(existingIndex, 1);
        showNotification('Removed from cart', 'success');
    } else {
        // Add to cart
        cartItems.push({
            video_id: videoId,
            title: videoTitle,
            author: videoAuthor,
            price: videoPrice,
            thumbnail: videoThumbnail,
            quantity: 1,
            added_at: Date.now()
        });
        showNotification('Added to cart!', 'success');
    }
    
    saveCart();
}

// Enhanced video element creation with data-video-id
function createVideoElement(video, index) {
    const likes = parseInt(video.likes) || 0;
    const stars = calculateStars(likes);
    const starsPercentage = (stars / 5) * 100;
    
    if (!video || typeof video !== 'object') {
        console.error('Invalid video data:', video);
        return null;
    }
    
    const videoDiv = document.createElement('div');
    videoDiv.className = 'video anim';
    videoDiv.style.setProperty('--delay', `${0.4 + (index % 4) * 0.1}s`);
    
    videoDiv.setAttribute('data-video-id', video.id || '');
    videoDiv.setAttribute('data-video-status', video.status || 'online');
    videoDiv.setAttribute('data-description', video.description || 'No description available');
    
videoDiv.addEventListener('click', function(e) {
    // Check if click came from buy button or its container
    if (e.target.closest('.buy-button-top') || e.target.closest('.video-top-edge')) {
        return; // Don't navigate to video
    }
    playVideoInStreamView(video);
    
    // SET THE CURRENT VIDEO ID HERE
    currentVideoId = video.id || '';
    console.log('🎬 Current video set to:', currentVideoId);
    
    // Update buy button colors
    updateAllBuyButtons();
});
    
    const isOnline = video.status === 'online';
    const authorClass = isOnline ? 'online' : 'offline';
    
    let authorImgSrc = video.authorImg || '';
    if (authorImgSrc && authorImgSrc.includes('api.php?file=')) {
        // It's a local file, use as-is
    } else if (!authorImgSrc || authorImgSrc.includes('example.com')) {
        authorImgSrc = getDefaultAuthorImage(index);
    }
    
    let videoSrc = video.videoSrc || '';
    let videoCoverSrc = video.coverImg || video.authorImg || getDefaultVideoCover(index);
    
    if (videoSrc && !videoCoverSrc) {
        videoCoverSrc = authorImgSrc;
    }
    
    if (videoSrc && videoSrc.includes('api.php?file=')) {
        // Local video file - use as-is
    } else if (!videoSrc) {
        videoSrc = '';
    }

    videoDiv.innerHTML = `
        <!-- BUY BUTTON AT TOP EDGE (RIGHT SIDE) -->
        <div class="video-top-edge">
            <button class="buy-button-top" data-video-id="${video.id || ''}" title="Add to cart">
                <i class="fas fa-shopping-cart"></i>
            </button>
        </div>
        
        <div class="video-time">
            <img src="saudi-riyal-symbol/saudi-riyal-symbol.svg" class="price-svg" alt="SAR">
            ${video.price || '0'}
        </div>
        
        <div class="video-wrapper">
            <div class="video-cover">
                <img src="${videoCoverSrc}" alt="${video.title || 'Video Cover'}" 
                     onerror="this.onerror=null; this.src='${getDefaultVideoCover(index)}'">
                <div class="video-play-overlay">
                    <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </div>
            </div>
            ${videoSrc ? `
            <video muted style="display: none;">
                <source src="${videoSrc}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            ` : ''}
            <div class="author-img__wrapper video-author">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
                <img class="author-img" src="${authorImgSrc}" alt="${video.author}" 
                     onerror="this.onerror=null; this.src='${getDefaultAuthorImage(index)}'">
            </div>
        </div>
        
        <!-- ORIGINAL: Video name -->
        <div class="video-name">${video.title || 'Untitled Video'}</div>
        
        <!-- ORIGINAL: Video by with status -->
        <div class="video-by ${authorClass}">${video.author || 'Unknown Author'}</div>
        
        <!-- ORIGINAL: Video view with stars AT BOTTOM -->
        <div class="video-view">
            <span class="view-text">
                ${video.views || '0 views'}<span class="seperate video-seperate"></span>${video.timeAgo || 'Just now'}
            </span>
            <!-- STARS AT BOTTOM EDGE (RIGHT SIDE) -->
            <span class="view-stars">
                <span class="stars-container">
                    <span class="stars-background">★★★★★</span>
                    <span class="stars-fill" style="width: ${starsPercentage}%">★★★★★</span>
                </span>
            </span>
        </div>
    `;
    
    return videoDiv;
}

// Setup modal events
function setupModalEvents() {
    // Close modal button
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            closeShoppingModal();
        });
    }
    
    // Modal backdrop click
    const modal = document.getElementById('shoppingModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeShoppingModal();
            }
        });
    }
    
    // Payment methods
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            paymentMethod = this.dataset.method;
            
            // Show/hide credit card fields
            const ccFields = document.getElementById('creditCardFields');
            if (ccFields) {
                ccFields.classList.toggle('show', paymentMethod === 'credit_card');
            }
        });
    });
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

// Open shopping modal - ONLY opened by cart header button
function openShoppingModal(videoId = null) {
    console.log('🛒 Opening shopping modal for video:', videoId);
    
    const modal = document.getElementById('shoppingModal');
    if (!modal) return;
    
    if (videoId) {
        // Get video data from the clicked video
        const videoElement = document.querySelector(`.video[data-video-id="${videoId}"]`);
        if (videoElement) {
            const videoTitle = videoElement.querySelector('.video-name').textContent;
            const videoAuthor = videoElement.querySelector('.video-by').textContent.replace('•', '').trim();
            const videoPriceText = videoElement.querySelector('.video-time').textContent.replace('SAR', '').trim();
            const videoPrice = parseFloat(videoPriceText) || 0;
            const videoThumbnail = videoElement.querySelector('.video-cover img').src;
            
            currentVideoId = videoId;
            currentVideoPrice = videoPrice;
            
            // Update modal with video info
            document.getElementById('modalProductTitle').textContent = videoTitle;
            document.getElementById('modalProductAuthor').textContent = 'By ' + videoAuthor;
            document.getElementById('modalProductPrice').textContent = videoPrice.toFixed(2);
            document.getElementById('modalProductImage').src = videoThumbnail;
            
            // Update video player price
            const currentPriceEl = document.getElementById('currentVideoPrice');
            if (currentPriceEl) {
                currentPriceEl.textContent = videoPrice.toFixed(2);
            }
        }
    }
    
    // Update cart items
    updateCartModal();
    
    // Add shipping section
    setTimeout(addShippingSectionToModal, 100);
    
    // Show modal
    modal.classList.add('show');
    
    // Scroll to top of modal
    modal.querySelector('.shopping-modal-content').scrollTop = 0;
}

// Close shopping modal
function closeShoppingModal() {
    document.getElementById('shoppingModal').classList.remove('show');
}

// Update cart modal display (COMPACT VERSION)
function updateCartModal() {
    const cartItemsList = document.getElementById('cartItemsList');
    const cartItemCount = document.getElementById('cartItemCount');
    const cartTotalAmount = document.getElementById('cartTotalAmount');
    
    if (cartItems.length === 0) {
        cartItemsList.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartItemCount.textContent = '0';
        cartTotalAmount.textContent = 'SAR 0.00';
        return;
    }
    
    let total = 0;
    let itemsHtml = '';
    
    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        itemsHtml += `
            <div class="cart-item" data-video-id="${item.video_id}">
                <img src="${item.thumbnail}" class="cart-item-image" alt="${item.title}">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-author">By ${item.author}</div>
                    <div class="cart-item-price">
                        <img src="saudi-riyal-symbol/saudi-riyal-symbol.svg" class="price-svg" style="width:12px;height:12px;" alt="SAR">
                        ${itemTotal.toFixed(2)}
                    </div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="qty-btn decrease-qty" data-video-id="${item.video_id}">-</button>
                        <input type="text" class="qty-input" value="${item.quantity}" data-video-id="${item.video_id}" readonly>
                        <button class="qty-btn increase-qty" data-video-id="${item.video_id}">+</button>
                    </div>
                    <button class="remove-btn remove-item" data-video-id="${item.video_id}">Remove</button>
                </div>
            </div>
        `;
    });
    
    cartItemsList.innerHTML = itemsHtml;
    cartItemCount.textContent = cartItems.length;
    cartTotalAmount.textContent = 'SAR ' + total.toFixed(2);
    
    // Attach event listeners to quantity buttons
    document.querySelectorAll('.decrease-qty').forEach(btn => {
        btn.addEventListener('click', function() {
            const videoId = this.dataset.videoId;
            updateCartItemQuantity(videoId, -1);
        });
    });
    
    document.querySelectorAll('.increase-qty').forEach(btn => {
        btn.addEventListener('click', function() {
            const videoId = this.dataset.videoId;
            updateCartItemQuantity(videoId, 1);
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const videoId = this.dataset.videoId;
            removeFromCart(videoId);
        });
    });
}

// Update cart item quantity
function updateCartItemQuantity(videoId, change) {
    const itemIndex = cartItems.findIndex(item => item.video_id === videoId);
    if (itemIndex >= 0) {
        const newQuantity = cartItems[itemIndex].quantity + change;
        
        if (newQuantity <= 0) {
            removeFromCart(videoId);
        } else if (newQuantity <= 10) {
            cartItems[itemIndex].quantity = newQuantity;
            saveCart();
            updateCartModal();
        }
    }
}

// Remove item from cart
function removeFromCart(videoId) {
    cartItems = cartItems.filter(item => item.video_id !== videoId);
    saveCart();
    showNotification('Item removed from cart', 'success');
    updateCartModal();
    updateAllBuyButtons();
}

// Handle checkout
function handleCheckout() {
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    
    if (!name || !email) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (cartItems.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    // Check shipping address
    let shippingAddress = savedShippingAddress;
    if (!shippingAddress) {
        // Check if shipping form has data
        const shipName = document.getElementById('shipName')?.value.trim();
        const shipAddress = document.getElementById('shipAddress')?.value.trim();
        const shipCity = document.getElementById('shipCity')?.value.trim();
        const shipZip = document.getElementById('shipZip')?.value.trim();
        const shipPhone = document.getElementById('shipPhone')?.value.trim();
        
        if (shipName && shipAddress && shipCity && shipZip && shipPhone) {
            shippingAddress = {
                name: shipName,
                address: shipAddress,
                city: shipCity,
                zip: shipZip,
                phone: shipPhone,
                email: document.getElementById('shipEmail')?.value.trim() || ''
            };
            saveShipping(shippingAddress);
        } else {
            showNotification('Please add a shipping address', 'error');
            return;
        }
    }
    
    // Create order data
    const orderData = {
        items: cartItems,
        customer_name: name,
        customer_email: email,
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
        total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        order_date: new Date().toISOString()
    };
    
    // Save order via API
    const formData = new FormData();
    formData.append('action', 'checkout');
    formData.append('order_data', JSON.stringify(orderData));
    
    fetch('https://pazzle-store-api.mus00204.workers.dev/database/api', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Clear cart
            cartItems = [];
            saveCart();
            
            // Close modal
            closeShoppingModal();
            
            // Reset form
            document.getElementById('customerName').value = '';
            document.getElementById('customerEmail').value = '';
            
            showNotification(`Order #${data.order_id} placed successfully!`, 'success');
        } else {
            showNotification(data.message || 'Checkout failed', 'error');
        }
    })
    .catch(error => {
        console.error('Checkout error:', error);
        showNotification('Order saved locally', 'success');
        
        // Fallback: save to localStorage
        const orders = JSON.parse(localStorage.getItem('skateboard_orders') || '[]');
        const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        orders.push({ order_id: orderId, ...orderData, status: 'pending' });
        localStorage.setItem('skateboard_orders', JSON.stringify(orders));
        
        // Clear cart
        cartItems = [];
        saveCart();
        closeShoppingModal();
    });
}

// ===== SHIPPING ADDRESS SYSTEM =====
function addShippingSectionToModal() {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody || document.getElementById('shippingSection')) return;
    
    const shippingHTML = `
        <div class="shipping-section" id="shippingSection">
            <h4><i class="fas fa-truck"></i> Shipping Address</h4>
            
            <button class="shipping-toggle-btn" id="shippingToggleBtn">
                <i class="fas fa-address-card"></i>
                <span id="shippingBtnText">${savedShippingAddress ? 'Edit Shipping Address' : 'Add Shipping Address'}</span>
                <i class="fas fa-chevron-down" id="shippingArrow"></i>
            </button>
            
            <div class="shipping-form" id="shippingForm">
                <input type="text" id="shipName" placeholder="Full Name *" required value="${savedShippingAddress?.name || ''}">
                <input type="text" id="shipAddress" placeholder="Street Address *" required value="${savedShippingAddress?.address || ''}">
                <div class="form-row">
                    <input type="text" id="shipCity" placeholder="City *" required value="${savedShippingAddress?.city || ''}">
                    <input type="text" id="shipZip" placeholder="ZIP Code *" required value="${savedShippingAddress?.zip || ''}">
                </div>
                <input type="tel" id="shipPhone" placeholder="Phone Number *" required value="${savedShippingAddress?.phone || ''}">
                <input type="email" id="shipEmail" placeholder="Email (optional)" value="${savedShippingAddress?.email || ''}">
                <div class="shipping-buttons">
                    <button class="cancel-ship" id="cancelShip">Cancel</button>
                    <button class="save-ship" id="saveShip">Save Address</button>
                </div>
            </div>
            
            ${savedShippingAddress ? `
            <div class="saved-address-display" id="savedAddressDisplay">
                <div class="address-info">
                    <div class="address-details">
                        <strong>${savedShippingAddress.name}</strong>
                        ${savedShippingAddress.address}<br>
                        ${savedShippingAddress.city}, ${savedShippingAddress.zip}<br>
                        ${savedShippingAddress.phone}
                        ${savedShippingAddress.email ? `<br>${savedShippingAddress.email}` : ''}
                    </div>
                    <button class="edit-address-btn" id="editAddressBtn">Edit</button>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Insert after cart items section
    const cartSection = modalBody.querySelector('.cart-items-section');
    if (cartSection) {
        cartSection.insertAdjacentHTML('afterend', shippingHTML);
        setupShippingEvents();
    }
}

function setupShippingEvents() {
    const shippingToggleBtn = document.getElementById('shippingToggleBtn');
    const shippingForm = document.getElementById('shippingForm');
    const cancelShipBtn = document.getElementById('cancelShip');
    const saveShipBtn = document.getElementById('saveShip');
    const editAddressBtn = document.getElementById('editAddressBtn');
    
    if (shippingToggleBtn) {
        shippingToggleBtn.addEventListener('click', function() {
            const isVisible = shippingForm.classList.contains('show');
            shippingForm.classList.toggle('show', !isVisible);
            const arrow = document.getElementById('shippingArrow');
            if (arrow) {
                arrow.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            }
        });
    }
    
    if (editAddressBtn) {
        editAddressBtn.addEventListener('click', function() {
            shippingForm.classList.add('show');
            const arrow = document.getElementById('shippingArrow');
            if (arrow) arrow.className = 'fas fa-chevron-up';
        });
    }
    
    if (cancelShipBtn) {
        cancelShipBtn.addEventListener('click', function() {
            shippingForm.classList.remove('show');
            const arrow = document.getElementById('shippingArrow');
            if (arrow) arrow.className = 'fas fa-chevron-down';
        });
    }
    
    if (saveShipBtn) {
        saveShipBtn.addEventListener('click', function() {
            const address = {
                name: document.getElementById('shipName').value.trim(),
                address: document.getElementById('shipAddress').value.trim(),
                city: document.getElementById('shipCity').value.trim(),
                zip: document.getElementById('shipZip').value.trim(),
                phone: document.getElementById('shipPhone').value.trim(),
                email: document.getElementById('shipEmail')?.value.trim() || ''
            };
            
            // Validate required fields
            if (!address.name || !address.address || !address.city || !address.zip || !address.phone) {
                showNotification('Please fill all required fields (*)', 'error');
                return;
            }
            
            saveShipping(address);
            shippingForm.classList.remove('show');
            document.getElementById('shippingBtnText').textContent = 'Edit Shipping Address';
            document.getElementById('shippingArrow').className = 'fas fa-chevron-down';
            
            // Update display
            const display = document.getElementById('savedAddressDisplay');
            if (display) {
                display.innerHTML = `
                    <div class="address-info">
                        <div class="address-details">
                            <strong>${address.name}</strong>
                            ${address.address}<br>
                            ${address.city}, ${address.zip}<br>
                            ${address.phone}
                            ${address.email ? `<br>${address.email}` : ''}
                        </div>
                        <button class="edit-address-btn" id="editAddressBtn">Edit</button>
                    </div>
                `;
                // Re-attach edit button event
                document.getElementById('editAddressBtn')?.addEventListener('click', function() {
                    shippingForm.classList.add('show');
                    document.getElementById('shippingArrow').className = 'fas fa-chevron-up';
                });
            }
            
            showNotification('Shipping address saved!', 'success');
        });
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingToast = document.querySelector('.notification-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new notification
    const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Show with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Update current video for buy button
function updateCurrentVideoForBuy(videoId, videoPrice) {
    currentVideoId = videoId;
    currentVideoPrice = videoPrice || 0;
    
    console.log('📹 Setting current video:', videoId, 'Price:', videoPrice);
    
    // Update price display in video player
    const priceElement = document.getElementById('currentVideoPrice');
    if (priceElement) {
        priceElement.textContent = currentVideoPrice.toFixed(2);
    }
    
    // Update buy button color
    updateAllBuyButtons();
}
// ===== EVENT HANDLING FOR TOP-EDGE BUY BUTTON =====
document.addEventListener('click', function(e) {
    const buyButton = e.target.closest('.buy-button-top');
    if (buyButton) {
        e.stopPropagation();
        e.preventDefault();
        
        const videoId = buyButton.getAttribute('data-video-id');
        const videoCard = buyButton.closest('.video');
        
        if (videoCard && videoId) {
            toggleVideoInCart(videoId); // NO MODAL - just add to cart
        }
    }
});
// ===== FIX EVENT BUBBLING FOR BUY BUTTONS =====
document.addEventListener('click', function(e) {
    // Handle top-edge buy buttons (thumbnail videos)
    const buyButton = e.target.closest('.buy-button-top');
    if (buyButton) {
        e.stopPropagation(); // STOP the click from reaching video card
        e.preventDefault();
        
        const videoId = buyButton.getAttribute('data-video-id');
        if (videoId) {
            toggleVideoInCart(videoId); // Add/remove from cart
            
            // Update current video for stream area
            currentVideoId = videoId;
            updateAllBuyButtons();
        }
        return; // IMPORTANT: Don't let event bubble further
    }
    
    // Handle stream-area buy button
    const streamBuyBtn = e.target.closest('#buyButton');
    if (streamBuyBtn) {
        e.stopPropagation();
        if (currentVideoId) {
            toggleVideoInCart(currentVideoId); // Add/remove from cart
        } else {
            showNotification('Please select a video first', 'error');
        }
    }
});

// ===== ALSO UPDATE THE toggleVideoInCart FUNCTION =====
function toggleVideoInCart(videoId) {
    const videoCard = document.querySelector(`.video[data-video-id="${videoId}"]`);
    if (!videoCard) return;
    
    const videoTitle = videoCard.querySelector('.video-name')?.textContent || 'Video';
    const videoAuthor = videoCard.querySelector('.video-by')?.textContent.replace('•', '').trim() || 'Unknown';
    const videoPriceText = videoCard.querySelector('.video-time')?.textContent.replace('SAR', '').trim() || '0';
    const videoPrice = parseFloat(videoPriceText) || 0;
    const videoThumbnail = videoCard.querySelector('.video-cover img')?.src || '';
    
    const existingIndex = cartItems.findIndex(item => item.video_id === videoId);
    
    if (existingIndex >= 0) {
        // Remove from cart
        cartItems.splice(existingIndex, 1);
        showNotification('Removed from cart', 'success');
    } else {
        // Add to cart
        cartItems.push({
            video_id: videoId,
            title: videoTitle,
            author: videoAuthor,
            price: videoPrice,
            thumbnail: videoThumbnail,
            quantity: 1,
            added_at: Date.now()
        });
        showNotification('Added to cart!', 'success');
    }
    
    saveCart();
    updateAllBuyButtons(); // Make sure this is called
}
// ===== GLOBAL CLICK HANDLER TO STOP EVENT BUBBLING =====
document.addEventListener('click', function(e) {
    // Handle thumbnail buy buttons
    if (e.target.closest('.buy-button-top')) {
        e.stopPropagation();
        e.preventDefault();
        
        const buyBtn = e.target.closest('.buy-button-top');
        const videoId = buyBtn.getAttribute('data-video-id');
        
        if (videoId) {
            toggleVideoInCart(videoId);
            // DON'T navigate to video - event is stopped
        }
        return false; // Stop all further processing
    }
}, true); // Use capture phase (true)

// ===== UPDATE toggleVideoInCart TO LOG ACTIONS =====
function toggleVideoInCart(videoId) {
    console.log('🛒 Toggling cart for video:', videoId);
    
    const videoCard = document.querySelector(`.video[data-video-id="${videoId}"]`);
    if (!videoCard) {
        console.error('Video card not found:', videoId);
        return;
    }
    
    const videoTitle = videoCard.querySelector('.video-name')?.textContent || 'Video';
    const videoAuthor = videoCard.querySelector('.video-by')?.textContent.replace('•', '').trim() || 'Unknown';
    const videoPriceText = videoCard.querySelector('.video-time')?.textContent.replace('SAR', '').trim() || '0';
    const videoPrice = parseFloat(videoPriceText) || 0;
    const videoThumbnail = videoCard.querySelector('.video-cover img')?.src || '';
    
    const existingIndex = cartItems.findIndex(item => item.video_id === videoId);
    
    if (existingIndex >= 0) {
        // Remove from cart
        cartItems.splice(existingIndex, 1);
        showNotification('Removed from cart', 'success');
        console.log('➖ Removed:', videoTitle);
    } else {
        // Add to cart
        cartItems.push({
            video_id: videoId,
            title: videoTitle,
            author: videoAuthor,
            price: videoPrice,
            thumbnail: videoThumbnail,
            quantity: 1,
            added_at: Date.now()
        });
        showNotification('Added to cart!', 'success');
        console.log('➕ Added:', videoTitle);
    }
    
    saveCart(); // This will update badge and buttons
}
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeCartSystem();
        console.log('✅ Cart system initialized');
    }, 1000);
});

// Export for use in main script
window.cartSystem = {
    initializeCartSystem,
    toggleVideoInCart,
    updateCurrentVideoForBuy,
    openShoppingModal,
    closeShoppingModal
};


// ===== SIMPLE BUY BUTTON EVENT HANDLER =====
document.addEventListener('click', function(e) {
    // Handle thumbnail buy buttons
    if (e.target.closest('.buy-button-top')) {
        e.preventDefault();
        e.stopPropagation();
        
        const buyButton = e.target.closest('.buy-button-top');
        const videoId = buyButton.getAttribute('data-video-id');
        
        if (videoId) {
            toggleVideoInCart(videoId);
        }
        return false;
    }
    
    // Handle stream-area buy button
    if (e.target.closest('#buyButton')) {
        e.stopPropagation();
        if (currentVideoId) {
            toggleVideoInCart(currentVideoId);
        } else {
            showNotification('Please select a video first', 'error');
        }
    }
});

// ===== LOAD CART ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Page loaded, loading cart...');
    
    // Load cart from localStorage
    loadCart();
    loadShipping();
    
    // Update display
    updateCartBadge();
    updateAllBuyButtons();
    
    console.log('✅ Cart loaded:', cartItems.length, 'items');
});
