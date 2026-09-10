import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';
import 'package:qalago_mobile/shared/navigation/navigation_utils.dart';

void main() {
  group('consumerFallbackRoute', () {
    test('search preserves query', () {
      expect(
        consumerFallbackRoute(
          BusinessTrafficSource.search,
          searchQuery: 'кофе',
        ),
        '/search?q=%D0%BA%D0%BE%D1%84%D0%B5',
      );
    });

    test('map favorites promotions category', () {
      expect(consumerFallbackRoute(BusinessTrafficSource.map), '/map');
      expect(consumerFallbackRoute(BusinessTrafficSource.favorites), '/favorites');
      expect(consumerFallbackRoute(BusinessTrafficSource.promotions), '/promotions');
      expect(consumerFallbackRoute(BusinessTrafficSource.category), '/categories');
    });

    test('direct defaults home', () {
      expect(consumerFallbackRoute(BusinessTrafficSource.direct), '/home');
    });
  });

  testWidgets('qalagoPopOrGo pops when stack allows', (tester) async {
    late GoRouter router;
    router = GoRouter(
      initialLocation: '/a',
      routes: [
        GoRoute(
          path: '/a',
          builder: (context, _) => Scaffold(
            body: ElevatedButton(
              onPressed: () => context.push('/b'),
              child: const Text('forward'),
            ),
          ),
        ),
        GoRoute(
          path: '/b',
          builder: (context, _) => Scaffold(
            appBar: AppBar(
              leading: qalagoBackLeading(context),
            ),
            body: const Text('screen-b'),
          ),
        ),
      ],
    );

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.tap(find.text('forward'));
    await tester.pumpAndSettle();
    expect(find.text('screen-b'), findsOneWidget);

    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.text('forward'), findsOneWidget);
  });

  testWidgets('qalagoPopOrGo uses fallback when cannot pop', (tester) async {
    var lastLocation = '';
    final router = GoRouter(
      initialLocation: '/orphan',
      routes: [
        GoRoute(
          path: '/orphan',
          builder: (context, _) {
            lastLocation = GoRouterState.of(context).uri.path;
            return Scaffold(
              appBar: AppBar(
                leading: qalagoBackLeading(context, fallbackLocation: '/home'),
              ),
              body: const Text('orphan'),
            );
          },
        ),
        GoRoute(
          path: '/home',
          builder: (_, _) => const Scaffold(body: Text('home-root')),
        ),
      ],
    );

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    expect(find.text('orphan'), findsOneWidget);

    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.text('home-root'), findsOneWidget);
    expect(lastLocation, '/orphan');
  });

  testWidgets('BackButton meets tap target', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          appBar: AppBar(
            leading: Builder(
              builder: (context) => qalagoBackLeading(context, fallbackLocation: '/'),
            ),
          ),
        ),
      ),
    );
    final back = find.byType(BackButton);
    expect(back, findsOneWidget);
    final size = tester.getSize(back);
    expect(size.height, greaterThanOrEqualTo(48));
  });

  testWidgets('home root has no back button in shell tab placeholder', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: const Text('Главная'),
        ),
      ),
    );
    expect(find.byType(BackButton), findsNothing);
  });
}
