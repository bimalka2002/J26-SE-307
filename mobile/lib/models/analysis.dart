class ModelResult {
  const ModelResult({
    required this.modelKey,
    required this.status,
    this.predictedClass,
    this.classScores = const {},
    this.qualityWarning,
    this.errorMessage,
  });

  final String modelKey;
  final String status;
  final String? predictedClass;
  final Map<String, double> classScores;
  final String? qualityWarning;
  final String? errorMessage;

  factory ModelResult.fromJson(Map<String, dynamic> json) {
    final rawScores = json['classScores'];
    final scores = <String, double>{};
    if (rawScores is Map) {
      for (final entry in rawScores.entries) {
        if (entry.value is num) scores[entry.key.toString()] = (entry.value as num).toDouble();
      }
    }
    final error = json['error'];
    return ModelResult(
      modelKey: json['modelKey']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      predictedClass: json['predictedClass']?.toString(),
      classScores: scores,
      qualityWarning: json['qualityWarning']?.toString(),
      errorMessage: error is Map ? error['message']?.toString() : null,
    );
  }
}

class Analysis {
  const Analysis({
    required this.id,
    required this.status,
    this.createdAt,
    this.inputs = const [],
    this.modelResults = const [],
    this.errorMessage,
  });

  final String id;
  final String status;
  final DateTime? createdAt;
  final List<String> inputs;
  final List<ModelResult> modelResults;
  final String? errorMessage;

  bool get isComplete => status == 'completed' || status == 'failed' || status == 'partial_fail';

  factory Analysis.fromJson(Map<String, dynamic> json) {
    final rawInputs = json['inputs'];
    final rawResults = json['modelResults'];
    final error = json['error'];
    return Analysis(
      id: json['_id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'queued',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      inputs: rawInputs is List
          ? rawInputs.whereType<Map>().map((item) => item['modality']?.toString() ?? '').toList()
          : const [],
      modelResults: rawResults is List
          ? rawResults.whereType<Map>().map((item) => ModelResult.fromJson(Map<String, dynamic>.from(item))).toList()
          : const [],
      errorMessage: error is Map ? error['message']?.toString() : null,
    );
  }
}

String modelLabel(String key) => switch (key) {
      'olp' => 'Oral lichen planus',
      'osmf' => 'Oral submucous fibrosis',
      'elp' => 'Leukoplakia / erythroplakia',
      'caries_intraoral' => 'Caries (oral photo)',
      'caries_xray' => 'Caries (X-ray)',
      _ => key.replaceAll('_', ' '),
    };

String classLabel(String key) => switch (key) {
      'negative' => 'No signs',
      'positive' => 'Signs present',
      'neither_target' => 'Neither',
      'no_caries' => 'No caries',
      _ => key.replaceAll('_', ' '),
    };
