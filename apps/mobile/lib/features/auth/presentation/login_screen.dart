import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/utils/auth_utils.dart';
import '../data/social_auth_platform.dart';
import 'dev_quick_login_panel.dart';
import '../providers/auth_provider.dart';
import '../../../shared/widgets/legal_links.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  final _codeFocusNode = FocusNode();
  bool _codeSent = false;
  bool _otpExpanded = false;
  String? _normalizedPhone;
  int _resendCooldownSec = 0;
  Timer? _resendTimer;

  static const _resendCooldownTotal = 60;

  bool get _showGoogle =>
      AppConstants.googleAuthEnabled && isGoogleSignInPlatformSupported();

  bool get _showApple =>
      AppConstants.appleAuthEnabled && isAppleSignInPlatformSupported();

  bool get _showOtp =>
      AppConstants.otpAuthEnabled || AppConstants.devLoginEnabled;

  bool get _showSocial => _showGoogle || _showApple;

  bool get _anyLoginMethod => _showSocial || _showOtp;

  @override
  void initState() {
    super.initState();
    _otpExpanded = !_showSocial && _showOtp;
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    _phoneController.dispose();
    _codeController.dispose();
    _codeFocusNode.dispose();
    super.dispose();
  }

  void _startResendCooldown() {
    _resendTimer?.cancel();
    setState(() => _resendCooldownSec = _resendCooldownTotal);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendCooldownSec <= 1) {
        timer.cancel();
        setState(() => _resendCooldownSec = 0);
      } else {
        setState(() => _resendCooldownSec -= 1);
      }
    });
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _sendCode({bool isResend = false}) async {
    final normalized = normalizeKazakhstanPhone(_phoneController.text);
    if (normalized == null) {
      _showError('Проверьте номер телефона');
      return;
    }

    try {
      await ref.read(authProvider.notifier).sendCode(normalized);
      setState(() {
        _codeSent = true;
        _normalizedPhone = normalized;
        _codeController.clear();
      });
      _startResendCooldown();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isResend
                  ? 'Код отправлен повторно'
                  : 'Код отправлен на ${formatKazakhstanPhone(normalized)}',
            ),
          ),
        );
        FocusScope.of(context).requestFocus(_codeFocusNode);
      }
    } catch (e) {
      _showError(mapAuthError(e));
    }
  }

  Future<void> _verify() async {
    final phone = _normalizedPhone ??
        normalizeKazakhstanPhone(_phoneController.text);
    if (phone == null) {
      _showError('Проверьте номер телефона');
      return;
    }

    final code = _codeController.text.trim();
    if (!isValidOtpCode(code)) {
      _showError('Введите код из SMS');
      return;
    }

    try {
      await ref.read(authProvider.notifier).verifyCode(
            phone,
            code,
            accountType: 'user',
          );
    } catch (e) {
      _showError(mapAuthError(e));
    }
  }

  Future<void> _devLogin() async {
    final normalized = normalizeKazakhstanPhone(_phoneController.text);
    if (normalized == null) {
      _showError('Проверьте номер телефона');
      return;
    }

    try {
      await ref.read(authProvider.notifier).devLogin(normalized);
    } catch (e) {
      _showError(mapAuthError(e));
    }
  }

  void _changePhone() {
    setState(() {
      _codeSent = false;
      _codeController.clear();
    });
  }

  void _continueAsGuest() {
    context.go('/home');
  }

  Future<void> _signInWithGoogle() async {
    try {
      await ref.read(authProvider.notifier).signInWithGoogle();
    } catch (e) {
      final message = mapSocialAuthError(e, providerLabel: 'Google');
      if (message.isNotEmpty) _showError(message);
    }
  }

  Future<void> _signInWithApple() async {
    try {
      await ref.read(authProvider.notifier).signInWithApple();
    } catch (e) {
      final message = mapSocialAuthError(e, providerLabel: 'Apple');
      if (message.isNotEmpty) _showError(message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final isBusy = auth.isLoading;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 52,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 34),
                    const Center(child: _QalaGoLogo(fontSize: 50)),
                    const SizedBox(height: 22),
                    const _CityArtwork(),
                    const SizedBox(height: 34),
                    const Text(
                      'Вход в QalaGo',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Войдите, чтобы сохранять избранное, оставлять отзывы и управлять профилем.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xFF7B8291),
                        fontSize: 16,
                        height: 1.35,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 28),
                    if (_showGoogle) ...[
                      _GoogleSignInButton(
                        onPressed: isBusy ? null : _signInWithGoogle,
                        loading: isBusy,
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (_showApple) ...[
                      SignInWithAppleButton(
                        onPressed: isBusy ? null : _signInWithApple,
                        height: 52,
                        borderRadius: BorderRadius.circular(18),
                        text: 'Продолжить с Apple',
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (_showSocial && _showOtp) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: Divider(
                                color: Colors.black.withValues(alpha: 0.08),
                              ),
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 12),
                              child: Text(
                                'или',
                                style: TextStyle(
                                  color: Color(0xFF7B8291),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            Expanded(
                              child: Divider(
                                color: Colors.black.withValues(alpha: 0.08),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (_showOtp) ...[
                      if (_showSocial && !_otpExpanded)
                        TextButton(
                          onPressed: isBusy
                              ? null
                              : () => setState(() => _otpExpanded = true),
                          child: const Text('Войти по телефону'),
                        ),
                      if (_otpExpanded || !_showSocial) ...[
                        TextField(
                          controller: _phoneController,
                          enabled: !isBusy && !_codeSent,
                          keyboardType: TextInputType.phone,
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(
                              RegExp(r'[\d+\s()-]'),
                            ),
                          ],
                          decoration: InputDecoration(
                            hintText: '+7 (777) 123-45-67',
                            prefixIcon: Padding(
                              padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  color: AppTheme.kzBlue.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Padding(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: 9,
                                    vertical: 4,
                                  ),
                                  child: Text(
                                    '+7',
                                    style: TextStyle(
                                      color: AppTheme.kzBlue,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(18),
                              borderSide: BorderSide(
                                color: Colors.black.withValues(alpha: 0.09),
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(18),
                              borderSide: const BorderSide(
                                color: AppTheme.kzBlue,
                                width: 1.5,
                              ),
                            ),
                          ),
                        ),
                        if (_codeSent) ...[
                          const SizedBox(height: 12),
                          TextField(
                            controller: _codeController,
                            focusNode: _codeFocusNode,
                            enabled: !isBusy,
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(6),
                            ],
                            decoration: const InputDecoration(
                              labelText: 'Код из SMS',
                              hintText: '••••',
                            ),
                            onSubmitted: (_) {
                              if (!isBusy) _verify();
                            },
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              TextButton(
                                onPressed: isBusy ? null : _changePhone,
                                child: const Text('Изменить номер'),
                              ),
                              const Spacer(),
                              TextButton(
                                onPressed: isBusy || _resendCooldownSec > 0
                                    ? null
                                    : () => _sendCode(isResend: true),
                                child: Text(
                                  _resendCooldownSec > 0
                                      ? 'Повтор через $_resendCooldownSec с'
                                      : 'Отправить снова',
                                ),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: isBusy
                              ? null
                              : (_codeSent ? _verify : () => _sendCode()),
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(58),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                            ),
                          ),
                          child: isBusy
                              ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(_codeSent ? 'Войти' : 'Получить код'),
                        ),
                        if (AppConstants.devLoginEnabled && !_codeSent) ...[
                          const SizedBox(height: 12),
                          OutlinedButton(
                            onPressed: isBusy ? null : _devLogin,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppTheme.kzBlue,
                              minimumSize: const Size.fromHeight(54),
                              side: BorderSide(
                                color: AppTheme.kzBlue.withValues(alpha: 0.35),
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                            ),
                            child: const Text('Войти без SMS (dev)'),
                          ),
                          const DevQuickLoginPanel(compact: true),
                        ],
                      ],
                    ],
                    if (!_anyLoginMethod) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF4E5),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFFFD9A8)),
                        ),
                        child: const Text(
                          'Вход через аккаунт временно недоступен в этой сборке. '
                          'Можно продолжить как гость.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Color(0xFF7B5B2E),
                            fontSize: 14,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                    const LoginLegalConsentFooter(),
                    const SizedBox(height: 20),
                    OutlinedButton.icon(
                      onPressed: isBusy ? null : _continueAsGuest,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.black,
                        minimumSize: const Size.fromHeight(58),
                        side: BorderSide(
                          color: Colors.black.withValues(alpha: 0.09),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      icon: const Icon(Icons.explore_outlined),
                      label: const Text('Продолжить без аккаунта'),
                    ),
                    if (kDebugMode) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Локальная разработка: OTP может приходить через backend debug.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.black.withValues(alpha: 0.45),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _GoogleSignInButton extends StatelessWidget {
  const _GoogleSignInButton({
    required this.onPressed,
    required this.loading,
  });

  final VoidCallback? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.black87,
        backgroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        side: BorderSide(color: Colors.black.withValues(alpha: 0.12)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
      child: loading
          ? const SizedBox(
              height: 22,
              width: 22,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: Colors.black12),
                  ),
                  alignment: Alignment.center,
                  child: const Text(
                    'G',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      color: AppTheme.kzBlue,
                      fontSize: 14,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Продолжить с Google',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                ),
              ],
            ),
    );
  }
}

class _QalaGoLogo extends StatelessWidget {
  const _QalaGoLogo({required this.fontSize});

  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w900,
          letterSpacing: 0,
        ),
        children: const [
          TextSpan(
            text: 'Qala',
            style: TextStyle(color: Colors.black),
          ),
          TextSpan(
            text: 'Go',
            style: TextStyle(color: AppTheme.kzBlue),
          ),
        ],
      ),
    );
  }
}

class _CityArtwork extends StatelessWidget {
  const _CityArtwork();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 230,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.kzBlue.withValues(alpha: 0.03),
                    AppTheme.kzBlue.withValues(alpha: 0.1),
                    Colors.white,
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
          Positioned(
            left: 8,
            right: 8,
            bottom: 24,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                _Building(width: 48, height: 84),
                _Building(width: 34, height: 112),
                _Tower(),
                _Building(width: 64, height: 124, roundedTop: true),
                _Building(width: 42, height: 96),
                _Wheel(),
              ],
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 20,
            child: Container(
              height: 34,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.white.withValues(alpha: 0), Colors.white],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Building extends StatelessWidget {
  const _Building({
    required this.width,
    required this.height,
    this.roundedTop = false,
  });

  final double width;
  final double height;
  final bool roundedTop;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppTheme.kzBlue.withValues(alpha: 0.16),
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(roundedTop ? 32 : 8),
        ),
        border: Border.all(color: AppTheme.kzBlue.withValues(alpha: 0.08)),
      ),
    );
  }
}

class _Tower extends StatelessWidget {
  const _Tower();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 62,
      height: 150,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Container(
            width: 18,
            height: 120,
            color: AppTheme.kzBlue.withValues(alpha: 0.18),
          ),
          Positioned(
            top: 0,
            child: Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: AppTheme.kzGold.withValues(alpha: 0.35),
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Wheel extends StatelessWidget {
  const _Wheel();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 58,
      height: 58,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: AppTheme.kzBlue.withValues(alpha: 0.18),
          width: 5,
        ),
      ),
    );
  }
}
