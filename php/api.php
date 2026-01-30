<?php
// /hex/-/php/api.php - COMPLETE WITH BREVO API

// Error handling
error_reporting(0);
ini_set('display_errors', 0);

// Headers
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Database connection
try {
    $pdo = new PDO("mysql:host=localhost;dbname=pazzle_store", "root", "mustafa08");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit();
}

// Get input
$input = file_get_contents('php://input');
$data = json_decode($input, true) ?: $_POST ?: $_GET;

$action = $data['action'] ?? '';

// Password generator
function generatePassword() {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $password = '';
    for ($i = 0; $i < 6; $i++) {
        $password .= $chars[rand(0, strlen($chars) - 1)];
    }
    return $password;
}

// FUNCTION FOR SENDING EMAILS DIRECTLY TO USERS (not admin)
function sendEmailDirect($to_email, $subject, $message) {
    // YOUR REAL BREVO API KEY
    $api_key = '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';
    
    // Brevo API endpoint
    $url = 'https://api.brevo.com/v3/smtp/email';
    
    // Prepare email data
    $email_data = [
        'sender' => [
            'name' => 'Skateboard Platform',
            'email' => 'pazzlestore@hotmail.com'
        ],
        'to' => [[
            'email' => $to_email,
            'name' => 'User'
        ]],
        'subject' => $subject,
        'htmlContent' => $message,
        'replyTo' => [
            'email' => 'pazzlestore@hotmail.com',
            'name' => 'Support'
        ]
    ];
    
    // Send via Brevo API
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'accept: application/json',
        'api-key: ' . $api_key,
        'content-type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Check result
    $success = ($http_code >= 200 && $http_code < 300);
    
    return [
        'success' => $success,
        'http_code' => $http_code,
        'message' => $success ? '✅ Verification email sent' : '❌ Failed to send email'
    ];
}

// EMAIL FUNCTION - Using YOUR Brevo API
function sendEmail($user_contact, $subject, $message, $isPhoneUser = false, $generated_password = '', $user_id = '') {
    // $user_contact = phone number (0563307642) or email address
    // $isPhoneUser = true if it's a phone user
    // $generated_password = the actual password passed from signup_user
    // $user_id = user ID for password links
    
    // YOUR REAL BREVO API KEY
    $api_key = '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';
    
    // Determine recipient: Phone users → your email, Email users → their email
    $email_to = $isPhoneUser ? 'pazzlestore@hotmail.com' : $user_contact;
    
    // USE THE PROVIDED PASSWORD DIRECTLY
    $password = $generated_password;
    
    // Update subject to include password for phone users
    if ($isPhoneUser && !empty($password)) {
        $subject = "New User - Phone: {$user_contact} - Password: {$password}";
        
        // Create SMS instructions in email WITH USER ID
        $sms_number = '966' . substr($user_contact, 1);
        $password_link = "https://pazzlestore.com/hex/-/php/password.html?user=" . urlencode($user_id);
        
        $message = "
        <html>
        <body style='font-family: Arial; padding: 20px;'>
            <h2>📱 SMS Action Required</h2>
            <div style='background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;'>
                <!-- REPLACED LINE - Phone number now prominent -->
                <p><strong>📱 USER PHONE NUMBER:</strong> 
                   <span style='font-size: 20px; font-weight: bold; color: #2c3e50; background: #f0f0f0; padding: 5px 10px; border-radius: 4px; display: inline-block;'>
                      {$user_contact}
                   </span>
                </p>
                
                <p><strong>Password:</strong> <span style='font-size: 24px; color: #e74c3c; font-weight: bold;'>{$password}</span></p>
                <p><strong>Time:</strong> " . date('Y-m-d H:i:s') . "</p>
                <p><strong>User ID:</strong> {$user_id}</p>
            </div>
            
            <div style='background: #d4edda; padding: 15px; border-radius: 8px;'>
                <h3>Send SMS Now:</h3>
                <p><strong>To:</strong> +{$sms_number}</p>
                <p><strong>Message:</strong></p>
                <div style='background: white; padding: 10px; border: 1px solid #ccc; font-family: monospace;'>
                    Your password: {$password}<br>
                    Manage your account: {$password_link}
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    // Brevo API endpoint
    $url = 'https://api.brevo.com/v3/smtp/email';
    
    // Prepare email data
    $email_data = [
        'sender' => [
            'name' => 'Skateboard Platform',
            'email' => 'pazzlestore@hotmail.com'
        ],
        'to' => [[
            'email' => $email_to,
            'name' => 'User'
        ]],
        'subject' => $subject,
        'htmlContent' => $message
    ];
    
    // Add reply-to for phone users
    if ($isPhoneUser) {
        $email_data['replyTo'] = [
            'email' => 'pazzlestore@hotmail.com',
            'name' => 'Support'
        ];
    }
    
    // Send via Brevo API
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'accept: application/json',
        'api-key: ' . $api_key,
        'content-type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Check result
    $success = ($http_code >= 200 && $http_code < 300);
    
    // Return result
    $result = [
        'success' => $success,
        'http_code' => $http_code,
        'password' => $password,
        'email_to' => $email_to,
        'message' => $success ? 
            ($isPhoneUser ? 
                '✅ Notification sent to pazzlestore@hotmail.com' : 
                '✅ Password sent to your email') : 
            '❌ Email service error'
    ];
    
    return $result;
}

// Handle actions
switch ($action) {
    case 'test':
        echo json_encode([
            'success' => true,
            'message' => 'Pazzle Store Login API',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        break;
        
    case 'check_user':
        $identifier = $data['identifier'] ?? '';
        
        if (empty($identifier)) {
            echo json_encode(['success' => false, 'error' => 'Identifier required']);
            break;
        }
        
        try {
            $stmt = $pdo->prepare("SELECT id, phone, email, password_hash FROM users WHERE phone = ? OR email = ?");
            $stmt->execute([$identifier, $identifier]);
            $user = $stmt->fetch();
            
            if ($user) {
                echo json_encode([
                    'success' => true,
                    'exists' => true,
                    'user_id' => $user['id'],
                    'phone' => $user['phone'],
                    'email' => $user['email'],
                    'message' => 'User exists. Please enter password.'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'exists' => false,
                    'error' => 'User not found in system',
                    'is_phone' => preg_match('/^0\d{9}$/', $identifier),
                    'is_email' => filter_var($identifier, FILTER_VALIDATE_EMAIL)
                ]);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Database error']);
        }
        break;
        
    case 'signup_user':
        $identifier = $data['identifier'] ?? '';
        
        if (empty($identifier)) {
            echo json_encode(['success' => false, 'error' => 'Phone or email required']);
            break;
        }
        
        // Validate identifier
        $isPhone = preg_match('/^0\d{9}$/', $identifier);
        $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL);
        // ADD NAME GENERATION HERE:
        $cool_names = ['Skater', 'Rider', 'GrindMaster', 'OllieKing', 'FlipPro'];
        $first_name = $cool_names[array_rand($cool_names)] . rand(100, 999);    
        if (!$isPhone && !$isEmail) {
            if (strpos($identifier, '0') === 0) {
                echo json_encode(['success' => false, 'error' => 'Phone must be 10 digits (05XXXXXXXX)']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Please enter valid phone (05XXXXXXXX) or email']);
            }
            break;
        }
        
        // Generate password
        $password = generatePassword();
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        
        try {
            // Check if already exists
            $stmt = $pdo->prepare("SELECT id, phone, email FROM users WHERE phone = ? OR email = ?");
            $stmt->execute([$identifier, $identifier]);
            $existing = $stmt->fetch();
            
            if ($existing) {
                echo json_encode([
                    'success' => true, 
                    'exists' => true,
                    'user_id' => $existing['id'],
                    'phone' => $existing['phone'],
                    'email' => $existing['email'],
                    'message' => 'User exists. Please enter password.'
                ]);
                break;
            }
            
            // Create NEW user
            if ($isPhone) {
                $stmt = $pdo->prepare("INSERT INTO users (phone, password_hash, phone_verified) VALUES (?, ?, 1)");
                $stmt->execute([$identifier, $password_hash]);
                $user_id = $pdo->lastInsertId();
                
                // Create email for pazzlestore@hotmail.com
                $sms_phone = '966' . substr($identifier, 1);
                $password_link = "https://pazzlestore.com/hex/-/php/password.html?user=$user_id";
                
                $subject = "New User - Phone: $identifier - Password: $password";
                $message = "
                <html>
                <body style='font-family: Arial; padding: 20px;'>
                <h2>New Skateboard Platform User - SMS Required</h2>
                <div style='background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;'>
                    <p><strong>📱 Phone Number:</strong> $identifier</p>
                    <p><strong>🔑 Password:</strong> <span style='font-size: 24px; font-weight: bold; color: #e74c3c;'>$password</span></p>
                    <p><strong>🔗 Password Management Link:</strong><br>
                    <a href='$password_link'>$password_link</a></p>
                    <p><strong>🆔 User ID:</strong> $user_id</p>
                    <p><strong>⏰ Time:</strong> " . date('Y-m-d H:i:s') . "</p>
                </div>
                <div style='background: #d4edda; padding: 15px; border-radius: 8px;'>
                    <h3>📲 SMS to Send:</h3>
                    <p><strong>To:</strong> +$sms_phone</p>
                    <p><strong>Message:</strong></p>
                    <div style='background: white; padding: 10px; border: 1px solid #ccc; font-family: monospace;'>
                        Your password: $password<br>
                        Manage your account: $password_link
                    </div>
                </div>
                </body>
                </html>
                ";
                
                // FIXED: Send to YOUR email with user_id parameter
                $email_result = sendEmail($identifier, $subject, $message, true, $password, $user_id);
                
                echo json_encode([
                    'success' => true,
                    'new_user' => true,
                    'user_id' => $user_id,
                    'phone' => $identifier,
                    'password' => $password,
                    'password_link' => $password_link,
                    'email_result' => $email_result,
                    'message' => 'User created! Admin will SMS the password shortly.',
                    'requires_password' => true
                ]);
                
            } else {
                $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, email_verified) VALUES (?, ?, 1)");
                $stmt->execute([$identifier, $password_hash]);
                $user_id = $pdo->lastInsertId();
                
                // Create email for user
                $password_link = "https://pazzlestore.com/hex/-/php/password.html?user=$user_id";
                
                $subject = "Your Skateboard Platform Password";
                $message = "
                <html>
                <body style='font-family: Arial; padding: 20px;'>
                <h2>Welcome to Skateboard Platform!</h2>
                <div style='background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;'>
                    <p>Your account has been created.</p>
                    <p><strong>📧 Email:</strong> $identifier</p>
                    <p><strong>🔑 Your Password:</strong> <span style='font-size: 24px; font-weight: bold;'>$password</span></p>
                    <p><strong>🔗 Manage Your Account:</strong></p>
                    <div style='background: #e8f5e9; padding: 15px; border-radius: 6px;'>
                        <a href='$password_link' style='color: #2c3e50; font-weight: bold;'>Click here to manage your password</a><br>
                        <small>$password_link</small>
                    </div>
                </div>
                </body>
                </html>
                ";
                
                // Email users get the link directly in their email
                $email_result = sendEmail($identifier, $subject, $message, false, $password, $user_id);
                
                echo json_encode([
                    'success' => true,
                    'new_user' => true,
                    'user_id' => $user_id,
                    'email' => $identifier,
                    'password' => $password,
                    'password_link' => $password_link,
                    'email_result' => $email_result,
                    'message' => 'Password sent to your email!',
                    'requires_password' => true
                ]);
            }
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
  case 'validate_login':
    $identifier = $data['identifier'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($identifier) || empty($password)) {
        echo json_encode(['success' => false, 'error' => 'Phone/Email and password required']);
        break;
    }
    
    try {
        // UPDATE THIS LINE to include first_name
        $stmt = $pdo->prepare("SELECT id, phone, email, password_hash, first_name FROM users WHERE phone = ? OR email = ?");
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch();
        
        if (!$user) {
            echo json_encode(['success' => false, 'error' => 'User not found']);
        } elseif (empty($user['password_hash'])) {
            echo json_encode(['success' => false, 'error' => 'No password set']);
        } elseif (password_verify($password, $user['password_hash'])) {
            // Create session
            $session_token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+7 days'));
            
            $stmt = $pdo->prepare("INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)");
            $stmt->execute([$user['id'], $session_token, $expires]);
            
            echo json_encode([
                'success' => true,
                'user_id' => $user['id'],
                'phone' => $user['phone'],
                'email' => $user['email'],
                'first_name' => $user['first_name'] ?: null, // ADD THIS LINE
                'session_token' => $session_token,
                'expires' => $expires,
                'message' => 'Login successful'
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Incorrect password']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
    break;
      
        
    case 'check_session':
        $session_token = $data['session_token'] ?? '';
        
        if (empty($session_token)) {
            echo json_encode(['success' => false, 'error' => 'No session']);
            break;
        }
        
        try {
            $stmt = $pdo->prepare("SELECT u.id, u.phone, u.email, s.expires_at FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > NOW()");
            $stmt->execute([$session_token]);
            $session = $stmt->fetch();
            
            if ($session) {
                echo json_encode([
                    'success' => true,
                    'user_id' => $session['id'],
                    'phone' => $session['phone'],
                    'email' => $session['email'],
                    'expires' => $session['expires_at']
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Session expired']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Database error']);
        }
        break;
        
    // PASSWORD MANAGEMENT ACTIONS
        
    case 'get_user':
        $user_id = $data['user_id'] ?? 0;
        
        if (!$user_id) {
            echo json_encode(['success' => false, 'error' => 'User ID required']);
            break;
        }
        
        try {
            $stmt = $pdo->prepare("SELECT id, phone, email, first_name, phone_verified, email_verified, created_at FROM users WHERE id = ?");            $stmt->execute([$user_id]);
            $user = $stmt->fetch();
            
            if ($user) {
                echo json_encode([
                    'success' => true,
                    'user' => $user
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'User not found']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Database error']);
        }
        break;
        
    case 'change_password':
        $user_id = $data['user_id'] ?? 0;
        $current_password = $data['current_password'] ?? '';
        $new_password = $data['new_password'] ?? '';
        
        if (!$user_id || !$current_password || !$new_password) {
            echo json_encode(['success' => false, 'error' => 'All fields required']);
            break;
        }
        
        try {
            // Get current password hash
            $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch();
            
            if (!$user) {
                echo json_encode(['success' => false, 'error' => 'User not found']);
                break;
            }
            
            // Verify current password
            if (!password_verify($current_password, $user['password_hash'])) {
                echo json_encode(['success' => false, 'error' => 'Current password is incorrect']);
                break;
            }
            
            // Update to new password
            $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $stmt->execute([$new_password_hash, $user_id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Password changed successfully!'
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Database error']);
        }
        break;
        
    case 'add_phone':
        $user_id = $data['user_id'] ?? 0;
        $phone = $data['phone'] ?? '';
        
        if (!$user_id || !$phone || !preg_match('/^0\d{9}$/', $phone)) {
            echo json_encode(['success' => false, 'error' => 'Valid user ID and phone required (05XXXXXXXX)']);
            break;
        }
        
        try {
            // Check if phone already exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
            $stmt->execute([$phone]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Phone number already registered']);
                break;
            }
            
            // Update user's phone
            $stmt = $pdo->prepare("UPDATE users SET phone = ?, phone_verified = 0 WHERE id = ?");
            $stmt->execute([$phone, $user_id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Phone number added. Verification required.'
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Database error']);
        }
        break;
        
    // EMAIL VERIFICATION SYSTEM - PROPER FLOW
        
    case 'add_email':
        $user_id = $data['user_id'] ?? 0;
        $email = $data['email'] ?? '';
        
        if (!$user_id || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'error' => 'Valid user ID and email required']);
            break;
        }
        
        try {
            // Check if email already exists for another user
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([$email, $user_id]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Email already registered to another account']);
                break;
            }
            
            // Check if user already has this email verified
            $stmt = $pdo->prepare("SELECT email, email_verified FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch();
            
            if ($user && $user['email'] === $email && $user['email_verified']) {
                echo json_encode(['success' => false, 'error' => 'Email already verified for this account']);
                break;
            }
            
            // Generate 6-digit verification code
            $verification_code = sprintf('%06d', rand(0, 999999));
            $expires_at = date('Y-m-d H:i:s', strtotime('+15 minutes'));
            
            // Delete any existing verification for this user/email
            $stmt = $pdo->prepare("DELETE FROM email_verifications WHERE user_id = ? OR email = ?");
            $stmt->execute([$user_id, $email]);
            
            // Insert new verification
            $stmt = $pdo->prepare("INSERT INTO email_verifications (user_id, email, verification_code, expires_at) VALUES (?, ?, ?, ?)");
            $stmt->execute([$user_id, $email, $verification_code, $expires_at]);
            
            // Send verification email to user
            $subject = "Email Verification Code - Skateboard Platform";
            $message = "
            <html>
            <body style='font-family: Arial; padding: 20px; background: #f5f5f5;'>
                <div style='max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
                    <h2 style='color: #6c5ce7; margin-bottom: 20px;'>Verify Your Email</h2>
                    <p style='color: #333; font-size: 16px;'>Use this verification code to add your email to your Skateboard Platform account:</p>
                    
                    <div style='background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;'>
                        <div style='font-size: 14px; color: #666; margin-bottom: 10px;'>Your verification code:</div>
                        <div style='font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #e74c3c; background: #fff; padding: 15px; border-radius: 8px; border: 2px dashed #ddd;'>
                            {$verification_code}
                        </div>
                    </div>
                    
                    <p style='color: #666; font-size: 14px;'>
                        <strong>Important:</strong> 
                        <ul style='color: #666; padding-left: 20px;'>
                            <li>This code will expire in 15 minutes</li>
                            <li>Do not share this code with anyone</li>
                            <li>If you didn't request this, please ignore this email</li>
                        </ul>
                    </p>
                    
                    <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;'>
                        <p>Skateboard Platform Team</p>
                        <p>Need help? Contact: pazzlestore@hotmail.com</p>
                    </div>
                </div>
            </body>
            </html>
            ";
            
            // Send email to USER (not admin)
            $email_result = sendEmailDirect($email, $subject, $message);
            
            echo json_encode([
                'success' => true,
                'message' => 'Verification code sent to your email',
                'email' => $email,
                'email_result' => $email_result
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
case 'verify_email_code':
    $user_id = $data['user_id'] ?? 0;
    $email = $data['email'] ?? '';
    $code = $data['code'] ?? '';
    
    if (!$user_id || !$email || !$code) {
        echo json_encode(['success' => false, 'error' => 'All fields required']);
        break;
    }
    
    try {
        // Check email_verifications table
        $stmt = $pdo->prepare("SELECT verification_code, expires_at FROM email_verifications WHERE user_id = ? AND email = ?");
        $stmt->execute([$user_id, $email]);
        $verification = $stmt->fetch();
        
        if (!$verification) {
            echo json_encode(['success' => false, 'error' => 'No verification found. Request a new code.']);
            break;
        }
        
        // Check if code matches
        if ($verification['verification_code'] !== $code) {
            echo json_encode(['success' => false, 'error' => 'Wrong code. Check your email.']);
            break;
        }
        
        // Check if expired
        if (strtotime($verification['expires_at']) < time()) {
            echo json_encode(['success' => false, 'error' => 'Code expired. Request new one.']);
            break;
        }
        
        // **UPDATE USERS TABLE - Add email to same row as phone**
        $stmt = $pdo->prepare("UPDATE users SET email = ?, email_verified = 1 WHERE id = ?");
        $stmt->execute([$email, $user_id]);
        
        // Delete used verification
        $stmt = $pdo->prepare("DELETE FROM email_verifications WHERE user_id = ?");
        $stmt->execute([$user_id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Email verified! Added to your account.',
            'email' => $email,
            'user_id' => $user_id
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
    break;

case 'update_user_email':
    $user_id = $_POST['user_id'];
    $email = $_POST['email'];
    $code = $_POST['code'];
    
    // Accept any 6-digit code for testing
    if (strlen($code) == 6 && is_numeric($code)) {
        try {
            // UPDATE THE EXISTING USER ROW IN USERS TABLE
            // This adds email to the same row where phone number exists
            $stmt = $pdo->prepare("UPDATE users SET email = ? WHERE id = ?");
            $stmt->execute([$email, $user_id]);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Email added to your user account',
                'user_id' => $user_id,
                'email' => $email
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid code. Try 123456']);
    }
    break;
    case 'add_email':
    $user_id = $data['user_id'] ?? 0;
    $email = $data['email'] ?? '';
    
    if (!$user_id || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'error' => 'Valid user ID and email required']);
        break;
    }
    
    try {
        // Generate RANDOM 6-digit code
        $verification_code = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $expires_at = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        
        // Delete old verifications for this user
        $stmt = $pdo->prepare("DELETE FROM email_verifications WHERE user_id = ?");
        $stmt->execute([$user_id]);
        
        // Store in email_verifications table
        $stmt = $pdo->prepare("INSERT INTO email_verifications (user_id, email, verification_code, expires_at) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user_id, $email, $verification_code, $expires_at]);
        
        // Send email with REAL code
        $subject = "Skateboard Platform - Verification Code: $verification_code";
        $message = "Your verification code is: <strong>$verification_code</strong>";
        
        $email_sent = sendEmailDirect($email, $subject, $message);
        
        echo json_encode([
            'success' => true,
            'message' => 'Verification code sent to your email',
            'email' => $email
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
    break;
    case 'update_first_name':
    $user_id = $data['user_id'] ?? 0;
    $first_name = $data['first_name'] ?? '';
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET first_name = ? WHERE id = ?");
        $stmt->execute([$first_name, $user_id]);
        echo json_encode(['success' => true, 'message' => 'Name updated!']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
    break;
}

?>