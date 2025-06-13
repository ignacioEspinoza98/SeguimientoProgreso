<?php
// Cargar variables de entorno
define('ENV_FILE', __DIR__ . '/.env');

if (file_exists(ENV_FILE)) {
    $lines = file(ENV_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!array_key_exists($name, $_ENV)) {
            putenv("$name=$value");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Configuración de Firebase
define('FIREBASE_CONFIG', [
    'apiKey' => getenv('FIREBASE_API_KEY'),
    'authDomain' => getenv('FIREBASE_AUTH_DOMAIN'),
    'projectId' => getenv('FIREBASE_PROJECT_ID'),
    'storageBucket' => getenv('FIREBASE_STORAGE_BUCKET'),
    'messagingSenderId' => getenv('FIREBASE_MESSAGING_SENDER_ID'),
    'appId' => getenv('FIREBASE_APP_ID')
]);

// Dominios permitidos
$allowedOrigins = array_map('trim', explode(',', getenv('ALLOWED_ORIGINS')));
define('ALLOWED_ORIGINS', $allowedOrigins);
