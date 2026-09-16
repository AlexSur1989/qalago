import 'package:flutter/material.dart';

import '../../core/locale/l10n_extension.dart';
import '../../core/theme/qalago_touch_targets.dart';
import '../../core/theme/theme_extensions.dart';
import 'qalago_icon_button.dart';

/// QalaGo search field — shared look for home (read-only), categories, search, promotions.
class QalagoSearchField extends StatelessWidget {
  const QalagoSearchField({
    super.key,
    this.controller,
    this.hintText,
    this.readOnly = false,
    this.onTap,
    this.onChanged,
    this.onSubmitted,
    this.textInputAction,
    this.suffixIcon,
    this.autofocus = false,
    this.onClear,
    this.clearSemanticsLabel,
    this.focusNode,
  });

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? hintText;
  final bool readOnly;
  final VoidCallback? onTap;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final TextInputAction? textInputAction;
  final Widget? suffixIcon;
  final bool autofocus;

  /// When set with a non-empty controller value, shows a clear control unless [suffixIcon] is provided.
  final VoidCallback? onClear;
  final String? clearSemanticsLabel;

  /// Accessible clear action for search fields (pass as [suffixIcon] or use [onClear]).
  static Widget clearButton({
    required BuildContext context,
    required VoidCallback onPressed,
    String? semanticsLabel,
  }) {
    return QalaGoIconButton(
      icon: Icons.close_rounded,
      semanticsLabel: semanticsLabel ?? context.l10n.commonReset,
      onPressed: onPressed,
      iconSize: 20,
    );
  }

  @override
  Widget build(BuildContext context) {
    final resolvedSuffix = suffixIcon ?? _buildClearSuffix(context);

    final field = TextField(
      controller: controller,
      focusNode: focusNode,
      readOnly: readOnly,
      autofocus: autofocus,
      textInputAction: textInputAction,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      minLines: 1,
      decoration: context.qalagoSearchDecoration(
        hintText: hintText ?? context.l10n.defaultSearchHint,
        suffixIcon: resolvedSuffix,
      ).copyWith(
        constraints: const BoxConstraints(
          minHeight: QalaGoTouchTargets.minInteractive,
        ),
      ),
    );

    if (readOnly && onTap != null) {
      return Semantics(
        button: true,
        label: hintText ?? context.l10n.defaultSearchHint,
        child: GestureDetector(
          onTap: onTap,
          child: AbsorbPointer(child: field),
        ),
      );
    }

    return field;
  }

  Widget? _buildClearSuffix(BuildContext context) {
    if (onClear == null || controller == null) return null;
    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: controller!,
      builder: (context, value, _) {
        if (value.text.isEmpty) return const SizedBox.shrink();
        return clearButton(
          context: context,
          onPressed: onClear!,
          semanticsLabel: clearSemanticsLabel,
        );
      },
    );
  }
}
