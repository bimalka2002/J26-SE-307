import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('OralScan app boots to splash', (tester) async {
    await tester.pumpWidget(const OralScanApp());
    expect(find.text('OralScan'), findsWidgets);
    expect(find.textContaining('Detect'), findsOneWidget);
    expect(find.textContaining('Initializing'), findsOneWidget);

    // Dispose app so repeating splash animation tickers are cancelled.
    await tester.pumpWidget(const SizedBox.shrink());
  });
}
