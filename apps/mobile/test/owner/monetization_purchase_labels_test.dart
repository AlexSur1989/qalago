import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/monetization/data/monetization_labels.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';

void main() {
  final ru = lookupAppLocalizations(const Locale('ru'));

  test('purchase state labels are localized (not raw enums)', () {
    expect(purchaseStateLabel(ru, 'PENDING_PAYMENT'), 'Ожидает оплаты');
    expect(purchasePrimaryActionLabel(ru, 'CONTINUE_PAYMENT'), 'Продолжить оплату');
    expect(purchasePrimaryActionLabel(ru, 'BUY'), 'Купить');
  });

  test('reason codes map to user-friendly messages', () {
    expect(
      monetizationReasonMessage(ru, 'PENDING_ORDER_EXISTS'),
      contains('неоплаченный заказ'),
    );
    expect(monetizationReasonMessage(ru, 'PLACEMENT_SOLD_OUT'), contains('мест нет'));
  });
}
