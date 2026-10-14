import React, { useState, useEffect, useCallback, useRef } from 'react';

import { HomeScreen } from './src/screens/HomeScreen.jsx';
import { CreateServiceRequestScreen } from './src/screens/CreateServiceRequestScreen.jsx';
import { RequestStatusScreen } from './src/screens/RequestStatusScreen.jsx';
import { NotificationsModal } from './src/components/NotificationsModal.jsx';
import { NotificationToast } from './src/components/NotificationToast.jsx';

import { customerApi } from './src/services/api.js';

export const CustomerApp = ({ onSwitchToProviderApp }) => {
  const [currentScreen, setCurrentScreen] = useState('HOME');
  const [selectedService, setSelectedService] = useState('Plumbing');
  const [activeRequest, setActiveRequest] = useState(null);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  const seenNotificationIds = useRef(new Set());

  // Fetch notifications for Customer (User ID 1)
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await customerApi.getUserNotifications(1);
      setNotifications(data);

      // Detect any brand new unread notification that we haven't seen in this session
      const unreadList = data.filter((n) => !n.isRead);

      for (const unread of unreadList) {
        if (!seenNotificationIds.current.has(unread.id)) {
          seenNotificationIds.current.add(unread.id);

          // Show the in-app push notification toast banner
          setToastNotification(unread);

          // Auto-hide toast after 7 seconds
          setTimeout(() => {
            setToastNotification((prev) =>
              prev?.id === unread.id ? null : prev
            );
          }, 7000);

          break;
        }
      }
    } catch (err) {
      console.error('Failed to poll notifications:', err);
    }
  }, []);

  // Poll notifications every 2.5 seconds
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 2500);

    // Listen for demo reset events to clear state
    const handleReset = () => {
      seenNotificationIds.current.clear();
      setNotifications([]);
      setActiveRequest(null);
      setCurrentScreen('HOME');
      setToastNotification(null);
      setIsNotificationsModalOpen(false);
    };

    window.addEventListener('helpdesk-reset', handleReset);

    return () => {
      clearInterval(interval);
      window.removeEventListener('helpdesk-reset', handleReset);
    };
  }, [fetchNotifications]);

  const handleSelectService = (serviceName) => {
    setSelectedService(serviceName);
    setCurrentScreen('CREATE_REQUEST');
  };

  const handleRequestCreated = (request) => {
    setActiveRequest(request);
    setCurrentScreen('REQUEST_STATUS');
  };

  // When customer clicks a notification (from toast or modal)
  const handleOpenNotification = async (notification) => {
    // 1. Mark as read
    try {
      await customerApi.markNotificationAsRead(notification.id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, isRead: true }
            : n
        )
      );
    } catch (e) {
      console.error(e);
    }

    // 2. Fetch the corresponding service request
    try {
      const req = await customerApi.getServiceRequestById(
        notification.serviceRequestId
      );

      setActiveRequest(req);
      setCurrentScreen('REQUEST_STATUS');
    } catch (e) {
      console.error(
        'Failed to load request for notification:',
        e
      );
    }

    // 3. Dismiss UI
    setToastNotification(null);
    setIsNotificationsModalOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);

    for (const item of unread) {
      try {
        await customerApi.markNotificationAsRead(item.id);
      } catch (e) {
        console.error(e);
      }
    }

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 select-none relative overflow-hidden">
      {/* Real-time In-App Push Notification Toast Banner */}
      <NotificationToast
        notification={toastNotification}
        onDismiss={() => setToastNotification(null)}
        onTap={handleOpenNotification}
      />

      {/* Screen Routing */}
      {currentScreen === 'HOME' && (
        <HomeScreen
          onSelectService={handleSelectService}
          onRequestViewRecent={(id) => {
            if (activeRequest && activeRequest.id === id) {
              setCurrentScreen('REQUEST_STATUS');
            }
          }}
          activeRequestId={activeRequest?.id}
          unreadCount={unreadCount}
          onOpenNotifications={() =>
            setIsNotificationsModalOpen(true)
          }
        />
      )}

      {currentScreen === 'CREATE_REQUEST' && (
        <CreateServiceRequestScreen
          serviceName={selectedService}
          onBack={() => setCurrentScreen('HOME')}
          onRequestCreated={handleRequestCreated}
        />
      )}

      {currentScreen === 'REQUEST_STATUS' && activeRequest && (
        <RequestStatusScreen
          initialRequest={activeRequest}
          onHomeClick={() => setCurrentScreen('HOME')}
          onSwitchToProviderApp={onSwitchToProviderApp}
          unreadCount={unreadCount}
          onOpenNotifications={() =>
            setIsNotificationsModalOpen(true)
          }
        />
      )}

      {/* In-App Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onSelectNotification={handleOpenNotification}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  );
};

export default CustomerApp;