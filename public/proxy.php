<?php
// Proxy simples para contornar CORS em hospedagem compartilhada (cPanel/Apache)
// Salve este arquivo na pasta public/ ou raiz do site como proxy.php

// Cabeçalhos CORS permitindo acesso do seu domínio
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Se for uma requisição OPTIONS (preflight), encerra aqui com sucesso
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// URL da API de destino
$apiUrl = 'https://7capi.vercel.app/api/search';

// Captura o corpo da requisição original
$inputData = file_get_contents('php://input');

// Inicializa o cURL
$ch = curl_init($apiUrl);

// Configurações do cURL
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $inputData);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Em produção, ideal ser true, mas false evita erros de certificado em hosts antigos

// Repassa os cabeçalhos importantes
$headers = [
    'Content-Type: application/json',
    'Accept: application/json'
];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Executa a requisição
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Verifica erros do cURL
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro no proxy: ' . curl_error($ch)]);
} else {
    // Retorna o código HTTP e a resposta da API original
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo $response;
}

curl_close($ch);
?>