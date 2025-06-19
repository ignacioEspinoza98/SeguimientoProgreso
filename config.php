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
define('FIREBASE_API_KEY', getenv('FIREBASE_API_KEY'));
define('FIREBASE_AUTH_DOMAIN', getenv('FIREBASE_AUTH_DOMAIN'));
define('FIREBASE_DATABASE_URL', getenv('FIREBASE_DATABASE_URL'));
define('FIREBASE_PROJECT_ID', getenv('FIREBASE_PROJECT_ID'));
define('FIREBASE_STORAGE_BUCKET', getenv('FIREBASE_STORAGE_BUCKET'));
define('FIREBASE_MESSAGING_SENDER_ID', getenv('FIREBASE_MESSAGING_SENDER_ID'));
define('FIREBASE_APP_ID', getenv('FIREBASE_APP_ID'));
define('FIREBASE_MEASUREMENT_ID', getenv('FIREBASE_MEASUREMENT_ID'));

// Dominios permitidos
$allowedOrigins = explode(',', getenv('ALLOWED_ORIGINS'));
define('ALLOWED_ORIGINS', $allowedOrigins);
