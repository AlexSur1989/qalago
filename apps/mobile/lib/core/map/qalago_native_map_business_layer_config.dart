/// Experimental native MapLibre catalog business layer (Stage 6.11C.6B+).
///
/// Enable with:
/// `--dart-define=QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`
///
/// Default (unset or false): Flutter overlay business markers remain in use.
abstract final class QalaGoNativeMapBusinessLayerConfig {
  static const enabled = bool.fromEnvironment(
    'QALAGO_NATIVE_MAP_BUSINESS_LAYER',
    defaultValue: false,
  );
}
