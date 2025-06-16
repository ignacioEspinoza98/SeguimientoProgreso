<?php
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/config.php';
    
    if (!defined('FIREBASE_API_KEY')) {
        throw new Exception('Configuración de Firebase no definida');
    }
    
    echo json_encode([
        'apiKey' => FIREBASE_API_KEY,
        'authDomain' => FIREBASE_AUTH_DOMAIN,
        'databaseURL' => FIREBASE_DATABASE_URL,
        'projectId' => FIREBASE_PROJECT_ID,
        'storageBucket' => FIREBASE_STORAGE_BUCKET,
        'messagingSenderId' => FIREBASE_MESSAGING_SENDER_ID,
        'appId' => FIREBASE_APP_ID,
        'measurementId' => FIREBASE_MEASUREMENT_ID
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
