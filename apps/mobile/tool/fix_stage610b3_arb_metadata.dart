// ignore_for_file: avoid_print
import 'dart:convert';
import 'dart:io';

void main() {
  for (final path in ['lib/l10n/app_ru.arb', 'lib/l10n/app_kk.arb']) {
    _fixFile(path);
  }
}

void _fixFile(String path) {
  final file = File(path);
  final decoded = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  decoded.removeWhere((key, value) => key.startsWith('@') && value == null);

  const meta = {
    '@ownerAnalyticsDeltaPositive': {
      'placeholders': {'percent': {'type': 'int'}}
    },
    '@ownerAnalyticsDeltaNegative': {
      'placeholders': {'percent': {'type': 'int'}}
    },
    '@ownerPermissionsMore': {
      'placeholders': {
        'head': {'type': 'String'},
        'count': {'type': 'int'},
      }
    },
    '@monetizationReasonGenericWithCode': {
      'placeholders': {'code': {'type': 'String'}}
    },
    '@ownerDurationDays': {
      'placeholders': {
        'count': {'type': 'int'},
        'unit': {'type': 'String'},
      }
    },
    '@ownerDurationHours': {
      'placeholders': {'count': {'type': 'int'}}
    },
    '@ownerWelcome': {
      'placeholders': {'title': {'type': 'String'}}
    },
    '@ownerSummaryWeek': {
      'placeholders': {
        'views': {'type': 'int'},
        'actions': {'type': 'int'},
      }
    },
    '@ownerDeltaWeek': {
      'placeholders': {'delta': {'type': 'String'}}
    },
    '@ownerProfileCompletion': {
      'placeholders': {'percent': {'type': 'int'}}
    },
    '@ownerErrorWithDetails': {
      'placeholders': {'details': {'type': 'String'}}
    },
    '@ownerTeamManagersUsage': {
      'placeholders': {
        'used': {'type': 'int'},
        'limit': {'type': 'int'},
      }
    },
    '@ownerTeamManagersExtra': {
      'placeholders': {
        'active': {'type': 'int'},
        'pending': {'type': 'int'},
      }
    },
    '@ownerRevokeInviteBody': {
      'placeholders': {'email': {'type': 'String'}}
    },
    '@ownerInviteStatusLine': {
      'placeholders': {
        'status': {'type': 'String'},
        'expires': {'type': 'String'},
      }
    },
    '@ownerDiscountPercent': {
      'placeholders': {'percent': {'type': 'String'}}
    },
    '@ownerActiveUntil': {
      'placeholders': {'date': {'type': 'String'}}
    },
    '@ownerNextAvailableDate': {
      'placeholders': {'date': {'type': 'String'}}
    },
    '@ownerReservedUntil': {
      'placeholders': {'date': {'type': 'String'}}
    },
    '@ownerPriceFrom': {
      'placeholders': {'price': {'type': 'String'}}
    },
    '@ownerReviewsTitle': {
      'placeholders': {'title': {'type': 'String'}}
    },
    '@ownerReviewsSummary': {
      'placeholders': {
        'total': {'type': 'int'},
        'unanswered': {'type': 'String'},
      }
    },
    '@ownerReviewsUnansweredSuffix': {
      'placeholders': {'count': {'type': 'int'}}
    },
    '@ownerYourReply': {
      'placeholders': {'reply': {'type': 'String'}}
    },
    '@ownerPromotionLimit': {
      'placeholders': {'max': {'type': 'int'}}
    },
    '@ownerDeletePromotionBody': {
      'placeholders': {'title': {'type': 'String'}}
    },
    '@ownerPromotionsTitle': {
      'placeholders': {'title': {'type': 'String'}}
    },
    '@ownerActivePromotionsCount': {
      'placeholders': {
        'active': {'type': 'int'},
        'max': {'type': 'int'},
      }
    },
    '@ownerPlanCurrent': {
      'placeholders': {'name': {'type': 'String'}}
    },
    '@ownerPlanPeriodDays': {
      'placeholders': {'days': {'type': 'int'}}
    },
    '@ownerGalleryTitle': {
      'placeholders': {'title': {'type': 'String'}}
    },
    '@ownerPhotoLimitSnackbar': {
      'placeholders': {'max': {'type': 'int'}}
    },
    '@ownerUploadError': {
      'placeholders': {'details': {'type': 'String'}}
    },
    '@ownerPhotosUsage': {
      'placeholders': {
        'used': {'type': 'int'},
        'max': {'type': 'int'},
        'suffix': {'type': 'String'},
      }
    },
    '@ownerAnalyticsPeriodDays': {
      'placeholders': {'days': {'type': 'int'}}
    },
    '@ownerSearchOtherQueries': {
      'placeholders': {'count': {'type': 'String'}}
    },
    '@ownerSearchTransitions': {
      'placeholders': {'count': {'type': 'String'}}
    },
    '@ownerCampaignDaysLeft': {
      'placeholders': {
        'days': {'type': 'int'},
        'unit': {'type': 'String'},
      }
    },
    '@ownerCampaignMetrics': {
      'placeholders': {
        'served': {'type': 'String'},
        'views': {'type': 'String'},
        'clicks': {'type': 'String'},
      }
    },
    '@ownerCampaignPeriod': {
      'placeholders': {'range': {'type': 'String'}}
    },
  };

  for (final entry in meta.entries) {
    decoded[entry.key] = entry.value;
  }

  final encoder = const JsonEncoder.withIndent('  ');
  file.writeAsStringSync('${encoder.convert(decoded)}\n');
  print('Fixed $path');
}
