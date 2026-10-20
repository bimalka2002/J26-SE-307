import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../config/api_config.dart';
import '../models/analysis.dart';
import 'api_client.dart';
import 'auth_service.dart';

class AnalysisUpload {
  const AnalysisUpload({required this.bytes, required this.filename, required this.mimeType});

  final Uint8List bytes;
  final String filename;
  final String mimeType;
}

class AnalysisService {
  AnalysisService({ApiClient? apiClient, http.Client? httpClient, String? baseUrl})
      : _api = apiClient ?? ApiClient(),
        _http = httpClient ?? http.Client(),
        _baseUrl = (baseUrl ?? resolveApiBaseUrl()).replaceAll(RegExp(r'/+$'), '');

  final ApiClient _api;
  final http.Client _http;
  final String _baseUrl;

  String get _token {
    final token = AuthService.instance.token;
    if (token == null || token.isEmpty) {
      throw const ApiException('Your session has expired. Please sign in again.', statusCode: 401);
    }
    return token;
  }

  Future<String> create({
    AnalysisUpload? oralPhoto,
    AnalysisUpload? xray,
    Map<String, dynamic> clinicalData = const {},
  }) async {
    if (oralPhoto == null && xray == null) {
      throw const ApiException('Add an oral photo or X-ray to start.');
    }
    final request = http.MultipartRequest('POST', Uri.parse('$_baseUrl/analyses'))
      ..headers['Authorization'] = 'Bearer $_token'
      ..fields['clinicalData'] = jsonEncode(clinicalData);

    void addImage(String field, AnalysisUpload image) {
      request.files.add(http.MultipartFile.fromBytes(
        field,
        image.bytes,
        filename: image.filename,
        contentType: MediaType.parse(image.mimeType),
      ));
    }

    if (oralPhoto != null) addImage('oral_photo', oralPhoto);
    if (xray != null) addImage('xray', xray);

    try {
      final streamed = await _http.send(request).timeout(const Duration(seconds: 60));
      final response = await http.Response.fromStream(streamed);
      final data = jsonDecode(response.body);
      if (data is! Map) throw const FormatException('Invalid analysis response');
      final result = Map<String, dynamic>.from(data);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(result['message']?.toString() ?? 'Unable to start screening.', statusCode: response.statusCode);
      }
      final id = result['analysisId']?.toString();
      if (id == null || id.isEmpty) throw const FormatException('Missing analysis ID');
      return id;
    } on ApiException {
      rethrow;
    } on FormatException {
      throw const ApiException('Received an unexpected response from OralScan.');
    } catch (_) {
      throw const ApiException('Unable to reach OralScan. Check your connection and try again.');
    }
  }

  Future<Analysis> get(String id) async {
    final data = await _api.get('/analyses/${Uri.encodeComponent(id)}', token: _token);
    final raw = data['analysis'];
    if (raw is! Map) throw const ApiException('Received an unexpected screening result.');
    return Analysis.fromJson(Map<String, dynamic>.from(raw));
  }

  Future<List<Analysis>> list() async {
    final data = await _api.get('/analyses', token: _token);
    final raw = data['analyses'];
    if (raw is! List) throw const ApiException('Received an unexpected screening history.');
    return raw.whereType<Map>().map((item) => Analysis.fromJson(Map<String, dynamic>.from(item))).toList();
  }
}
