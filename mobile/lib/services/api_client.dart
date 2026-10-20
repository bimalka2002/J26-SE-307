import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({http.Client? httpClient, String? baseUrl})
      : _http = httpClient ?? http.Client(),
        _baseUrl = (baseUrl ?? resolveApiBaseUrl()).replaceAll(RegExp(r'/+$'), '');

  final http.Client _http;
  final String _baseUrl;

  Future<Map<String, dynamic>> get(
    String path, {
    String? token,
    Duration timeout = const Duration(seconds: 15),
  }) {
    return _send(
      method: 'GET',
      path: path,
      token: token,
      timeout: timeout,
    );
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Object? body,
    String? token,
    Duration timeout = const Duration(seconds: 15),
  }) {
    return _send(
      method: 'POST',
      path: path,
      body: body,
      token: token,
      timeout: timeout,
    );
  }

  Future<Map<String, dynamic>> _send({
    required String method,
    required String path,
    Object? body,
    String? token,
    required Duration timeout,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final headers = <String, String>{
      if (body != null) 'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };

    try {
      final request = http.Request(method, uri)
        ..headers.addAll(headers)
        ..body = body == null ? '' : jsonEncode(body);

      final streamed = await _http.send(request).timeout(timeout);
      final response = await http.Response.fromStream(streamed);
      final decoded = _decode(response.body);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final message = decoded['message']?.toString().trim();
        throw ApiException(
          (message == null || message.isEmpty)
              ? 'Something went wrong. Please try again.'
              : message,
          statusCode: response.statusCode,
        );
      }

      return decoded;
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw const ApiException('Request timed out. Check your connection and try again.');
    } on FormatException {
      throw const ApiException('Received an unexpected response from OralScan.');
    } catch (_) {
      throw const ApiException(
        'Unable to reach OralScan. Check your connection and try again.',
      );
    }
  }

  Map<String, dynamic> _decode(String body) {
    if (body.trim().isEmpty) return <String, dynamic>{};
    final value = jsonDecode(body);
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    return <String, dynamic>{};
  }
}
