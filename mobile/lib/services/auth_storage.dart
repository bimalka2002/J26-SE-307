import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/user.dart';

class AuthStorage {
  static const _tokenKey = 'oralscan.auth.token';
  static const _userKey = 'oralscan.auth.user';

  Future<void> saveSession(AuthSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, session.token);
    await prefs.setString(_userKey, jsonEncode(session.user.toJson()));
  }

  Future<String?> readToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<User?> readUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      final json = jsonDecode(raw);
      if (json is! Map) return null;
      return User.fromJson(Map<String, dynamic>.from(json));
    } catch (_) {
      return null;
    }
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }
}
