import 'package:flutter/material.dart';

import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';

class ConsumerReviewCard extends StatelessWidget {
  const ConsumerReviewCard({
    super.key,
    required this.review,
    required this.dateLabel,
    this.isOwnReview = false,
    this.onEdit,
    this.onDelete,
    this.onReport,
  });

  final ReviewModel review;
  final String dateLabel;
  final bool isOwnReview;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final VoidCallback? onReport;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final displayName = review.userName?.trim().isNotEmpty == true
        ? review.userName!
        : l10n.profileDefaultUser;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceSubtle,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ReviewerAvatar(name: displayName, avatarUrl: review.avatarUrl),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            displayName,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        Semantics(
                          label: l10n.reviewRatingLabel,
                          value: '${review.rating}',
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star, color: Colors.amber, size: 16),
                              const SizedBox(width: 4),
                              Text('${review.rating}'),
                            ],
                          ),
                        ),
                        if (onEdit != null || onDelete != null || onReport != null)
                          PopupMenuButton<String>(
                            tooltip: l10n.commonMore,
                            onSelected: (value) {
                              if (value == 'edit') onEdit?.call();
                              if (value == 'delete') onDelete?.call();
                              if (value == 'report') onReport?.call();
                            },
                            itemBuilder: (ctx) => [
                              if (onEdit != null)
                                PopupMenuItem(
                                  value: 'edit',
                                  child: Text(l10n.reviewEdit),
                                ),
                              if (onDelete != null)
                                PopupMenuItem(
                                  value: 'delete',
                                  child: Text(l10n.reviewDelete),
                                ),
                              if (onReport != null)
                                PopupMenuItem(
                                  value: 'report',
                                  child: Text(l10n.reviewReport),
                                ),
                            ],
                          ),
                      ],
                    ),
                    if (dateLabel.isNotEmpty)
                      Text(
                        dateLabel,
                        style: TextStyle(
                          color: AppTheme.textDark.withValues(alpha: 0.45),
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          if (review.text != null && review.text!.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(review.text!),
          ],
          if (review.ownerReply != null && review.ownerReply!.trim().isNotEmpty)
            _CompanyReplyBlock(text: review.ownerReply!),
          if (isOwnReview)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                l10n.reviewYourReview,
                style: TextStyle(
                  color: AppTheme.kzBlue.withValues(alpha: 0.85),
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _CompanyReplyBlock extends StatelessWidget {
  const _CompanyReplyBlock({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.kzBlue.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.kzBlue.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.reviewCompanyReply,
            style: TextStyle(
              color: AppTheme.kzBlue.withValues(alpha: 0.9),
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 4),
          Text(text),
        ],
      ),
    );
  }
}

class _ReviewerAvatar extends StatelessWidget {
  const _ReviewerAvatar({required this.name, this.avatarUrl});

  final String name;
  final String? avatarUrl;

  @override
  Widget build(BuildContext context) {
    final initial =
        name.isNotEmpty ? name.substring(0, 1).toUpperCase() : '?';
    if (avatarUrl != null && avatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 18,
        backgroundImage: NetworkImage(avatarUrl!),
      );
    }
    return CircleAvatar(
      radius: 18,
      backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.12),
      child: Text(
        initial,
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
    );
  }
}
