import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/locale/l10n_extension.dart';
import '../../shared/models/models.dart';
import '../auth/providers/auth_provider.dart';
import '../reviews/data/review_error_utils.dart';

/// Owner/business member report — same POST /reports contract as consumer (Stage 6.11D.3).
Future<void> reportOwnerReview(
  BuildContext context,
  WidgetRef ref,
  ReviewModel review,
) async {
  final l10n = context.l10n;
  var reason = 'INAPPROPRIATE_CONTENT';
  final detailsController = TextEditingController();
  final submitted = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(l10n.ownerReviewReportAction),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              initialValue: reason,
              decoration: InputDecoration(labelText: l10n.reviewReportReason),
              items: [
                DropdownMenuItem(
                  value: 'SPAM',
                  child: Text(l10n.reviewReportReasonSpam),
                ),
                DropdownMenuItem(
                  value: 'INAPPROPRIATE_CONTENT',
                  child: Text(l10n.reviewReportReasonInappropriate),
                ),
                DropdownMenuItem(
                  value: 'FALSE_INFORMATION',
                  child: Text(l10n.reviewReportReasonFalseInfo),
                ),
                DropdownMenuItem(
                  value: 'HARASSMENT',
                  child: Text(l10n.reviewReportReasonHarassment),
                ),
                DropdownMenuItem(
                  value: 'OTHER',
                  child: Text(l10n.reviewReportReasonOther),
                ),
              ],
              onChanged: (v) {
                if (v != null) reason = v;
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: detailsController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: l10n.reviewReportDetailsOptional,
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text(l10n.commonCancel),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(l10n.ownerReviewReportSubmit),
        ),
      ],
    ),
  );
  if (submitted != true || !context.mounted) {
    detailsController.dispose();
    return;
  }
  try {
    await ref.read(contentReportRepositoryProvider).submitReviewReport(
          reviewId: review.id,
          reason: reason,
          details: detailsController.text.trim().isEmpty
              ? null
              : detailsController.text.trim(),
        );
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.ownerReviewReportSent)),
      );
    }
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(mapReviewReportError(l10n, e))),
      );
    }
  }
  detailsController.dispose();
}
