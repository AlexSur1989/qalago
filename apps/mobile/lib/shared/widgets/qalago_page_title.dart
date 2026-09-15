import 'package:flutter/material.dart';

import '../../core/theme/theme_extensions.dart';

/// Large screen title — [QalaGoTypography.pageTitle], wraps with large text.
class QalaGoPageTitle extends StatelessWidget {
  const QalaGoPageTitle({
    super.key,
    required this.text,
    this.textAlign = TextAlign.start,
  });

  final String text;
  final TextAlign textAlign;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      child: Text(
        text,
        textAlign: textAlign,
        style: context.pageTitleStyle,
      ),
    );
  }
}
