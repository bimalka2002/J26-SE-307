import 'dart:async';

import 'package:flutter/material.dart';

import '../models/analysis.dart';
import '../services/analysis_service.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

class ResultsScreen extends StatefulWidget {
  const ResultsScreen({super.key, required this.analysisId});

  final String analysisId;

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  final _service = AnalysisService();
  Timer? _poller;
  Analysis? _analysis;
  String? _error;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _load();
    _poller = Timer.periodic(const Duration(seconds: 2), (_) {
      if (_analysis?.isComplete != true) _load();
    });
  }

  @override
  void dispose() {
    _poller?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    if (_loading) return;
    _loading = true;
    try {
      final analysis = await _service.get(widget.analysisId);
      if (!mounted) return;
      setState(() { _analysis = analysis; _error = null; });
      if (analysis.isComplete) _poller?.cancel();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      _loading = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final analysis = _analysis;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Screening results'), backgroundColor: AppColors.background),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          children: [
            if (analysis == null && _error == null) ...[
              const Center(child: CircularProgressIndicator()),
              const SizedBox(height: 16),
              const Center(child: Text('Loading your screening…')),
            ],
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: AppColors.error)),
              const SizedBox(height: 12),
              TextButton(onPressed: _load, child: const Text('Try again')),
            ],
            if (analysis != null) ...[
              _Panel(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(_statusTitle(analysis.status), style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 8),
                  Text(_statusDescription(analysis.status)),
                  if (!analysis.isComplete) ...[
                    const SizedBox(height: 18),
                    const LinearProgressIndicator(),
                    const SizedBox(height: 8),
                    const Text('Checking for results automatically…'),
                  ],
                  if (analysis.errorMessage != null) ...[
                    const SizedBox(height: 12),
                    Text(analysis.errorMessage!, style: const TextStyle(color: AppColors.error)),
                  ],
                ]),
              ),
              const SizedBox(height: 16),
              if (analysis.modelResults.isNotEmpty) ...[
                Text('Model findings', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 10),
                for (final result in analysis.modelResults) ...[
                  _Panel(child: _ModelFinding(result: result)),
                  const SizedBox(height: 10),
                ],
              ],
              const SizedBox(height: 8),
              const Text(
                'Screening support only — these results are not a clinical diagnosis. Follow up with a qualified clinician.',
                style: TextStyle(color: AppColors.muted),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _statusTitle(String status) => switch (status) {
        'completed' => 'Screening complete',
        'partial_fail' => 'Screening partly complete',
        'failed' => 'Screening could not complete',
        'running' => 'Analysing your images',
        _ => 'Screening queued',
      };

  String _statusDescription(String status) => switch (status) {
        'completed' => 'Your available model results are below.',
        'partial_fail' => 'Some models returned results; others could not complete.',
        'failed' => 'No models completed. Please try a new screening later.',
        _ => 'Your images were received. This page updates as the models finish.',
      };
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.line),
        ),
        child: child,
      );
}

class _ModelFinding extends StatelessWidget {
  const _ModelFinding({required this.result});

  final ModelResult result;

  @override
  Widget build(BuildContext context) {
    final className = result.predictedClass;
    final detail = switch (result.status) {
      'skipped' => 'Not screened — required image was not supplied.',
      'failed' => result.errorMessage ?? 'This model could not complete.',
      _ => className == null ? 'No classification returned.' : classLabel(className),
    };
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(modelLabel(result.modelKey), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
      const SizedBox(height: 6),
      Text(detail, style: TextStyle(color: result.status == 'failed' ? AppColors.error : AppColors.ink)),
      if (result.classScores.isNotEmpty) ...[
        const SizedBox(height: 10),
        for (final score in result.classScores.entries)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text('${classLabel(score.key)}: ${(score.value * 100).toStringAsFixed(1)}%'),
          ),
      ],
      if (result.qualityWarning != null && result.qualityWarning!.isNotEmpty) ...[
        const SizedBox(height: 10),
        Text(result.qualityWarning!, style: const TextStyle(color: AppColors.muted)),
      ],
    ]);
  }
}
