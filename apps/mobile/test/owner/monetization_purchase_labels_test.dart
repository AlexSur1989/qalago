import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/monetization/data/monetization_labels.dart';

void main() {
  test('purchase state labels are localized (not raw enums)', () {
    expect(purchaseStateLabel('PENDING_PAYMENT'), 'Ожидает оплаты');
    expect(purchasePrimaryActionLabel('CONTINUE_PAYMENT'), 'Продолжить оплату');
    expect(purchasePrimaryActionLabel('BUY'), 'Купить');
  });

  test('reason codes map to user-friendly messages', () {
    expect(
      monetizationReasonMessage('PENDING_ORDER_EXISTS'),
      contains('неоплаченный заказ'),
    );
    expect(monetizationReasonMessage('PLACEMENT_SOLD_OUT'), contains('мест нет'));
  });
}
