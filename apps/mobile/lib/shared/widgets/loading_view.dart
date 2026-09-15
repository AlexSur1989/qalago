import 'package:flutter/material.dart';

import 'qalago_loading.dart';

/// Full-area loading placeholder — prefer [QalaGoLoadingIndicator] for inline use.
class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.semanticsLabel});

  final String? semanticsLabel;

  @override
  Widget build(BuildContext context) {
    return QalaGoLoadingIndicator(semanticsLabel: semanticsLabel);
  }
}
