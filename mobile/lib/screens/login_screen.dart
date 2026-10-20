import 'package:flutter/material.dart';

import '../navigation/app_routes.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';
import '../widgets/auth_divider.dart';
import '../widgets/auth_text_field.dart';
import '../widgets/brand_mark.dart';
import '../widgets/google_button.dart';
import '../widgets/primary_button.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _loading) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final session = await AuthService.instance.login(
        email: _email.text,
        password: _password.text,
      );
      if (!mounted) return;
      goToHome(context, userName: session.user.name);
    } on ApiException catch (err) {
      if (!mounted) return;
      setState(() => _error = err.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Unable to sign in. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _googleUnavailable() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Google sign-in is not wired on mobile yet. Use email and password.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.background, AppColors.backgroundDeep],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const BrandMark(size: 34),
                    const SizedBox(height: 36),
                    const Text(
                      'WELCOME BACK',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.6,
                        color: AppColors.accent,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Sign in to OralScan',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Enter your email and password to continue screening.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 28),
                    Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: AppColors.line),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 28,
                            offset: const Offset(0, 12),
                          ),
                        ],
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            if (_error != null) ...[
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.errorSoft,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: AppColors.error.withValues(alpha: 0.25),
                                  ),
                                ),
                                child: Text(
                                  _error!,
                                  style: const TextStyle(
                                    color: AppColors.error,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    height: 1.35,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],
                            AuthTextField(
                              label: 'Email address',
                              controller: _email,
                              hint: 'you@example.com',
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              autofillHints: const [AutofillHints.email],
                              validator: (value) {
                                final v = value?.trim() ?? '';
                                if (v.isEmpty || !v.contains('@')) {
                                  return 'Enter a valid email';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            AuthTextField(
                              label: 'Password',
                              controller: _password,
                              obscureText: _obscure,
                              textInputAction: TextInputAction.done,
                              autofillHints: const [AutofillHints.password],
                              onToggleObscure: () =>
                                  setState(() => _obscure = !_obscure),
                              validator: (value) {
                                if ((value ?? '').isEmpty) {
                                  return 'Enter your password';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 24),
                            PrimaryButton(
                              label: _loading ? 'Please wait…' : 'Sign in',
                              loading: _loading,
                              onPressed: _loading ? null : _submit,
                            ),
                            const SizedBox(height: 20),
                            const AuthDivider(),
                            const SizedBox(height: 20),
                            GoogleButton(
                              label: 'Sign in with Google',
                              onPressed: _loading ? null : _googleUnavailable,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Center(
                      child: Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            'New to OralScan? ',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          GestureDetector(
                            onTap: _loading
                                ? null
                                : () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute<void>(
                                        builder: (_) => const RegisterScreen(),
                                      ),
                                    );
                                  },
                            child: const Text(
                              'Create an account',
                              style: TextStyle(
                                color: AppColors.ink,
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
