class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.isRead,
    required this.createdAt,
    this.targetType,
    this.targetId,
    this.payload,
  });

  final String id;
  final String type;
  final String title;
  final String? body;
  final bool isRead;
  final DateTime? createdAt;
  final String? targetType;
  final String? targetId;
  final Map<String, dynamic>? payload;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final payloadRaw = json['payload'];
    Map<String, dynamic>? payload;
    if (payloadRaw is Map) {
      payload = Map<String, dynamic>.from(payloadRaw);
    }
    final createdAtRaw = json['createdAt'];
    DateTime? createdAt;
    if (createdAtRaw is String) {
      createdAt = DateTime.tryParse(createdAtRaw);
    }
    return AppNotification(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      title: json['title'] as String? ?? '',
      body: json['body'] as String?,
      isRead: json['isRead'] as bool? ?? false,
      createdAt: createdAt,
      targetType: json['targetType'] as String?,
      targetId: json['targetId'] as String?,
      payload: payload,
    );
  }
}

class PaginatedNotifications {
  const PaginatedNotifications({
    required this.items,
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  final List<AppNotification> items;
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  factory PaginatedNotifications.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'];
    final pagination = json['pagination'] as Map<String, dynamic>? ?? {};
    final items = itemsRaw is List
        ? itemsRaw
            .whereType<Map>()
            .map((e) => AppNotification.fromJson(Map<String, dynamic>.from(e)))
            .toList()
        : <AppNotification>[];
    return PaginatedNotifications(
      items: items,
      page: pagination['page'] as int? ?? 1,
      limit: pagination['limit'] as int? ?? items.length,
      total: pagination['total'] as int? ?? items.length,
      totalPages: pagination['totalPages'] as int? ?? 1,
    );
  }
}
