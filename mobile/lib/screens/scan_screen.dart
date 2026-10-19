import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../theme/app_colors.dart';
import '../widgets/primary_button.dart';

enum _ScanStep { intro, oralPhoto, xray, clinical, review, done }

class _PickedImage {
  const _PickedImage({required this.bytes, required this.name});

  final Uint8List bytes;
  final String name;
}

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  static const _symptoms = [
    'White patches',
    'Red patches',
    'Burning sensation',
    'Difficulty opening mouth',
    'Tooth pain',
    'Bleeding gums',
  ];

  final _picker = ImagePicker();
  final _ageController = TextEditingController();
  final _notesController = TextEditingController();

  _ScanStep _step = _ScanStep.intro;
  _PickedImage? _oralPhoto;
  _PickedImage? _xray;
  String? _gender;
  bool? _smokingHistory;
  String? _selectedSymptom;
  bool _submitting = false;
  String? _pickerError;

  @override
  void dispose() {
    _ageController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  int get _stepIndex => _ScanStep.values.indexOf(_step);

  int get _progressCount => _ScanStep.values.length - 1; // exclude done

  bool get _canContinueOral => _oralPhoto != null;

  bool get _canSubmit => _oralPhoto != null || _xray != null;

  Future<void> _pick(ImageSource source, {required bool forXray}) async {
    setState(() => _pickerError = null);
    try {
      final file = await _picker.pickImage(
        source: source,
        maxWidth: 2400,
        maxHeight: 2400,
        imageQuality: 88,
      );
      if (file == null) return;
      final bytes = await file.readAsBytes();
      final picked = _PickedImage(
        bytes: bytes,
        name: file.name.isNotEmpty ? file.name : (forXray ? 'xray.jpg' : 'oral.jpg'),
      );
      setState(() {
        if (forXray) {
          _xray = picked;
        } else {
          _oralPhoto = picked;
        }
      });
    } catch (_) {
      setState(() {
        _pickerError = source == ImageSource.camera
            ? 'Camera is unavailable on this device. Try the gallery instead.'
            : 'Could not open the gallery. Please try again.';
      });
    }
  }

  void _showSourceSheet({required bool forXray}) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.line,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  forXray ? 'Add dental X-ray' : 'Add oral photo',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Take a new photo or choose one from your gallery.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppColors.muted),
                ),
                const SizedBox(height: 18),
                _SourceTile(
                  icon: Icons.photo_camera_outlined,
                  title: 'Take photo',
                  subtitle: 'Use your camera',
                  onTap: () {
                    Navigator.pop(context);
                    _pick(ImageSource.camera, forXray: forXray);
                  },
                ),
                const SizedBox(height: 10),
                _SourceTile(
                  icon: Icons.photo_library_outlined,
                  title: 'Choose from gallery',
                  subtitle: 'JPEG or PNG',
                  onTap: () {
                    Navigator.pop(context);
                    _pick(ImageSource.gallery, forXray: forXray);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _goNext() {
    setState(() {
      _pickerError = null;
      switch (_step) {
        case _ScanStep.intro:
          _step = _ScanStep.oralPhoto;
        case _ScanStep.oralPhoto:
          if (_canContinueOral) _step = _ScanStep.xray;
        case _ScanStep.xray:
          _step = _ScanStep.clinical;
        case _ScanStep.clinical:
          _step = _ScanStep.review;
        case _ScanStep.review:
        case _ScanStep.done:
          break;
      }
    });
  }

  void _goBack() {
    setState(() {
      _pickerError = null;
      switch (_step) {
        case _ScanStep.intro:
          break;
        case _ScanStep.oralPhoto:
          _step = _ScanStep.intro;
        case _ScanStep.xray:
          _step = _ScanStep.oralPhoto;
        case _ScanStep.clinical:
          _step = _ScanStep.xray;
        case _ScanStep.review:
          _step = _ScanStep.clinical;
        case _ScanStep.done:
          _resetFlow();
      }
    });
  }

  void _resetFlow() {
    setState(() {
      _step = _ScanStep.intro;
      _oralPhoto = null;
      _xray = null;
      _gender = null;
      _smokingHistory = null;
      _selectedSymptom = null;
      _ageController.clear();
      _notesController.clear();
      _submitting = false;
      _pickerError = null;
    });
  }

  Future<void> _submit() async {
    if (!_canSubmit || _submitting) return;
    setState(() => _submitting = true);
    // UI-only for now — backend wiring comes next
    await Future<void>.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() {
      _submitting = false;
      _step = _ScanStep.done;
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottomPad = 88.0 + MediaQuery.paddingOf(context).bottom;

    return ColoredBox(
      color: AppColors.background,
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _ScanHeader(
              step: _step,
              progress: (_step == _ScanStep.done ? _progressCount : _stepIndex) /
                  _progressCount,
              onBack: _step == _ScanStep.intro ? null : _goBack,
            ),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                switchInCurve: Curves.easeOut,
                switchOutCurve: Curves.easeIn,
                child: KeyedSubtree(
                  key: ValueKey(_step),
                  child: _buildStepBody(bottomPad),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepBody(double bottomPad) {
    switch (_step) {
      case _ScanStep.intro:
        return _IntroStep(bottomPad: bottomPad, onContinue: _goNext);
      case _ScanStep.oralPhoto:
        return _CaptureStep(
          bottomPad: bottomPad,
          title: 'Oral photo',
          subtitle: 'Recommended for OLP, OSMF, and ELP models. Clear lighting helps.',
          image: _oralPhoto,
          error: _pickerError,
          required: true,
          onPickTap: () => _showSourceSheet(forXray: false),
          onCamera: () => _pick(ImageSource.camera, forXray: false),
          onGallery: () => _pick(ImageSource.gallery, forXray: false),
          onClear: () => setState(() => _oralPhoto = null),
          onContinue: _canContinueOral ? _goNext : null,
          continueLabel: 'Continue',
        );
      case _ScanStep.xray:
        return _CaptureStep(
          bottomPad: bottomPad,
          title: 'Dental X-ray',
          subtitle: 'Optional — used mainly for caries screening. You can skip this step.',
          image: _xray,
          error: _pickerError,
          required: false,
          onPickTap: () => _showSourceSheet(forXray: true),
          onCamera: () => _pick(ImageSource.camera, forXray: true),
          onGallery: () => _pick(ImageSource.gallery, forXray: true),
          onClear: () => setState(() => _xray = null),
          onContinue: _goNext,
          continueLabel: _xray == null ? 'Skip for now' : 'Continue',
          secondaryLabel: _xray == null ? null : 'Skip for now',
          onSecondary: _xray == null
              ? null
              : () => setState(() {
                    _xray = null;
                    _step = _ScanStep.clinical;
                  }),
        );
      case _ScanStep.clinical:
        return _ClinicalStep(
          bottomPad: bottomPad,
          ageController: _ageController,
          notesController: _notesController,
          gender: _gender,
          smokingHistory: _smokingHistory,
          symptoms: _symptoms,
          selectedSymptom: _selectedSymptom,
          onGender: (value) => setState(() => _gender = value),
          onSmoking: (value) => setState(() => _smokingHistory = value),
          onSymptom: (value) => setState(() => _selectedSymptom = value),
          onContinue: _goNext,
        );
      case _ScanStep.review:
        return _ReviewStep(
          bottomPad: bottomPad,
          oralPhoto: _oralPhoto,
          xray: _xray,
          age: _ageController.text.trim(),
          gender: _gender,
          smokingHistory: _smokingHistory,
          symptom: _selectedSymptom,
          notes: _notesController.text.trim(),
          submitting: _submitting,
          onSubmit: _canSubmit ? _submit : null,
        );
      case _ScanStep.done:
        return _DoneStep(bottomPad: bottomPad, onAgain: _resetFlow);
    }
  }
}

class _ScanHeader extends StatelessWidget {
  const _ScanHeader({
    required this.step,
    required this.progress,
    this.onBack,
  });

  final _ScanStep step;
  final double progress;
  final VoidCallback? onBack;

  String get _label {
    switch (step) {
      case _ScanStep.intro:
        return 'New screening';
      case _ScanStep.oralPhoto:
        return 'Step 1 of 4';
      case _ScanStep.xray:
        return 'Step 2 of 4';
      case _ScanStep.clinical:
        return 'Step 3 of 4';
      case _ScanStep.review:
        return 'Step 4 of 4';
      case _ScanStep.done:
        return 'Submitted';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 18, 8),
      child: Column(
        children: [
          Row(
            children: [
              if (onBack != null)
                IconButton(
                  onPressed: onBack,
                  icon: const Icon(Icons.arrow_back_rounded),
                  color: AppColors.ink,
                )
              else
                const SizedBox(width: 48),
              Expanded(
                child: Text(
                  _label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
              ),
              const SizedBox(width: 48),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress.clamp(0.05, 1),
              minHeight: 4,
              backgroundColor: AppColors.line,
              color: AppColors.accent,
            ),
          ),
        ],
      ),
    );
  }
}

class _IntroStep extends StatelessWidget {
  const _IntroStep({required this.bottomPad, required this.onContinue});

  final double bottomPad;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(22, 12, 22, bottomPad),
      children: [
        Text(
          'Start a screening',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 28),
        ),
        const SizedBox(height: 8),
        Text(
          'We’ll walk you through each input one step at a time.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 22),
        const _IntroCard(
          step: '01',
          title: 'Oral photo',
          text: 'Take or upload an intraoral photo.',
          icon: Icons.photo_camera_outlined,
        ),
        const SizedBox(height: 10),
        const _IntroCard(
          step: '02',
          title: 'Dental X-ray',
          text: 'Optional — add if you have one.',
          icon: Icons.medical_information_outlined,
        ),
        const SizedBox(height: 10),
        const _IntroCard(
          step: '03',
          title: 'Clinical details',
          text: 'Age, symptoms, and brief notes.',
          icon: Icons.assignment_outlined,
        ),
        const SizedBox(height: 10),
        const _IntroCard(
          step: '04',
          title: 'Review & run',
          text: 'Confirm inputs, then start AI screening.',
          icon: Icons.auto_awesome_outlined,
        ),
        const SizedBox(height: 28),
        PrimaryButton(label: 'Begin', onPressed: onContinue),
      ],
    );
  }
}

class _IntroCard extends StatelessWidget {
  const _IntroCard({
    required this.step,
    required this.title,
    required this.text,
    required this.icon,
  });

  final String step;
  final String title;
  final String text;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.accentSoft,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: AppColors.accent, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$step  $title',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  text,
                  style: const TextStyle(fontSize: 12.5, color: AppColors.muted, height: 1.35),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CaptureStep extends StatelessWidget {
  const _CaptureStep({
    required this.bottomPad,
    required this.title,
    required this.subtitle,
    required this.image,
    required this.required,
    required this.onPickTap,
    required this.onCamera,
    required this.onGallery,
    required this.onClear,
    required this.onContinue,
    required this.continueLabel,
    this.error,
    this.secondaryLabel,
    this.onSecondary,
  });

  final double bottomPad;
  final String title;
  final String subtitle;
  final _PickedImage? image;
  final bool required;
  final VoidCallback onPickTap;
  final VoidCallback onCamera;
  final VoidCallback onGallery;
  final VoidCallback onClear;
  final VoidCallback? onContinue;
  final String continueLabel;
  final String? error;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(22, 8, 22, bottomPad),
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 26),
        ),
        const SizedBox(height: 8),
        Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 20),
        AspectRatio(
          aspectRatio: 1,
          child: Material(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(24),
            child: InkWell(
              onTap: onPickTap,
              borderRadius: BorderRadius.circular(24),
              child: Ink(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: image == null ? AppColors.line : AppColors.accent.withValues(alpha: 0.35),
                  ),
                ),
                child: image == null
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: AppColors.accentSoft,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: const Icon(
                              Icons.add_a_photo_outlined,
                              color: AppColors.accent,
                              size: 28,
                            ),
                          ),
                          const SizedBox(height: 14),
                          const Text(
                            'Tap to add image',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            required ? 'Camera or gallery' : 'Optional · Camera or gallery',
                            style: const TextStyle(fontSize: 12.5, color: AppColors.muted),
                          ),
                        ],
                      )
                    : Stack(
                        fit: StackFit.expand,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(23),
                            child: Image.memory(image!.bytes, fit: BoxFit.cover),
                          ),
                          Positioned(
                            top: 12,
                            right: 12,
                            child: Row(
                              children: [
                                _RoundIconButton(
                                  icon: Icons.refresh_rounded,
                                  onTap: onPickTap,
                                ),
                                const SizedBox(width: 8),
                                _RoundIconButton(
                                  icon: Icons.close_rounded,
                                  onTap: onClear,
                                ),
                              ],
                            ),
                          ),
                          Positioned(
                            left: 12,
                            bottom: 12,
                            right: 12,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.55),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                image!.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
        if (error != null) ...[
          const SizedBox(height: 12),
          Text(
            error!,
            style: const TextStyle(color: AppColors.error, fontSize: 13),
          ),
        ],
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onCamera,
                icon: const Icon(Icons.photo_camera_outlined, size: 18),
                label: const Text('Camera'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.ink,
                  side: const BorderSide(color: AppColors.line),
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onGallery,
                icon: const Icon(Icons.photo_library_outlined, size: 18),
                label: const Text('Gallery'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.ink,
                  side: const BorderSide(color: AppColors.line),
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),
        PrimaryButton(label: continueLabel, onPressed: onContinue),
        if (secondaryLabel != null && onSecondary != null) ...[
          const SizedBox(height: 10),
          TextButton(
            onPressed: onSecondary,
            child: Text(
              secondaryLabel!,
              style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.muted),
            ),
          ),
        ],
      ],
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.92),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(icon, size: 18, color: AppColors.ink),
        ),
      ),
    );
  }
}

class _SourceTile extends StatelessWidget {
  const _SourceTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.background.withValues(alpha: 0.7),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.line),
                ),
                child: Icon(icon, color: AppColors.accent),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 12.5, color: AppColors.muted),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
            ],
          ),
        ),
      ),
    );
  }
}

class _ClinicalStep extends StatelessWidget {
  const _ClinicalStep({
    required this.bottomPad,
    required this.ageController,
    required this.notesController,
    required this.gender,
    required this.smokingHistory,
    required this.symptoms,
    required this.selectedSymptom,
    required this.onGender,
    required this.onSmoking,
    required this.onSymptom,
    required this.onContinue,
  });

  final double bottomPad;
  final TextEditingController ageController;
  final TextEditingController notesController;
  final String? gender;
  final bool? smokingHistory;
  final List<String> symptoms;
  final String? selectedSymptom;
  final ValueChanged<String?> onGender;
  final ValueChanged<bool?> onSmoking;
  final ValueChanged<String?> onSymptom;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(22, 8, 22, bottomPad),
      children: [
        Text(
          'Clinical details',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 26),
        ),
        const SizedBox(height: 8),
        Text(
          'Optional, but helpful context for screening. You can leave fields blank.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 20),
        const _FieldLabel('Age'),
        const SizedBox(height: 8),
        TextField(
          controller: ageController,
          keyboardType: TextInputType.number,
          decoration: _inputDecoration('e.g. 45'),
        ),
        const SizedBox(height: 16),
        const _FieldLabel('Gender'),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final option in const ['Female', 'Male', 'Other', 'Prefer not to say'])
              _ChoiceChip(
                label: option,
                selected: gender == option,
                onTap: () => onGender(gender == option ? null : option),
              ),
          ],
        ),
        const SizedBox(height: 16),
        const _FieldLabel('Smoking history'),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _ChoiceChip(
                label: 'Yes',
                selected: smokingHistory == true,
                onTap: () => onSmoking(smokingHistory == true ? null : true),
                expand: true,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _ChoiceChip(
                label: 'No',
                selected: smokingHistory == false,
                onTap: () => onSmoking(smokingHistory == false ? null : false),
                expand: true,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const _FieldLabel('Symptom'),
        const SizedBox(height: 8),
        DropdownButtonFormField<String?>(
          value: selectedSymptom,
          isExpanded: true,
          hint: const Text(
            'Select a symptom',
            style: TextStyle(color: AppColors.muted, fontSize: 14),
          ),
          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.muted),
          decoration: _inputDecoration('Select a symptom').copyWith(hintText: null),
          items: [
            const DropdownMenuItem<String?>(
              value: null,
              child: Text('None', style: TextStyle(color: AppColors.muted)),
            ),
            for (final symptom in symptoms)
              DropdownMenuItem<String?>(
                value: symptom,
                child: Text(symptom),
              ),
          ],
          onChanged: onSymptom,
        ),
        const SizedBox(height: 16),
        const _FieldLabel('Notes'),
        const SizedBox(height: 8),
        TextField(
          controller: notesController,
          maxLines: 4,
          decoration: _inputDecoration('Anything else the models should know…'),
        ),
        const SizedBox(height: 24),
        PrimaryButton(label: 'Continue to review', onPressed: onContinue),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: AppColors.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.accent, width: 1.4),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
      ),
    );
  }
}

class _ChoiceChip extends StatelessWidget {
  const _ChoiceChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.expand = false,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final child = Material(
      color: selected ? AppColors.accentSoft : AppColors.surface,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          width: expand ? double.infinity : null,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected ? AppColors.accent.withValues(alpha: 0.45) : AppColors.line,
            ),
          ),
          alignment: expand ? Alignment.center : null,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              color: selected ? const Color(0xFF1D4ED8) : AppColors.ink,
            ),
          ),
        ),
      ),
    );
    return child;
  }
}

class _ReviewStep extends StatelessWidget {
  const _ReviewStep({
    required this.bottomPad,
    required this.oralPhoto,
    required this.xray,
    required this.age,
    required this.gender,
    required this.smokingHistory,
    required this.symptom,
    required this.notes,
    required this.submitting,
    required this.onSubmit,
  });

  final double bottomPad;
  final _PickedImage? oralPhoto;
  final _PickedImage? xray;
  final String age;
  final String? gender;
  final bool? smokingHistory;
  final String? symptom;
  final String notes;
  final bool submitting;
  final VoidCallback? onSubmit;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(22, 8, 22, bottomPad),
      children: [
        Text(
          'Review',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 26),
        ),
        const SizedBox(height: 8),
        Text(
          'Check your inputs, then run screening.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(child: _ReviewThumb(label: 'Oral photo', image: oralPhoto)),
            const SizedBox(width: 10),
            Expanded(child: _ReviewThumb(label: 'X-ray', image: xray)),
          ],
        ),
        const SizedBox(height: 14),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ReviewRow(label: 'Age', value: age.isEmpty ? '—' : age),
              _ReviewRow(label: 'Gender', value: gender ?? '—'),
              _ReviewRow(
                label: 'Smoking',
                value: smokingHistory == null ? '—' : (smokingHistory! ? 'Yes' : 'No'),
              ),
              _ReviewRow(
                label: 'Symptom',
                value: symptom ?? '—',
              ),
              _ReviewRow(label: 'Notes', value: notes.isEmpty ? '—' : notes, last: true),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Screening support only · Does not replace clinical diagnosis.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppColors.muted.withValues(alpha: 0.75),
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 22),
        PrimaryButton(
          label: 'Run screening',
          onPressed: onSubmit,
          loading: submitting,
        ),
      ],
    );
  }
}

class _ReviewThumb extends StatelessWidget {
  const _ReviewThumb({required this.label, required this.image});

  final String label;
  final _PickedImage? image;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 140,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (image != null)
            Image.memory(image!.bytes, fit: BoxFit.cover)
          else
            ColoredBox(
              color: AppColors.accentSoft.withValues(alpha: 0.45),
              child: const Center(
                child: Text(
                  'Skipped',
                  style: TextStyle(
                    color: AppColors.muted,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          Positioned(
            left: 10,
            bottom: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  const _ReviewRow({
    required this.label,
    required this.value,
    this.last = false,
  });

  final String label;
  final String value;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: last ? 0 : 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 84,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: AppColors.muted,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DoneStep extends StatelessWidget {
  const _DoneStep({required this.bottomPad, required this.onAgain});

  final double bottomPad;
  final VoidCallback onAgain;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(22, 28, 22, bottomPad),
      children: [
        Center(
          child: Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              color: AppColors.accentSoft,
              borderRadius: BorderRadius.circular(28),
            ),
            child: const Icon(Icons.check_rounded, size: 42, color: AppColors.accent),
          ),
        ),
        const SizedBox(height: 22),
        const Text(
          'Screening queued',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.6,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Your images are ready for analysis. Backend processing will be connected next — for now this completes the capture flow.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 28),
        PrimaryButton(label: 'Start another screening', onPressed: onAgain),
      ],
    );
  }
}
