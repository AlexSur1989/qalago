import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/constants/legal_constants.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_theme.dart';
import '../data/legal_repository.dart';
import '../legal_contextual_errors.dart';
import '../providers/legal_provider.dart';

/// Context values: PLAN_PURCHASE | AD_PURCHASE | BUSINESS_APPLICATION
class ContextualLegalSection extends ConsumerStatefulWidget {
  const ContextualLegalSection({super.key, required this.contextKey});

  final String contextKey;

  @override
  ConsumerState<ContextualLegalSection> createState() =>
      ContextualLegalSectionState();
}

class ContextualLegalSectionState extends ConsumerState<ContextualLegalSection> {
  bool _loading = true;
  bool _hasPending = false;
  bool _checked = false;
  List<LegalPendingDocument> _pending = const [];
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => refresh());
  }

  Future<void> refresh() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final locale = ref.read(appLocaleCodeProvider);
      final state = await ref
          .read(legalRepositoryProvider)
          .fetchRequired(context: widget.contextKey, localeCode: locale);
      final pending = state.acceptanceRequired && state.pending.isNotEmpty;
      if (mounted) {
        setState(() {
          _hasPending = pending;
          _pending = state.pending;
          _checked = false;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _hasPending = false;
          _error = mapContextualLegalError(context.l10n, e);
        });
      }
    }
  }

  Future<bool> ensureAccepted() async {
    if (!_hasPending) return true;
    if (!_checked) {
      setState(() {
        _error = context.l10n.contextualLegalConfirmRequired;
      });
      return false;
    }
    try {
      final locale = ref.read(appLocaleCodeProvider);
      await ref.read(legalRepositoryProvider).acceptContextual(
            context: widget.contextKey,
            localeCode: locale,
            pending: _pending,
          );
      if (mounted) {
        setState(() {
          _hasPending = false;
          _pending = const [];
          _checked = false;
          _error = null;
        });
      }
      return true;
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = mapContextualLegalError(context.l10n, e);
        });
        await refresh();
      }
      return false;
    }
  }

  String _checkboxLabel(AppLocalizations l10n) {
    switch (widget.contextKey) {
      case 'PLAN_PURCHASE':
        return l10n.contextualLegalPlanCheckbox;
      case 'AD_PURCHASE':
        return l10n.contextualLegalAdCheckbox;
      default:
        return l10n.contextualLegalBusinessTermsCheckbox;
    }
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || (!_hasPending && _error == null)) {
      return const SizedBox.shrink();
    }
    if (!_hasPending && _error != null) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(_error!, style: TextStyle(color: AppTheme.error)),
      );
    }

    final l10n = context.l10n;
    final offer = LegalConstants.publicOfferUrl;
    final adRules = LegalConstants.advertisingRulesUrl;
    final businessTerms = LegalConstants.businessTermsUrl;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(_error!, style: TextStyle(color: AppTheme.error)),
          ),
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          controlAffinity: ListTileControlAffinity.leading,
          value: _checked,
          onChanged: (v) => setState(() => _checked = v ?? false),
          title: Text(_checkboxLabel(l10n)),
        ),
        Wrap(
          spacing: 8,
          children: [
            if (widget.contextKey == 'PLAN_PURCHASE' ||
                widget.contextKey == 'AD_PURCHASE')
              TextButton(
                onPressed: () => _openUrl(offer),
                child: Text(l10n.contextualLegalLinkOffer),
              ),
            if (widget.contextKey == 'AD_PURCHASE')
              TextButton(
                onPressed: () => _openUrl(adRules),
                child: Text(l10n.contextualLegalLinkAdvertisingRules),
              ),
            if (widget.contextKey == 'BUSINESS_APPLICATION')
              TextButton(
                onPressed: () => _openUrl(businessTerms),
                child: Text(l10n.contextualLegalLinkBusinessTerms),
              ),
          ],
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}
