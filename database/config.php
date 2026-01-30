cat > database/config.php << 'EOF'
<?php
// database/config.php - Centralized database configuration
session_start();

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'mustafa08');
define('DB_NAME', 'test');

// Error reporting (development only)
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * Get database connection (singleton pattern)
 */
function getDBConnection() {
    static $conn = null;
    
    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            error_log("Database connection failed: " . $conn->connect_error);
            http_response_code(500);
            die(json_encode(['success' => false, 'error' => 'Database connection failed']));
        }
        
        $conn->set_charset("utf8mb4");
    }
    
    return $conn;
}

/**
 * Execute SQL query
 */
function db_query($sql) {
    $conn = getDBConnection();
    $result = $conn->query($sql);
    
    if (!$result) {
        error_log("Query failed: " . $conn->error . " - SQL: " . $sql);
        return false;
    }
    
    return $result;
}

/**
 * Fetch all rows from SQL query
 */
function db_fetch_all($sql) {
    $result = db_query($sql);
    
    if (!$result) return [];
    
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    
    return $rows;
}

/**
 * Fetch single row from SQL query
 */
function db_fetch_one($sql) {
    $result = db_query($sql);
    return $result ? $result->fetch_assoc() : null;
}

/**
 * Escape string for SQL
 */
function db_escape($string) {
    $conn = getDBConnection();
    return $conn->real_escape_string($string);
}

/**
 * Get last insert ID
 */
function db_last_id() {
    return getDBConnection()->insert_id;
}

/**
 * Count rows in table
 */
function db_count($table, $where = '') {
    $sql = "SELECT COUNT(*) as count FROM $table";
    if ($where) $sql .= " WHERE $where";
    
    $result = db_fetch_one($sql);
    return $result ? $result['count'] : 0;
}
?>
EOF