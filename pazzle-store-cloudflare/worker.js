// ============================================
// CLOUDFLARE WORKER - Replaces ALL PHP files
// api.php, comments.php, availability-api.php,
// get-avatars.php, php/api.php, database/api.php
// ============================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // ==================== MAIN VIDEO API (replaces api.php) ====================
      if (path === '/api' || path === '/api.php') {
        // GET: List all videos
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            `SELECT v.*, a.status as availability 
             FROM videos v 
             LEFT JOIN availability a ON v.id = a.video_id 
             WHERE v.status = 'online' 
             ORDER BY v.createdAt DESC`
          ).all();
          
          return jsonResponse(results, corsHeaders);
        }
        
        // POST: Add/update video (admin)
        if (method === 'POST') {
          const formData = await request.formData();
          const action = formData.get('action');
          
          if (action === 'add_video_admin') {
            const title = formData.get('title');
            const description = formData.get('description');
            const price = formData.get('price') || '0';
            const views = formData.get('views') || '0';
            const status = formData.get('status') || 'online';
            const timeAgo = formData.get('time_ago') || '';
            const likes = formData.get('likes') || 0;
            const id = formData.get('id') || `vid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            
            // Check if editing existing video
            const existingVideo = await env.DB.prepare(
              "SELECT id FROM videos WHERE id = ?"
            ).bind(id).first();
            
            if (existingVideo) {
              // Update existing video
              await env.DB.prepare(
                `UPDATE videos SET title = ?, description = ?, price = ?, views = ?, 
                 status = ?, timeAgo = ?, likes = ? WHERE id = ?`
              ).bind(title, description, price, views, status, timeAgo, likes, id).run();
            } else {
              // Insert new video
              await env.DB.prepare(
                `INSERT INTO videos (id, title, description, price, views, status, timeAgo, likes, createdAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
              ).bind(id, title, description, price, views, status, timeAgo, likes).run();
            }
            
            return jsonResponse({ success: true, id }, corsHeaders);
          }
        }
      }
      
      // ==================== COMMENTS API (replaces comments.php) ====================
      if (path === '/comments' || path === '/comments.php') {
        const videoId = url.searchParams.get('video');
        
        if (method === 'GET') {
          if (videoId) {
            // Get comments for specific video
            const { results } = await env.DB.prepare(
              "SELECT * FROM comments WHERE video_id = ? ORDER BY timestamp DESC"
            ).bind(videoId).all();
            return jsonResponse(results, corsHeaders);
          } else {
            // Get all comments
            const { results } = await env.DB.prepare(
              "SELECT * FROM comments ORDER BY timestamp DESC"
            ).all();
            return jsonResponse(results, corsHeaders);
          }
        }
        
        if (method === 'POST') {
          const data = await request.json();
          const commentId = `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          
          await env.DB.prepare(
            `INSERT INTO comments (id, video_id, user_id, user_name, user_avatar, content, parentId, timestamp) 
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
          ).bind(
            commentId,
            data.videoId,
            data.userId,
            data.userName,
            data.userAvatar,
            data.content,
            data.parentId || null
          ).run();
          
          return jsonResponse({ success: true, id: commentId }, corsHeaders);
        }
      }
      
      // ==================== AVAILABILITY API (replaces availability-api.php) ====================
      if (path === '/availability-api' || path === '/availability-api.php') {
        const action = url.searchParams.get('action');
        
        if (action === 'get_all') {
          // Get all availability statuses
          const { results } = await env.DB.prepare(
            "SELECT * FROM availability"
          ).all();
          
          const availabilities = {};
          results.forEach(row => {
            availabilities[row.video_id] = row.status;
          });
          
          return jsonResponse({ success: true, availabilities }, corsHeaders);
        }
        
        if (method === 'POST') {
          const formData = await request.formData();
          const updateAction = formData.get('action');
          const videoId = formData.get('video_id');
          const availability = formData.get('availability');
          
          if (updateAction === 'update') {
            // Upsert availability
            await env.DB.prepare(
              `INSERT INTO availability (video_id, status, updated_at) 
               VALUES (?, ?, datetime('now')) 
               ON CONFLICT(video_id) DO UPDATE SET status = ?, updated_at = datetime('now')`
            ).bind(videoId, availability, availability).run();
            
            return jsonResponse({ success: true }, corsHeaders);
          }
        }
      }
      
      // ==================== AVATARS API (replaces get-avatars.php) ====================
      if (path === '/get-avatars' || path === '/get-avatars.php') {
        const { results } = await env.DB.prepare(
          "SELECT avatar_path FROM default_avatars"
        ).all();
        
        const avatarPaths = results.map(row => row.avatar_path);
        return jsonResponse(avatarPaths, corsHeaders);
      }
      
      // ==================== USER AUTH API (replaces php/api.php) ====================
      if (path === '/php/api' || path === '/php/api.php') {
        if (method === 'POST') {
          const data = await request.json();
          const action = data.action;
          
          // Login
          if (action === 'login') {
            const { email, password } = data;
            const user = await env.DB.prepare(
              "SELECT * FROM users WHERE email = ?"
            ).bind(email).first();
            
            if (!user) {
              return jsonResponse({ success: false, error: 'User not found' }, corsHeaders, 404);
            }
            
            // In production, use proper password hashing like bcrypt
            // For now, simple check (replace with your actual auth logic)
            if (user.password_hash !== password) { // This is just placeholder
              return jsonResponse({ success: false, error: 'Invalid password' }, corsHeaders, 401);
            }
            
            return jsonResponse({
              success: true,
              user: {
                id: user.id,
                email: user.email,
                username: user.username
              }
            }, corsHeaders);
          }
          
          // Register
          if (action === 'register') {
            const { email, password, username } = data;
            
            // Check if user exists
            const existingUser = await env.DB.prepare(
              "SELECT id FROM users WHERE email = ? OR username = ?"
            ).bind(email, username).first();
            
            if (existingUser) {
              return jsonResponse({ success: false, error: 'User already exists' }, corsHeaders, 409);
            }
            
            // Create new user (in production, hash the password!)
            const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            await env.DB.prepare(
              "INSERT INTO users (id, email, password_hash, username) VALUES (?, ?, ?, ?)"
            ).bind(userId, email, password, username).run(); // Hash password in production!
            
            return jsonResponse({
              success: true,
              user: { id: userId, email, username }
            }, corsHeaders);
          }
        }
      }
      
      // ==================== E-COMMERCE API (replaces database/api.php) ====================
      if (path === '/database/api' || path === '/database/api.php') {
        const action = url.searchParams.get('action');
        
        // Get all products
        if (action === 'get_products') {
          const { results } = await env.DB.prepare(
            "SELECT * FROM products ORDER BY created_at DESC"
          ).all();
          return jsonResponse(results, corsHeaders);
        }
        
        // Get single product
        if (action === 'get_product') {
          const productId = url.searchParams.get('id');
          const product = await env.DB.prepare(
            "SELECT * FROM products WHERE id = ?"
          ).bind(productId).first();
          return jsonResponse(product, corsHeaders);
        }
        
        if (method === 'POST') {
          const data = await request.json();
          
          // Add to cart
          if (data.action === 'add_to_cart') {
            const cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            await env.DB.prepare(
              "INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)"
            ).bind(cartId, data.userId, data.productId, data.quantity || 1).run();
            
            return jsonResponse({ success: true, cartId }, corsHeaders);
          }
          
          // Create order
          if (data.action === 'create_order') {
            const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            await env.DB.prepare(
              "INSERT INTO orders (id, user_id, total, shipping_address) VALUES (?, ?, ?, ?)"
            ).bind(orderId, data.userId, data.total, data.shippingAddress).run();
            
            return jsonResponse({ success: true, orderId }, corsHeaders);
          }
        }
      }
      
      // ==================== HEALTH CHECK ====================
      if (path === '/health') {
        try {
          await env.DB.prepare("SELECT 1").first();
          return jsonResponse({ status: 'healthy', database: 'connected' }, corsHeaders);
        } catch (error) {
          return jsonResponse({ status: 'unhealthy', error: error.message }, corsHeaders, 500);
        }
      }
      
      // Return 404 for unknown routes
      return jsonResponse({ error: 'Not Found' }, corsHeaders, 404);
      
    } catch (error) {
      console.error('Worker Error:', error);
      return jsonResponse({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }, corsHeaders, 500);
    }
  }
};

// Helper function for JSON responses
function jsonResponse(data, additionalHeaders = {}, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders
    }
  });
}