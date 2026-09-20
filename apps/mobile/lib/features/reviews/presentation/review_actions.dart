import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/locale/l10n_extension.dart';
import '../../../shared/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/review_error_utils.dart';

Future<void> editConsumerReview(
  BuildContext context,
  WidgetRef ref,
  ReviewModel review, {
  VoidCallback? onSuccess,
}) async {
  final l10n = context.l10n;
  var rating = review.rating;
  final textController = TextEditingController(text: review.text ?? '');
  final saved = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(l10n.reviewEditTitle),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<int>(
              initialValue: rating,
              decoration: InputDecoration(labelText: l10n.reviewRatingLabel),
              items: List.generate(
                5,
                (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1}')),
              ),
              onChanged: (v) {
                if (v != null) rating = v;
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: textController,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: l10n.reviewYourReviewLabel,
                hintText: l10n.reviewTextOptionalHint,
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
          child: Text(l10n.reviewSubmit),
        ),
      ],
    ),
  );
  if (saved != true || !context.mounted) {
    textController.dispose();
    return;
  }
  try {
    await ref.read(catalogRepositoryProvider).updateReview(
          reviewId: review.id,
          rating: rating,
          text: textController.text.trim(),
        );
    ref.invalidate(myReviewsProvider);
    onSuccess?.call();
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(mapReviewMutationError(l10n, e))),
      );
    }
  }
  textController.dispose();
}

Future<void> deleteConsumerReview(
  BuildContext context,
  WidgetRef ref,
  ReviewModel review, {
  VoidCallback? onSuccess,
}) async {
  final l10n = context.l10n;
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(l10n.reviewDeleteTitle),
      content: Text(l10n.reviewDeleteBody),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text(l10n.commonCancel),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(l10n.reviewDelete),
        ),
      ],
    ),
  );
  if (confirmed != true || !context.mounted) return;
  try {
    await ref.read(catalogRepositoryProvider).deleteReview(review.id);
    ref.invalidate(myReviewsProvider);
    onSuccess?.call();
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(mapReviewMutationError(l10n, e))),
      );
    }
  }
}

Future<void> reportConsumerReview(
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
      title: Text(l10n.reviewReport),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              initialValue: reason,
              decoration: InputDecoration(labelText: l10n.reviewReportReason),
              items: [
                DropdownMenuItem(value: 'SPAM', child: Text(l10n.reviewReportReasonSpam)),
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
                DropdownMenuItem(value: 'OTHER', child: Text(l10n.reviewReportReasonOther)),
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
          child: Text(l10n.reviewReportSubmit),
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
        SnackBar(content: Text(l10n.reviewReportSent)),
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
