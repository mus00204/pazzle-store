-- ============================================
-- CLOUDFLARE D1 DATABASE SCHEMA
-- Run this in D1 SQL editor
-- ============================================

-- Videos table (main content)
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price TEXT,
    views TEXT,
    timeAgo TEXT,
    status TEXT DEFAULT 'online',
    description TEXT,
    videoSrc TEXT,
    authorImg TEXT,
    coverImg TEXT,
    likes INTEGER DEFAULT 0,
    availability TEXT DEFAULT 'available',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY DEFAULT 'cmt_' || substr(hex(randomblob(8)), 1, 12),
    video_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    parentId TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Availability table
CREATE TABLE IF NOT EXISTS availability (
    video_id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'available',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Users table (from php/api.php)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT 'usr_' || substr(hex(randomblob(8)), 1, 12),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table (from database/api.php)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT 'prod_' || substr(hex(randomblob(8)), 1, 12),
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    image TEXT,
    stock INTEGER DEFAULT 0,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY DEFAULT 'cart_' || substr(hex(randomblob(8)), 1, 12),
    user_id TEXT,
    product_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT 'ord_' || substr(hex(randomblob(8)), 1, 12),
    user_id TEXT,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default avatars (from get-avatars.php)
CREATE TABLE IF NOT EXISTS default_avatars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    avatar_path TEXT NOT NULL
);

-- Insert avatar data (run after table creation)
INSERT INTO default_avatars (avatar_path) VALUES 
('./avatars/emojis.com -2024-dodge-hellcat.png'),
('./avatars/emojis.com 2022-black-challenger-gt.png'),
('./avatars/emojis.com 2022-black-gmc-denali-windows-tinted-heavy-hauling.png'),
('./avatars/emojis.com 2022-dodge-challenger-scatpack.png'),
('./avatars/emojis.com 2022-orange-ford-mustang.png');
-- Add more as needed from your get-avatars.php