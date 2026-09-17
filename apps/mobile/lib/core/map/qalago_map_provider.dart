import 'qalago_map_controller.dart';
import 'providers/flutter_map_qalago_map_controller.dart';

/// Factory for the active map renderer implementation.
QalaGoMapController createQalaGoMapController() =>
    FlutterMapQalaGoMapController();
