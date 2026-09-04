import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneController = TextEditingController(text: '+77000000003');
  final _codeController = TextEditingController();
  bool _codeSent = false;
  String? _debugCode;
  String _accountType = 'user';

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    try {
      final debug = await ref
          .read(authProvider.notifier)
          .sendCode(_phoneController.text.trim());
      setState(() {
        _codeSent = true;
        _debugCode = debug;
        if (debug != null) _codeController.text = debug;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              debug != null ? 'Код (dev): $debug' : 'Код отправлен',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Ошибка: $e')));
      }
    }
  }

  Future<void> _verify() async {
    try {
      await ref.read(authProvider.notifier).verifyCode(
            _phoneController.text.trim(),
            _codeController.text.trim(),
            accountType: _accountType,
          );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Неверный код или ошибка API: $e')),
        );
      }
    }
  }

  Future<void> _continueAsGuest() async {
    const demoPhone = '+77000000003';
    _phoneController.text = demoPhone;
    try {
      final debug = await ref.read(authProvider.notifier).sendCode(demoPhone);
      if (debug == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Гостевой вход доступен в dev-режиме'),
            ),
          );
        }
        return;
      }
      await ref.read(authProvider.notifier).verifyCode(
            demoPhone,
            debug,
            accountType: 'user',
          );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Ошибка гостевого входа: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

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
                      'Сохраняйте любимые места, получайте рекомендации и открывайте город по-новому.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xFF7B8291),
                        fontSize: 16,
                        height: 1.35,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 30),
                    const Text(
                      'Тип аккаунта',
                      style: TextStyle(
                        color: Color(0xFF5A6270),
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: _AccountTypeCard(
                            selected: _accountType == 'user',
                            icon: Icons.person_outline,
                            title: 'Пользователь',
                            subtitle: 'Каталог, карта, избранное',
                            onTap: () => setState(() {
                              _accountType = 'user';
                              if (_phoneController.text == '+77000000002') {
                                _phoneController.text = '+77000000003';
                              }
                            }),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _AccountTypeCard(
                            selected: _accountType == 'business',
                            icon: Icons.storefront_outlined,
                            title: 'Бизнес',
                            subtitle: 'Кабинет владельца заведения',
                            onTap: () => setState(() {
                              _accountType = 'business';
                              if (_phoneController.text == '+77000000003') {
                                _phoneController.text = '+77000000002';
                              }
                            }),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
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
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Код из SMS',
                          helperText: _debugCode != null
                              ? 'Dev OTP: $_debugCode'
                              : null,
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: auth.isLoading
                          ? null
                          : (_codeSent ? _verify : _sendCode),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(62),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      child: Text(_codeSent ? 'Войти' : 'Получить код'),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _debugCode != null
                          ? 'Код для demo уже подставлен'
                          : 'Для demo код подставится автоматически',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF8A919F),
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 20),
                    OutlinedButton.icon(
                      onPressed: auth.isLoading ? null : _continueAsGuest,
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
                      icon: const Icon(Icons.person_outline),
                      label: const Text('Продолжить как гость'),
                    ),
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

class _AccountTypeCard extends StatelessWidget {
  const _AccountTypeCard({
    required this.selected,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final bool selected;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: selected
                ? AppTheme.kzBlue.withValues(alpha: 0.08)
                : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected
                  ? AppTheme.kzBlue
                  : Colors.black.withValues(alpha: 0.09),
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                icon,
                color: selected ? AppTheme.kzBlue : const Color(0xFF7B8291),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: selected ? AppTheme.kzBlue : Colors.black,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(
                  color: Color(0xFF8A919F),
                  fontSize: 12,
                  height: 1.25,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
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
