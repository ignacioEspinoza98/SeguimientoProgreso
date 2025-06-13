<?php
require_once __DIR__ . '/config.php';

// Validar origen de la petición
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ALLOWED_ORIGINS;

// Configurar cabeceras CORS
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
}

// Manejar solicitudes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Validar método de la petición
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Validar origen
if (!in_array($origin, $allowedOrigins)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Origen no autorizado']);
    exit;
}

// Obtener la configuración de Firebase
$firebaseConfig = FIREBASE_CONFIG;

// Devolver solo la configuración necesaria para el cliente
$response = [
    'apiKey' => $firebaseConfig['apiKey'],
    'authDomain' => $firebaseConfig['authDomain'],
    'projectId' => $firebaseConfig['projectId'],
    'storageBucket' => $firebaseConfig['storageBucket'],
    'messagingSenderId' => $firebaseConfig['messagingSenderId'],
    'appId' => $firebaseConfig['appId']
];

// Enviar respuesta
header('Content-Type: application/json');
echo json_encode($response);
