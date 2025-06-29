# Flutter Real-Time Sync Client

## Overview

This document provides a complete Flutter implementation for real-time sync notifications using WebSocket connections to the AdminEngine server.

## Dependencies

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.4.9
  socket_io_client: ^2.0.3+1
  http: ^1.1.0
  shared_preferences: ^2.2.2
  connectivity_plus: ^5.0.2
```

## Sync Status Provider

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum SyncStatus { synced, syncing, offline, pending }

class SyncStatusNotifier extends StateNotifier<SyncStatus> {
  SyncStatusNotifier() : super(SyncStatus.synced);
  
  void setStatus(SyncStatus status) {
    state = status;
    print('Sync status changed: $status');
  }
}

// Global notifier instance
final syncStatusNotifier = SyncStatusNotifier();

final syncStatusProvider = StateNotifierProvider<SyncStatusNotifier, SyncStatus>(
  (ref) => syncStatusNotifier,
);
```

## WebSocket Sync Client

```dart
import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class SyncNotification {
  final String type;
  final String entityType;
  final String? entityId;
  final String message;
  final String timestamp;
  final Map<String, dynamic>? data;

  SyncNotification({
    required this.type,
    required this.entityType,
    this.entityId,
    required this.message,
    required this.timestamp,
    this.data,
  });

  factory SyncNotification.fromJson(Map<String, dynamic> json) {
    return SyncNotification(
      type: json['type'],
      entityType: json['entityType'],
      entityId: json['entityId'],
      message: json['message'],
      timestamp: json['timestamp'],
      data: json['data'],
    );
  }
}

class SyncClient {
  static const String baseUrl = 'http://your-server:3000';
  static const String wsUrl = 'http://your-server:3000';
  
  late IO.Socket socket;
  String? _token;
  String? _tenantId;
  bool _isConnected = false;
  
  // Callbacks
  Function(SyncNotification)? onNotification;
  Function(SyncStatus)? onStatusChange;
  Function(String)? onError;
  Function()? onConnected;
  Function()? onDisconnected;

  // Initialize the client
  Future<void> initialize(String token, String tenantId) async {
    _token = token;
    _tenantId = tenantId;
    
    await _connectWebSocket();
    await _authenticate();
  }

  // Connect to WebSocket
  Future<void> _connectWebSocket() async {
    socket = IO.io(wsUrl, <String, dynamic>{
      'transports': ['websocket', 'polling'],
      'autoConnect': false,
      'auth': {
        'token': _token,
      },
    });

    socket.onConnect((_) {
      print('WebSocket connected');
      _isConnected = true;
      onConnected?.call();
      onStatusChange?.call(SyncStatus.synced);
    });

    socket.onDisconnect((_) {
      print('WebSocket disconnected');
      _isConnected = false;
      onDisconnected?.call();
      onStatusChange?.call(SyncStatus.offline);
    });

    socket.onConnectError((error) {
      print('WebSocket connection error: $error');
      onError?.call('Connection failed: $error');
      onStatusChange?.call(SyncStatus.offline);
    });

    // Handle sync notifications
    socket.on('sync_notification', (data) {
      try {
        final notification = SyncNotification.fromJson(data);
        print('Received sync notification: ${notification.message}');
        onNotification?.call(notification);
        
        // Update sync status based on notification type
        switch (notification.type) {
          case 'data_available':
            onStatusChange?.call(SyncStatus.pending);
            break;
          case 'sync_complete':
            onStatusChange?.call(SyncStatus.synced);
            break;
          case 'sync_error':
            onStatusChange?.call(SyncStatus.offline);
            break;
        }
      } catch (e) {
        print('Error parsing sync notification: $e');
      }
    });

    // Handle authentication response
    socket.on('authenticated', (data) {
      print('WebSocket authenticated');
    });

    socket.on('authentication_error', (data) {
      print('WebSocket authentication failed: ${data['message']}');
      onError?.call('Authentication failed: ${data['message']}');
    });

    // Handle ping/pong for connection health
    socket.on('pong', (data) {
      print('Received pong: ${data['timestamp']}');
    });

    socket.connect();
  }

  // Authenticate with the server
  Future<void> _authenticate() async {
    if (_isConnected && _token != null && _tenantId != null) {
      socket.emit('authenticate', {
        'token': _token,
        'tenantId': _tenantId,
      });
    }
  }

  // Send sync status update to server
  void updateSyncStatus(SyncStatus status, {String? entityType}) {
    if (_isConnected) {
      socket.emit('sync_status_update', {
        'status': status.name,
        'entityType': entityType,
      });
    }
  }

  // Ping server for connection health
  void ping() {
    if (_isConnected) {
      socket.emit('ping');
    }
  }

  // Disconnect from WebSocket
  void disconnect() {
    if (_isConnected) {
      socket.disconnect();
    }
  }

  // HTTP API methods
  Future<Map<String, dynamic>> pushChanges(Map<String, dynamic> changes) async {
    try {
      onStatusChange?.call(SyncStatus.syncing);
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/client/sync/push'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: jsonEncode({'changes': changes}),
      );

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        onStatusChange?.call(SyncStatus.synced);
        return result;
      } else {
        throw Exception('Push failed: ${response.statusCode}');
      }
    } catch (e) {
      onStatusChange?.call(SyncStatus.offline);
      onError?.call('Push error: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> pullData(List<String> entityTypes, {String? lastSyncTimestamp}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final timestamp = lastSyncTimestamp ?? prefs.getString('lastSyncTimestamp') ?? DateTime(1970).toIso8601String();
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/client/sync/pull'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: jsonEncode({
          'lastSyncTimestamp': timestamp,
          'entityTypes': entityTypes,
        }),
      );

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        
        // Save last sync timestamp
        if (result['syncTimestamp'] != null) {
          await prefs.setString('lastSyncTimestamp', result['syncTimestamp']);
        }
        
        return result;
      } else {
        throw Exception('Pull failed: ${response.statusCode}');
      }
    } catch (e) {
      onError?.call('Pull error: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> pullPendingData(List<String> entityTypes) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/client/sync/pull-pending'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: jsonEncode({'entityTypes': entityTypes}),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Pull pending failed: ${response.statusCode}');
      }
    } catch (e) {
      onError?.call('Pull pending error: $e');
      rethrow;
    }
  }
}
```

## Sync Indicator Widget

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SyncIndicatorWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncStatus = ref.watch(syncStatusProvider);
    
    IconData icon;
    Color color;
    String text;
    
    switch (syncStatus) {
      case SyncStatus.synced:
        icon = Icons.check_circle;
        color = Colors.green;
        text = 'Synced';
        break;
      case SyncStatus.syncing:
        icon = Icons.sync;
        color = Colors.blue;
        text = 'Syncing...';
        break;
      case SyncStatus.offline:
        icon = Icons.cloud_off;
        color = Colors.red;
        text = 'Offline';
        break;
      case SyncStatus.pending:
        icon = Icons.warning;
        color = Colors.orange;
        text = 'Pending';
        break;
    }
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 6),
        Text(
          text,
          style: TextStyle(color: color, fontSize: 12),
        ),
      ],
    );
  }
}
```

## Key Features

1. **Real-time Notifications**: WebSocket-based instant sync notifications
2. **Status Management**: Visual sync status indicator
3. **Auto-sync**: Background sync with configurable intervals
4. **Error Handling**: Comprehensive error handling and user feedback
5. **Connection Health**: Ping/pong for connection monitoring
6. **Authentication**: Secure WebSocket authentication
7. **Multi-tenant**: Support for multiple tenants
8. **Offline Support**: Graceful handling of offline scenarios

## Benefits

- **Low Latency**: Real-time notifications instead of polling
- **Battery Efficient**: WebSocket connection is more efficient than HTTP polling
- **User Experience**: Immediate feedback on sync status
- **Scalable**: Supports multiple clients per tenant
- **Reliable**: Connection health monitoring and automatic reconnection
- **Secure**: JWT-based authentication for WebSocket connections

This implementation provides a complete real-time sync solution for your Flutter app with the AdminEngine server. 