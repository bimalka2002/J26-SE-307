import 'package:flutter/material.dart';

import '../models/analysis.dart';
import '../services/analysis_service.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';
import 'results_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final _service = AnalysisService();
  List<Analysis>? _analyses;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final analyses = await _service.list();
      if (mounted) setState(() { _analyses = analyses; _error = null; });
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(22, 28, 22, 105),
          children: [
            Text('History', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 28)),
            const SizedBox(height: 8),
            const Text('Your recent screenings', style: TextStyle(color: AppColors.muted)),
            const SizedBox(height: 22),
            if (_analyses == null && _error == null) const Center(child: CircularProgressIndicator()),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: AppColors.error)),
              TextButton(onPressed: _load, child: const Text('Try again')),
            ],
            if (_analyses?.isEmpty == true) const Text('No screenings yet. Start one from the Scan tab.'),
            for (final analysis in _analyses ?? const <Analysis>[]) ...[
              Card(
                color: AppColors.surface,
                child: ListTile(
                  leading: const Icon(Icons.document_scanner_outlined, color: AppColors.accent),
                  title: Text(_dateLabel(analysis.createdAt)),
                  subtitle: Text('${_statusLabel(analysis.status)} · ${analysis.inputs.length} image${analysis.inputs.length == 1 ? '' : 's'}'),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () async {
                    await Navigator.of(context).push(MaterialPageRoute<void>(
                      builder: (_) => ResultsScreen(analysisId: analysis.id),
                    ));
                    _load();
                  },
                ),
              ),
              const SizedBox(height: 6),
            ],
          ],
        ),
      ),
    );
  }

  String _dateLabel(DateTime? value) {
    if (value == null) return 'Screening';
    final local = value.toLocal();
    return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')} '
        '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }

  String _statusLabel(String status) => switch (status) {
        'completed' => 'Completed',
        'partial_fail' => 'Partly complete',
        'failed' => 'Failed',
        'running' => 'Running',
        _ => 'Queued',
      };
}
