import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/dio_provider.dart';
import 'push_device_api.dart';
import 'push_registration_service.dart';

final pushDeviceApiProvider = Provider<PushDeviceApi>(
  (ref) => PushDeviceApi(ref.watch(dioProvider)),
);

final pushRegistrationServiceProvider = Provider<PushRegistrationService>(
  (ref) => PushRegistrationService(api: ref.watch(pushDeviceApiProvider)),
);
