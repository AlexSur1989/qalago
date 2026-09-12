class ProfileEditStrings {
  const ProfileEditStrings._();

  static const changePhoto = _L10nPair(ru: 'Изменить фото', kk: 'Фото өзгерту');
  static const takePhoto = _L10nPair(ru: 'С камеры', kk: 'Камерадан');
  static const fromGallery = _L10nPair(ru: 'Из галереи', kk: 'Галереядан');
  static const removePhoto = _L10nPair(ru: 'Удалить фото', kk: 'Фото жою');
  static const avatarUpdated = _L10nPair(ru: 'Фото обновлено', kk: 'Фото жаңартылды');
  static const avatarRemoved = _L10nPair(ru: 'Фото удалено', kk: 'Фото жойылды');
  static const avatarUploadError = _L10nPair(
    ru: 'Не удалось загрузить фото',
    kk: 'Фото жүктеу сәтсіз аяқталды',
  );

  static String label(_L10nPair pair, {String localeCode = 'ru'}) =>
      pair.forLocale(localeCode);
}

class _L10nPair {
  const _L10nPair({required this.ru, required this.kk});

  final String ru;
  final String kk;

  String forLocale(String localeCode) {
    if (localeCode.startsWith('kk')) return kk;
    return ru;
  }
}
