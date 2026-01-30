<?php
// database/api.php - SIMPLE WORKING VERSION
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// SIMPLE DATABASE CONNECTION
function getDB() {
    static $db = null;
    if ($db === null) {
        $db = new mysqli('localhost', 'root', 'mustafa08', 'test');
        if ($db->connect_error) {
            die(json_encode(['error' => 'DB connection failed']));
        }
        $db->set_charset("utf8mb4");
    }
    return $db;
}

// HANDLE GET REQUESTS
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $db = getDB();
    $result = $db->query("SELECT * FROM videos WHERE status = 'online' ORDER BY created_at DESC");
    
    $videos = [];
    while ($row = $result->fetch_assoc()) {
        $videos[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'author' => $row['author'],
            'time' => $row['price'], // 'time' is actually price
            'views' => $row['views'],
            'timeAgo' => $row['time_ago'],
            'status' => $row['status'],
            'description' => $row['description'],
            'videoSrc' => $row['video_src'],
            'authorImg' => $row['author_img'],
            'coverImg' => $row['cover_img'] ?: $row['author_img'],
            'likes' => intval($row['likes']),
            'createdAt' => $row['created_at']
            
        ];
    }
    
    echo json_encode($videos);
    exit;
}

// For POST/DELETE requests, return simple response
echo json_encode(['success' => false, 'error' => 'Method not implemented']);
?>