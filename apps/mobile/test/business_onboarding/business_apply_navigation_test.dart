import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/router/business_route_segments.dart';

const _applyKey = Key('flow-new-application');
const _searchKey = Key('flow-business-search');
const _applicationsKey = Key('flow-my-applications');
const _detailsKey = Key('flow-business-details');

GoRouter _profileShellRouter({
  required GlobalKey<NavigatorState> rootKey,
  required GlobalKey<NavigatorState> shellKey,
}) {
  return GoRouter(
    navigatorKey: rootKey,
    initialLocation: '/profile',
    routes: [
      ShellRoute(
        navigatorKey: shellKey,
        builder: (context, state, child) => Scaffold(body: child),
        routes: [
          GoRoute(
            path: '/profile',
            builder: (context, state) => const SizedBox(key: Key('profile')),
          ),
          GoRoute(
            path: '/business/apply',
            builder: (context, state) => const SizedBox(key: _applyKey),
          ),
          GoRoute(
            path: '/business/search',
            builder: (context, state) => const SizedBox(key: _searchKey),
          ),
          GoRoute(
            path: '/business/applications',
            builder: (context, state) => const SizedBox(key: _applicationsKey),
          ),
          GoRoute(
            path: '/business/:id',
            builder: (context, state) => SizedBox(
              key: _detailsKey,
              child: Text(state.pathParameters['id']!),
            ),
          ),
        ],
      ),
    ],
  );
}

void main() {
  test('apply is a reserved onboarding segment, not a business id', () {
    expect(isBusinessOnboardingPathSegment('apply'), isTrue);
    expect(isBusinessOnboardingPathSegment('clxyz123'), isFalse);
  });

  testWidgets('from profile, /business/apply opens new application flow', (tester) async {
    final rootKey = GlobalKey<NavigatorState>();
    final shellKey = GlobalKey<NavigatorState>();
    final router = _profileShellRouter(rootKey: rootKey, shellKey: shellKey);

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();

    router.push('/business/apply');
    await tester.pumpAndSettle();

    expect(find.byKey(_applyKey), findsOneWidget);
    expect(find.byKey(_detailsKey), findsNothing);
  });

  testWidgets('/business/search opens ownership search flow', (tester) async {
    final rootKey = GlobalKey<NavigatorState>();
    final shellKey = GlobalKey<NavigatorState>();
    final router = _profileShellRouter(rootKey: rootKey, shellKey: shellKey);

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();
    router.push('/business/search');
    await tester.pumpAndSettle();

    expect(find.byKey(_searchKey), findsOneWidget);
    expect(find.byKey(_detailsKey), findsNothing);
  });

  testWidgets('/business/applications opens applications flow', (tester) async {
    final rootKey = GlobalKey<NavigatorState>();
    final shellKey = GlobalKey<NavigatorState>();
    final router = _profileShellRouter(rootKey: rootKey, shellKey: shellKey);

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();
    router.push('/business/applications');
    await tester.pumpAndSettle();

    expect(find.byKey(_applicationsKey), findsOneWidget);
    expect(find.byKey(_detailsKey), findsNothing);
  });

  testWidgets('/business/abc opens business details with real id', (tester) async {
    final rootKey = GlobalKey<NavigatorState>();
    final shellKey = GlobalKey<NavigatorState>();
    final router = _profileShellRouter(rootKey: rootKey, shellKey: shellKey);

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();
    router.push('/business/abc');
    await tester.pumpAndSettle();

    expect(find.byKey(_detailsKey), findsOneWidget);
    expect(find.text('abc'), findsOneWidget);
    expect(find.byKey(_applyKey), findsNothing);
  });

  testWidgets('without static apply route, /business/apply wrongly matches details id', (tester) async {
    final rootKey = GlobalKey<NavigatorState>();
    final shellKey = GlobalKey<NavigatorState>();
    final router = GoRouter(
      navigatorKey: rootKey,
      initialLocation: '/profile',
      routes: [
        ShellRoute(
          navigatorKey: shellKey,
          builder: (context, state, child) => Scaffold(body: child),
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) => const SizedBox(),
            ),
            GoRoute(
              path: '/business/:id',
              builder: (context, state) => SizedBox(
                key: _detailsKey,
                child: Text(state.pathParameters['id']!),
              ),
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();
    router.push('/business/apply');
    await tester.pumpAndSettle();

    expect(find.text('apply'), findsOneWidget);
    expect(find.byKey(_applyKey), findsNothing);
  });
}
