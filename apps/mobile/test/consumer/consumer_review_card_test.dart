import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/reviews/presentation/consumer_review_card.dart';
import 'package:qalago_mobile/shared/models/models.dart';

import '../support/l10n_test_harness.dart';

ReviewModel _sample({String? ownerReply}) => ReviewModel(
      id: 'r1',
      rating: 5,
      text: 'Great place',
      ownerReply: ownerReply,
      userName: 'Ali',
      createdAt: '2026-01-01T00:00:00.000Z',
    );

void main() {
  testWidgets('renders company reply label', (tester) async {
    await tester.pumpWidget(
      wrapWithL10n(
        ConsumerReviewCard(
          review: _sample(ownerReply: 'Thanks!'),
          dateLabel: '1 Jan 2026',
        ),
      ),
    );
    expect(find.text('Ответ компании'), findsOneWidget);
    expect(find.text('Thanks!'), findsOneWidget);
  });

  testWidgets('report action hidden when callbacks null', (tester) async {
    await tester.pumpWidget(
      wrapWithL10n(
        ConsumerReviewCard(
          review: _sample(),
          dateLabel: '1 Jan 2026',
        ),
      ),
    );
    expect(find.byType(PopupMenuButton<String>), findsNothing);
  });

  testWidgets('shows overflow when report provided', (tester) async {
    await tester.pumpWidget(
      wrapWithL10n(
        ConsumerReviewCard(
          review: _sample(),
          dateLabel: '1 Jan 2026',
          onReport: () {},
        ),
      ),
    );
    expect(find.byType(PopupMenuButton<String>), findsOneWidget);
  });
}
