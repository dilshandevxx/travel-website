import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ServiceCategory, ServiceRequest, ProviderProfile, RequestUrgency, Address } from '../../types';
import { CategoryIcon } from '../common/CategoryIcons';
import { CustomerSettings } from './CustomerSettings';
import { BookingProgressScreen } from './BookingProgressScreen';
import { ActionButton } from '../common/ActionButton';
import { 
  LogOut,
  Search, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Star, 
  Clock, 
  Phone, 
  ChevronRight, 
  Calendar, 
  Camera, 
  CheckCircle2, 
  ArrowLeft, 
  Check, 
  Wrench, 
  MessageSquare, 
  X, 
  User as UserIcon,
  HelpCircle,
  Settings,
  Bell,
  Briefcase,
  Send,
  Plus,
  AlertCircle,
  RotateCw
} from 'lucide-react';

import { CustomerMobileHeader } from '../mobile/CustomerMobileHeader';

// ==================== NAVIGATION TYPES ====================

export type CustomerScreenName = 
  | 'HomeScreen'
  | 'CreateServiceRequestScreen'
  | 'BookingProgressScreen'
  | 'BookingProgress' // Alias requested by prompt
  | 'BookingHistoryScreen'
  | 'NotificationsScreen'
  | 'MessagesScreen'
  | 'ProfileScreen'
  | 'SettingsScreen'
  | 'ProviderDetailsScreen';

export type CustomerNavigationRoute =
  | { name: 'HomeScreen' }
  | { name: 'CreateServiceRequestScreen'; params?: { preselectedCategoryId?: string; directProviderId?: string; prefillDescription?: string; prefillUrgency?: RequestUrgency } }
  | { name: 'BookingProgressScreen' | 'BookingProgress'; params: { requestId: string } }
  | { name: 'BookingHistoryScreen'; params?: { initialFilter?: 'active' | 'completed' | 'cancelled' } }
  | { name: 'NotificationsScreen' }
  | { name: 'MessagesScreen'; params?: { bookingId?: string } }
  | { name: 'ProfileScreen' }
  | { name: 'SettingsScreen'; params?: { initialSubView?: 'main' | 'account' | 'notifications' | 'preferences' | 'privacy' | 'faq' } }
  | { name: 'ProviderDetailsScreen'; params: { providerId: string } };

export interface CustomerNavigation {
  currentRoute: CustomerNavigationRoute;
  navigate: (screen: CustomerScreenName, params?: any) => void;
  goBack: () => void;
  canGoBack: boolean;
}

interface CustomerAppProps {
  initialBookingId?: string | null;
  onClearInitialBooking?: () => void;
  onSwitchToProviderMode?: () => void;
  onOpenAdminPortal?: () => void;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({ initialBookingId, onClearInitialBooking, onSwitchToProviderMode, onOpenAdminPortal }) => {
  const { user, refreshMe, logout, switchMode } = useAuth();

  // Navigation Stack State
  const [routeStack, setRouteStack] = useState<CustomerNavigationRoute[]>([
    { name: 'HomeScreen' }
  ]);

  
  const currentRoute = routeStack[routeStack.length - 1];

  // Core Data States
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [myBookings, setMyBookings] = useState<ServiceRequest[]>([]);
  const [activeBooking, setActiveBooking] = useState<ServiceRequest | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);

  // Address Modal State
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrLine, setNewAddrLine] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('Colombo 03');
  const [isSavingNewAddr, setIsSavingNewAddr] = useState(false);

  // Create Service Request Form States & Validation Errors
  const [formCategory, setFormCategory] = useState<ServiceCategory | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrgency, setFormUrgency] = useState<RequestUrgency>('NORMAL');
  const [formAddress, setFormAddress] = useState('45/2 Galle Road, Kollupitiya');
  const [formCity, setFormCity] = useState('Colombo 03');
  const [formDate, setFormDate] = useState('2026-10-09');
  const [formTime, setFormTime] = useState('ASAP / Next available');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formDirectProvider, setFormDirectProvider] = useState<ProviderProfile | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  // Booking History Filter State
  const [jobsFilter, setJobsFilter] = useState<'active' | 'completed' | 'cancelled'>('active');

  // Messages Chat States
  const [chatBookingId, setChatBookingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Home Screen Search
  const [homeSearchQuery, setHomeSearchQuery] = useState('');

  // ------------------- NAVIGATION CONTROLLER -------------------

  const navigate = useCallback((screen: CustomerScreenName, params?: any) => {
    // Normalize BookingProgress alias to BookingProgressScreen
    const normalizedScreen = screen === 'BookingProgress' ? 'BookingProgressScreen' : screen;

    const newRoute: CustomerNavigationRoute = {
      name: normalizedScreen,
      params
    } as CustomerNavigationRoute;

    setRouteStack(prev => {
         // If switching to top-level tab screens, reset stack root
      if (['HomeScreen', 'BookingHistoryScreen', 'NotificationsScreen', 'MessagesScreen', 'ProfileScreen'].includes(normalizedScreen)) {
        return [newRoute];
      }
      return [...prev, newRoute];
    });
  }, []);

  const goBack = useCallback(() => {
    setRouteStack(prev => {
      if (prev.length > 1) {
        return prev.slice(0, prev.length - 1);
      }
      return [{ name: 'HomeScreen' }];
    });
  }, []);

  const navigation: CustomerNavigation = {
    currentRoute,
    navigate,
    goBack,
    canGoBack: routeStack.length > 1
  };

  // Determine active bottom tab based on current screen
  const getActiveTab = (): 'home' | 'jobs' | 'messages' | 'notifications' | 'profile' => {
    switch (currentRoute.name) {
      case 'HomeScreen':
      case 'CreateServiceRequestScreen':
      case 'ProviderDetailsScreen':
        return 'home';
      case 'BookingHistoryScreen':
      case 'BookingProgressScreen':
      case 'BookingProgress':
        return 'jobs';
      case 'MessagesScreen':
        return 'messages';
      case 'NotificationsScreen':
        return 'notifications';
      case 'ProfileScreen':
      case 'SettingsScreen':
        return 'profile';
      default:
        return 'home';
    }
  };
   // ------------------- INITIAL DATA LOADING -------------------

  const loadData = async () => {
    try {
      const [cats, provs, bks, addrs, notifs, revs] = await Promise.all([
        api.getCategories(),
        api.getProviders({ verifiedOnly: true }),
        api.getServiceRequests(),
        api.getAddresses().catch(() => []),
        api.getNotifications().catch(() => ({ notifications: [] })),
        api.getMyReviews().catch(() => [])
      ]);
      setCategories(cats);
      setProviders(provs);
      setMyBookings(bks);
      setAddresses(addrs);
      setNotifications(notifs.notifications || []);
      setMyReviews(revs);

      // Default service address
      const def = addrs.find((a: Address) => a.isDefault);
      if (def) {
        setFormAddress(def.addressLine);
        setFormCity(def.city);
      }

      // Check for active ongoing request
      const ongoing = bks.find(b => ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION'].includes(b.status));
      if (ongoing) {
        setActiveBooking(ongoing);
      }
    } catch (err) {
      console.error('Failed to load initial customer data:', err);
    } finally {
      setIsLoadingInitialData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Initial Booking Passed From Props / Deep Link
  useEffect(() => {
    if (initialBookingId) {
      navigate('BookingProgressScreen', { requestId: initialBookingId });
      if (onClearInitialBooking) onClearInitialBooking();
    }
  }, [initialBookingId]);

  // Periodic poll to keep myBookings and activeBooking synchronized with provider actions
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const [bks, notifs] = await Promise.all([
          api.getServiceRequests(),
          api.getNotifications().catch(() => ({ notifications: [] }))
        ]);
        setMyBookings(bks);
        setNotifications(notifs.notifications || []);

        const ongoing = bks.find(b => ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION'].includes(b.status));
        if (ongoing) {
          setActiveBooking(ongoing);
        }
      } catch (err) {
        // Silent background sync
      }
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // ------------------- CHAT LOGIC FOR MESSAGES SCREEN -------------------

  const loadChatMessages = async (bookingId: string) => {
    try {
      const msgs = await api.getBookingMessages(bookingId);
      setChatMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (chatBookingId) {
      loadChatMessages(chatBookingId);
      const timer = setInterval(() => {
        loadChatMessages(chatBookingId);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [chatBookingId]);

  const handleSendChatMessage = async (customText?: string) => {
    const text = customText || chatInputText;
    if (!chatBookingId || !text.trim() || isSendingChat) return;
    setIsSendingChat(true);
    try {
      const msg = await api.sendBookingMessage(chatBookingId, text.trim());
      setChatMessages(prev => [...prev, msg]);
      setChatInputText('');
    } catch (err: any) {
      alert('Could not send message: ' + err.message);
    } finally {
      setIsSendingChat(false);
    }
  };

