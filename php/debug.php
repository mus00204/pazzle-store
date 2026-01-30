<?php
// Test if Brevo is working
$api_key = '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';

$data = [
    'sender' => [
        'name' => 'Skateboard Test',
        'email' => 'pazzlestore@hotmail.com'  // Use your verified email
    ],
    'to' => [[
        'email' => 'pazzlestore@hotmail.com',
        'name' => 'Test'
    ]],
    'subject' => 'TEST EMAIL from Brevo',
    'htmlContent' => '<h1>Test Email</h1><p>If you see this, Brevo is working!</p>'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.brevo.com/v3/smtp/email');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
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

echo "<h2>Brevo Test Result</h2>";
echo "HTTP Code: $http_code<br>";
echo "Response: " . htmlspecialchars($response) . "<br>";

if ($http_code >= 200 && $http_code < 300) {
    echo "<p style='color: green; font-weight: bold;'>✅ Brevo API is working! Check your email.</p>";
} else {
    echo "<p style='color: red; font-weight: bold;'>❌ Brevo API failed. Check API key.</p>";
}
?>