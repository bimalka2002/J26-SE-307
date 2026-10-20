import '../models/user.dart';
import 'api_client.dart';
import 'auth_storage.dart';
import 'google_auth_service.dart';

class AuthService {
  AuthService({
    ApiClient? apiClient,
    AuthStorage? storage,
  })  : _api = apiClient ?? ApiClient(),
        _storage = storage ?? AuthStorage();

  static final AuthService instance = AuthService();

  final ApiClient _api;
  final AuthStorage _storage;

  User? currentUser;
  String? _token;

  String? get token => _token;
  bool get isSignedIn => _token != null && _token!.isNotEmpty && currentUser != null;

  Future<void> restoreSession() async {
    final token = await _storage.readToken();
    if (token == null || token.isEmpty) {
      await logout();
      return;
    }

    try {
      final data = await _api.get('/auth/me', token: token);
      final userJson = data['user'];
      if (userJson is! Map) {
        throw const ApiException('Session expired. Please sign in again.');
      }
      final user = User.fromJson(Map<String, dynamic>.from(userJson));
      _token = token;
      currentUser = user;
      await _storage.saveSession(AuthSession(token: token, user: user));
    } catch (_) {
      await logout();
    }
  }

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final data = await _api.post(
      '/auth/login',
      body: {
        'email': email.trim(),
        'password': password,
      },
    );
    return _persist(data);
  }

  Future<AuthSession> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final data = await _api.post(
      '/auth/register',
      body: {
        'name': name.trim(),
        'email': email.trim(),
        'password': password,
      },
    );
    return _persist(data);
  }

  Future<void> logout() async {
    _token = null;
    currentUser = null;
    await _storage.clear();
    await GoogleAuthService.instance.signOut();
  }

  Future<AuthSession> googleLogin(String credential) async {
    final data = await _api.post('/auth/google', body: {'credential': credential});
    return _persist(data);
  }

  Future<AuthSession> _persist(Map<String, dynamic> data) async {
    final session = AuthSession.fromJson(data);
    _token = session.token;
    currentUser = session.user;
    await _storage.saveSession(session);
    return session;
  }
}
