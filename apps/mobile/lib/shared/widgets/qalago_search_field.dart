import 'package:flutter/material.dart';

import '../../core/theme/theme_extensions.dart';

/// QalaGo search field — shared look for home (read-only), categories, search, promotions.
class QalagoSearchField extends StatelessWidget {
  const QalagoSearchField({
    super.key,
    this.controller,
    this.hintText = 'Поиск...',
    this.readOnly = false,
    this.onTap,
    this.onChanged,
    this.onSubmitted,
    this.textInputAction,
    this.suffixIcon,
    this.autofocus = false,
  });

  final TextEditingController? controller;
  final String hintText;
  final bool readOnly;
  final VoidCallback? onTap;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final TextInputAction? textInputAction;
  final Widget? suffixIcon;
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    final field = TextField(
      controller: controller,
      readOnly: readOnly,
      autofocus: autofocus,
      textInputAction: textInputAction,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      decoration: context.qalagoSearchDecoration(
        hintText: hintText,
        suffixIcon: suffixIcon,
      ),
    );

    if (readOnly && onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: AbsorbPointer(child: field),
      );
    }
    return field;
  }
}
