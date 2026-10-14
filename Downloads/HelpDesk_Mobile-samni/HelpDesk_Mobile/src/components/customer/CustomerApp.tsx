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

  // ------------------- AI DIAGNOSIS -------------------

  const handleRunAiDiagnosis = async (textToAnalyze?: string) => {
    const text = textToAnalyze || formDescription;
    if (!text || text.trim().length === 0) return;
    setAiAnalyzing(true);
    try {
      const res = await api.classifyProblem(text);
      setAiResult(res);

      const matched = categories.find(c => 
        c.name.toLowerCase() === res.suggestedCategoryName.toLowerCase() || 
        c.id === res.suggestedCategoryId
      );
      if (matched) {
        setFormCategory(matched);
      }
      if (res.urgency === 'EMERGENCY') {
        setFormUrgency('EMERGENCY');
      }
      if (!formTitle) {
        setFormTitle(res.problemSummary);
      }
    } catch (err) {
      console.error('AI diagnosis error:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // ------------------- ADDRESS MANAGEMENT -------------------

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await api.setDefaultAddress(id);
      const updated = await api.getAddresses();
      setAddresses(updated);
      const def = updated.find(a => a.id === id);
      if (def) {
        setFormAddress(def.addressLine);
        setFormCity(def.city);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrLine || !newAddrCity) return;
    setIsSavingNewAddr(true);
    try {
      await api.addAddress({
        userId: user!.id,
        label: newAddrLabel,
        addressLine: newAddrLine,
        city: newAddrCity,
        district: 'Colombo',
        latitude: 6.9271,
        longitude: 79.8612,
        isDefault: addresses.length === 0
      });
      const updated = await api.getAddresses();
      setAddresses(updated);
      setShowAddAddressModal(false);
      setNewAddrLine('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingNewAddr(false);
    }
  };

  // ------------------- 1. FIX THE SUBMIT REQUEST BUTTON -------------------

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErrorMessage(null);

    // Step 1: Validate all required fields
    const errors: Record<string, string> = {};

    if (!formCategory) {
      errors.categoryId = 'Please select a skilled trade category';
    }

    if (!formTitle.trim()) {
      errors.title = 'Please enter a summary title for the problem';
    } else if (formTitle.trim().length < 4) {
      errors.title = 'Title must be at least 4 characters';
    }

    if (!formDescription.trim()) {
      errors.description = 'Please describe the issue in detail';
    } else if (formDescription.trim().length < 10) {
      errors.description = 'Please provide more details (minimum 10 characters)';
    }

    if (!formAddress.trim()) {
      errors.address = 'Service street address is required';
    }

    if (!formCity.trim()) {
      errors.city = 'City or service area is required';
    }

    if (!formDate) {
      errors.preferredDate = 'Please select your preferred service date';
    }

    // Step 2: If validation fails, show clear inline errors and remain on the form
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // Step 3: Prevent duplicate submissions by disabling the button
    setIsSubmittingRequest(true);

    try {
         // Step 4: Call the actual backend API to create the service request
      const payload = {
        categoryId: formCategory!.id,
        title: formTitle.trim(),
        description: formDescription.trim(),
        urgency: formUrgency,
        address: formAddress.trim(),
        city: formCity.trim(),
        district: 'Colombo',
        latitude: 6.9271,
        longitude: 79.8612,
        preferredDate: formDate,
        preferredTime: formTime,
        attachments: formPhotoUrl ? [{ id: 'att-user', url: formPhotoUrl, type: 'image', caption: 'Customer attached photo' }] : [],
        providerId: formDirectProvider?.id || undefined
      };

      const newBooking = await api.createServiceRequest(payload);

      // Step 7: Extract the real booking ID and returned request data
      if (!newBooking || !newBooking.id) {
        throw new Error('Backend failed to return a valid booking ID');
      }

      // Step 8: Save/update the app's booking state
      setActiveBooking(newBooking);
      setMyBookings(prev => [newBooking, ...prev.filter(b => b.id !== newBooking.id)]);

      // Clear the form fields
      setFormTitle('');
      setFormDescription('');
      setFormPhotoUrl('');
      setAiResult(null);
      setFormDirectProvider(null);

      // Step 9: Navigate to the active booking progress screen using the real booking ID
      navigate('BookingProgressScreen', { requestId: newBooking.id });

    } catch (err: any) {
      // Step 6: Handle API errors without navigating to a fake success screen
      console.error('Request submission failed:', err);
      setSubmitErrorMessage(err.message || 'Could not submit request. Please check connection and try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // ------------------- SCREEN RENDERING ROUTER -------------------

  const getScreenTitle = (): string => {
    switch (currentRoute.name) {
      case 'CreateServiceRequestScreen':
        return 'Request a Service';
      case 'BookingHistoryScreen':
        return 'My Bookings';
      case 'NotificationsScreen':
        return 'Notifications';
      case 'MessagesScreen':
        return 'Messages';
      case 'ProfileScreen':
        return 'My Profile';
      case 'SettingsScreen':
        return 'Settings';
      case 'ProviderDetailsScreen':
        return 'Technician Profile';
      case 'BookingProgressScreen':
      case 'BookingProgress':
        return 'Live Service Tracking';
      default:
        return 'HelpDesk';
    }
  };

  const activeTab = getActiveTab();

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Global Mobile Header (Hidden when inside full-screen BookingProgressScreen) */}
      {currentRoute.name !== 'BookingProgressScreen' && currentRoute.name !== 'BookingProgress' && (
        <CustomerMobileHeader
          screenTitle={getScreenTitle()}
          canGoBack={routeStack.length > 1 && currentRoute.name !== 'HomeScreen'}
          onGoBack={goBack}
          onOpenNotifications={() => navigate('NotificationsScreen')}
          onOpenProfile={() => navigate('ProfileScreen')}
          greeting={`Good day, ${user?.name ? user.name.split(' ')[0] : 'there'}`}
          serviceAddress={formAddress}
          onAddressClick={() => setShowAddAddressModal(true)}
          isHomeScreen={currentRoute.name === 'HomeScreen'}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">

        {/* ========================================================
            SCREEN 1: HomeScreen
           ======================================================== */}
        {currentRoute.name === 'HomeScreen' && (
          <div className="p-4 space-y-4">

            {/* Real-time Active Booking Banner (PickMe-style ongoing ride bar) */}
              {activeBooking && ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION'].includes(activeBooking.status) && (
                <div 
                  onClick={() => navigate('BookingProgressScreen', { requestId: activeBooking.id })}
                  className="bg-gradient-to-r from-blue-700 via-indigo-800 to-blue-900 text-white p-4 rounded-3xl shadow-md cursor-pointer hover:opacity-95 transition flex items-center justify-between animate-in fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center animate-pulse">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping inline-block" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                          {activeBooking.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[190px]">
                        {activeBooking.title}
                      </h4>
                      <p className="text-[11px] text-blue-200 font-mono">{activeBooking.bookingReference}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-teal-300">
                    <span>Track</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Fast Problem Search & AI Diagnostic Box */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    What service do you need?
                  </h3>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                    Fast Dispatch
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={homeSearchQuery}
                    onChange={(e) => setHomeSearchQuery(e.target.value)}
                    placeholder="e.g. Water leak under sink, power tripping, AC service..."
                    className="w-full pl-3 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!homeSearchQuery) return;
                      handleRunAiDiagnosis(homeSearchQuery);
                      navigate('CreateServiceRequestScreen', { prefillDescription: homeSearchQuery });
                    }}
                    className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    AI Triage
                  </button>
                </div>

                {/* Common quick request chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    'Sink pipe leaking water',
                    'Main breaker trips with fan',
                    'AC blowing warm air',
                    'Door lock cylinder jammed'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        handleRunAiDiagnosis(preset);
                        navigate('CreateServiceRequestScreen', { prefillDescription: preset });
                      }}
                      className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 transition"
                    >
                      "{preset}"
                    </button>
                  ))}
                </div>

                {/* Emergency Dispatch Button */}
                <button
                  type="button"
                  onClick={() => navigate('CreateServiceRequestScreen', { prefillUrgency: 'EMERGENCY' })}
                  className="w-full p-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl shadow-xs font-bold text-xs flex items-center justify-between hover:opacity-95 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚨</span>
                    <div className="text-left">
                      <span className="block font-bold">Need Emergency Dispatch?</span>
                      <span className="text-[10px] text-orange-100 block">Burst pipes, total power outages, electrical sparks</span>
                    </div>
                  </div>
                  <span className="bg-white text-orange-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                    ASAP
                  </span>
                </button>
              </div>

              {/* Service Categories Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    All Skilled Trades ({categories.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">Verified Colombo Technicians</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => navigate('CreateServiceRequestScreen', { preselectedCategoryId: cat.id })}
                      className="flex flex-col items-center p-2.5 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 hover:border-blue-400 text-center transition group shadow-xs"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                        <CategoryIcon name={cat.iconName} className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">
                        {cat.name}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5">
                        Rs. {cat.baseCalloutFeeLkr}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified Technicians Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Top Verified Technicians
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ID Verified
                  </span>
                </div>

                <div className="space-y-2">
                  {providers.slice(0, 4).map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => navigate('ProviderDetailsScreen', { providerId: p.id })}
                      className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-800 text-sm overflow-hidden">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            p.name?.charAt(0) || 'P'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <span className="text-[11px] text-slate-500 block">{p.businessName || 'Certified Technician'}</span>
                          <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {p.rating || 4.9} ({p.reviewCount || 10}) • {p.completedJobsCount || 35} jobs
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-blue-600 block">
                          Rs. {p.calloutFeeLkr || 1500}
                        </span>
                        <span className="text-[10px] text-slate-400">Callout</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              SCREEN 2: CreateServiceRequestScreen
             ======================================================== */}
          {currentRoute.name === 'CreateServiceRequestScreen' && (
            <div className="p-4 space-y-4">

              {/* Direct Booking Notice */}
              {formDirectProvider && (
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-xs">
                      {formDirectProvider.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-500 font-bold block uppercase">Direct Booking To:</span>
                      <span className="text-xs font-bold text-blue-900">{formDirectProvider.name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormDirectProvider(null)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Global Error Banner */}
              {submitErrorMessage && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-2xl flex items-start gap-2 text-xs text-red-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Submission Error</span>
                    <span>{submitErrorMessage}</span>
                  </div>
                </div>
              )}

              {/* AI Diagnosis Result */}
              {aiResult && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 p-3.5 rounded-2xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      AI Problem Triage
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      {aiResult.suggestedCategoryName}
                    </span>
                  </div>

                  <p className="text-xs text-indigo-900 font-medium">
                    "{aiResult.problemSummary}"
                  </p>

                  {aiResult.safetyWarning && (
                    <div className="bg-amber-100/90 border border-amber-300 p-2 rounded-xl flex items-start gap-2 text-amber-900 text-[11px] leading-tight">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Safety Warning: </strong>
                        {aiResult.safetyWarning}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* The Request Form */}
              <form onSubmit={handleSubmitRequest} className="space-y-3.5">
                
                {/* 1. Service Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Service Trade Category *
                  </label>
                  <select
                    value={formCategory?.id || ''}
                    onChange={(e) => {
                      const cat = categories.find(c => c.id === e.target.value);
                      setFormCategory(cat || null);
                      if (formErrors.categoryId) {
                        setFormErrors(prev => ({ ...prev, categoryId: '' }));
                      }
                    }}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                      formErrors.categoryId 
                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20' 
                        : 'border-slate-300 focus:ring-blue-600'
                    }`}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Base Callout: Rs. {c.baseCalloutFeeLkr})
                      </option>
                    ))}
                  </select>
                  {formErrors.categoryId && (
                    <p className="text-red-500 text-[11px] font-medium mt-1">{formErrors.categoryId}</p>
                  )}
                </div>

                {/* 2. Urgency Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Urgency Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormUrgency('NORMAL')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        formUrgency === 'NORMAL'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <Clock className="w-4 h-4" /> Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormUrgency('EMERGENCY')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        formUrgency === 'EMERGENCY'
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-white text-orange-600 border-orange-200'
                      }`}
                    >
                      <span>🚨</span> Emergency (1.5x)
                    </button>
                  </div>
                </div>
                
                {/* 3. Problem Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Problem Summary / Title *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      if (formErrors.title) {
                        setFormErrors(prev => ({ ...prev, title: '' }));
                      }
                    }}
                    placeholder="e.g. Kitchen tap siphon leaking into cabinet"
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                      formErrors.title 
                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20' 
                        : 'border-slate-300 focus:ring-blue-600'
                    }`}
                  />
                  {formErrors.title && (
                    <p className="text-red-500 text-[11px] font-medium mt-1">{formErrors.title}</p>
                  )}
                </div>

                {/* 4. Problem Details */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      Problem Details *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRunAiDiagnosis()}
                      disabled={aiAnalyzing || !formDescription}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                      AI Diagnose
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => {
                      setFormDescription(e.target.value);
                      if (formErrors.description) {
                        setFormErrors(prev => ({ ...prev, description: '' }));
                      }
                    }}
                    placeholder="Describe the issue, any unusual sounds, smells, or access instructions..."
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                      formErrors.description 
                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20' 
                        : 'border-slate-300 focus:ring-blue-600'
                    }`}
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-[11px] font-medium mt-1">{formErrors.description}</p>
                  )}
                </div>

                {/* 5. Photo Attachment */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Photo Attachment (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormPhotoUrl('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80');
                      }}
                      className="flex-1 py-2 px-3 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>{formPhotoUrl ? 'Photo Attached ✓' : 'Attach Sample Photo'}</span>
                    </button>
                    {formPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormPhotoUrl('')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 6. Service Address & City */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Address *</label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => {
                        setFormAddress(e.target.value);
                        if (formErrors.address) {
                          setFormErrors(prev => ({ ...prev, address: '' }));
                        }
                      }}
                      className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-slate-900 ${
                        formErrors.address ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.address && (
                      <p className="text-red-500 text-[11px] font-medium mt-1">{formErrors.address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">City / Area *</label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => {
                        setFormCity(e.target.value);
                        if (formErrors.city) {
                          setFormErrors(prev => ({ ...prev, city: '' }));
                        }
                      }}
                      className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-slate-900 ${
                        formErrors.city ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.city && (
                      <p className="text-red-500 text-[11px] font-medium mt-1">{formErrors.city}</p>
                    )}
                  </div>
                </div>

                {/* 7. Preferred Date & Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Preferred Date *</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Preferred Time</label>
                    <select
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                    >
                      <option value="ASAP / Next available">ASAP / Next available</option>
                      <option value="Morning (8:00 AM - 12:00 PM)">Morning (8 AM - 12 PM)</option>
                      <option value="Afternoon (12:00 PM - 4:00 PM)">Afternoon (12 PM - 4 PM)</option>
                      <option value="Evening (4:00 PM - 8:00 PM)">Evening (4 PM - 8 PM)</option>
                    </select>
                  </div>
                </div>

                {/* Transparent Price Estimate */}
                <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                    Transparent Price Estimate
                  </span>
                  <div className="flex justify-between text-slate-600">
                    <span>Base Callout Fee:</span>
                    <span className="font-semibold text-slate-900">
                      Rs. {formCategory ? (formUrgency === 'EMERGENCY' ? Math.round(formCategory.baseCalloutFeeLkr * formCategory.emergencyMultiplier) : formCategory.baseCalloutFeeLkr) : 1500}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Hourly Labor Rate:</span>
                    <span className="font-semibold text-slate-900">Rs. {formCategory?.typicalHourlyRateLkr || 1200}/hr</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic pt-1">
                    * Final invoice will be calculated upon completion. Any additional replacement parts will be proposed for your explicit sign-off before charging.
                  </p>
                </div>

                {/* Submit Request Button */}
                <ActionButton
                  type="submit"
                  isLoading={isSubmittingRequest}
                  loadingLabel="Submitting your request..."
                  label="Submit Request"
                  size="lg"
                  variant="primary"
                />
              </form>
            </div>
          )}

          {/* ========================================================
              SCREEN 3: BookingProgressScreen (PickMe Progress Flow)
             ======================================================== */}
          {(currentRoute.name === 'BookingProgressScreen' || currentRoute.name === 'BookingProgress') && (
            <div className="flex-1 flex flex-col h-full">
              <BookingProgressScreen
                requestId={(currentRoute.params as any).requestId}
                onBack={goBack}
                onOpenChat={(bId) => {
                  setChatBookingId(bId);
                  navigate('MessagesScreen', { bookingId: bId });
                }}
                onBookingUpdated={(b) => {
                  setActiveBooking(b);
                  loadData();
                }}
                onReturnHome={() => navigate('HomeScreen')}
                onBookAnother={() => navigate('CreateServiceRequestScreen')}
              />
            </div>
          )}

          {/* ========================================================
              SCREEN 4: BookingHistoryScreen (My Jobs)
             ======================================================== */}
          {currentRoute.name === 'BookingHistoryScreen' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>All recorded service jobs</span>
                <span className="font-semibold text-slate-700">{myBookings.length} bookings</span>
              </div>

              {/* Filter Sub-Tabs */}
              <div className="flex bg-slate-200 p-1 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => setJobsFilter('active')}
                  className={`flex-1 py-1.5 rounded-xl transition ${
                    jobsFilter === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Active ({myBookings.filter(b => ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION'].includes(b.status)).length})
                </button>
                <button
                  onClick={() => setJobsFilter('completed')}
                  className={`flex-1 py-1.5 rounded-xl transition ${
                    jobsFilter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Completed ({myBookings.filter(b => b.status === 'COMPLETED').length})
                </button>
                <button
                  onClick={() => setJobsFilter('cancelled')}
                  className={`flex-1 py-1.5 rounded-xl transition ${
                    jobsFilter === 'cancelled' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Cancelled ({myBookings.filter(b => b.status === 'CANCELLED').length})
                </button>
              </div>

              {/* Booking List */}
              <div className="space-y-2.5">
                {(() => {
                  const filtered = myBookings.filter(b => {
                    if (jobsFilter === 'active') return ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION'].includes(b.status);
                    if (jobsFilter === 'completed') return b.status === 'COMPLETED';
                    if (jobsFilter === 'cancelled') return b.status === 'CANCELLED';
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-16 text-center text-slate-400 space-y-2">
                        <Briefcase className="w-12 h-12 mx-auto text-slate-300" />
                        <p className="font-bold text-slate-700 text-sm">No {jobsFilter} service requests</p>
                        <p className="text-xs text-slate-400">Tap below to request skilled home help in Colombo.</p>
                        <button
                          onClick={() => navigate('CreateServiceRequestScreen')}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                        >
                          Request a Service
                        </button>
                      </div>
                    );
                  }

                  return filtered.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => navigate('BookingProgressScreen', { requestId: b.id })}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{b.bookingReference}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          b.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate">{b.title}</h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>{new Date(b.createdAt).toLocaleDateString()} • {b.city}</span>
                        <span className="font-bold text-slate-900">Rs. {b.totalAmountLkr?.toLocaleString()}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* ========================================================
              SCREEN 5: NotificationsScreen
             ======================================================== */}
          {currentRoute.name === 'NotificationsScreen' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-slate-500 font-medium">
                  {notifications.filter(n => !n.isRead).length} unread updates
                </span>
                {notifications.some(n => !n.isRead) && (
                  <button
                    onClick={async () => {
                      for (const n of notifications.filter(x => !x.isRead)) {
                        await api.markNotificationAsRead(n.id).catch(() => {});
                      }
                      const notifs = await api.getNotifications().catch(() => ({ notifications: [] }));
                      setNotifications(notifs.notifications || []);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Mark All Read
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No notifications yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">You'll receive live status alerts when jobs are updated.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={async () => {
                        if (!n.isRead) {
                          await api.markNotificationAsRead(n.id).catch(() => {});
                          n.isRead = true;
                          setNotifications([...notifications]);
                        }
                        if (n.bookingId) {
                          navigate('BookingProgressScreen', { requestId: n.bookingId });
                        }
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                        !n.isRead ? 'bg-blue-50/80 border-blue-200 shadow-2xs' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className={`p-2 rounded-xl border shrink-0 ${
                        n.type === 'BOOKING_UPDATE' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        n.type === 'REVIEW' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {n.type === 'BOOKING_UPDATE' ? <CheckCircle2 className="w-4 h-4" /> :
                         n.type === 'REVIEW' ? <Star className="w-4 h-4 fill-amber-500" /> :
                         <Bell className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                        {n.bookingId && (
                          <span className="inline-block mt-1 text-[10px] text-blue-600 font-bold hover:underline">
                            Track Booking →
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              SCREEN 6: MessagesScreen
             ======================================================== */}
          {currentRoute.name === 'MessagesScreen' && (
            <div className="flex-1 flex flex-col h-full bg-slate-50">
              
              {/* Messages Header */}
              <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900">Technician Chat</h3>
                </div>

                {chatBookingId && (
                  <button
                    onClick={() => navigate('BookingProgressScreen', { requestId: chatBookingId })}
                    className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View Live Tracker</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Booking Selector Chips if user has multiple bookings */}
              {myBookings.length > 0 && (
                <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                  {myBookings.slice(0, 5).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setChatBookingId(b.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 transition ${
                        chatBookingId === b.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {b.bookingReference} • {b.title.slice(0, 15)}...
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Thread */}
              {chatBookingId ? (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Messages Bubble List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">Start a conversation with your technician</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Share gate directions, landmark details, or ask about required replacement parts.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMe = msg.senderRole === 'CUSTOMER';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] font-bold text-slate-500">
                                {isMe ? 'You' : msg.senderName}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div
                              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                isMe
                                  ? 'bg-blue-600 text-white rounded-tr-xs'
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Suggestion Chips */}
                  <div className="px-3 py-1.5 bg-white border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                    {[
                      "I'm waiting at the gate",
                      "Main water valve is shut off",
                      "Please call when you are near",
                      "House is #45/2 Galle Road",
                      "Let me know if parts are needed"
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendChatMessage(chip)}
                        className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 shrink-0 transition"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Message Input Box */}
                  <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChatMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        placeholder="Type a message to your technician..."
                        className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        type="submit"
                        disabled={isSendingChat || !chatInputText.trim()}
                        className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition"
                        title="Send Message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <Briefcase className="w-12 h-12 text-slate-300 mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">No Booking Selected</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Direct messaging is active when you submit or have an active service booking.
                  </p>
                  <button
                    onClick={() => navigate('CreateServiceRequestScreen')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    Request a Service
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              SCREEN 7: ProfileScreen
             ======================================================== */}
          {currentRoute.name === 'ProfileScreen' && (
            <div className="p-4 space-y-4">
              
              {/* User Identity Card */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-800 text-lg overflow-hidden">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || 'C'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900">{user?.name}</h3>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xs text-slate-500 block">{user?.email}</span>
                    <span className="text-xs text-blue-600 font-semibold">{user?.phone}</span>
                    <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-md font-bold mt-1">
                      Active Customer • Verified Account
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('SettingsScreen', { initialSubView: 'account' })}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition"
                >
                  Edit
                </button>
              </div>

              {/* Saved Addresses Section */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Saved Service Addresses ({addresses.length})
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowAddAddressModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Address
                  </button>
                </div>

                <div className="space-y-2">
                  {addresses.length === 0 ? (
                    <p className="text-xs text-slate-400">No saved addresses. Tap "+ Add Address" to save your home or office.</p>
                  ) : (
                    addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-3 rounded-2xl border transition flex items-start justify-between gap-2 ${
                          addr.isDefault ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.2 rounded-md">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 truncate">{addr.addressLine}</p>
                          <span className="text-[11px] text-slate-400">{addr.city}, {addr.district}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              Make Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* My Reviews Section */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    My Submitted Reviews ({myReviews.length})
                  </span>
                </div>
                {myReviews.length === 0 ? (
                  <span className="text-xs text-slate-400 block">No reviews submitted yet. Rate technicians after service completion.</span>
                ) : (
                  myReviews.map((r: any) => (
                    <div key={r.id} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{r.providerName || 'Technician'}</span>
                        <span className="text-amber-600">⭐ {r.rating}/5</span>
                      </div>
                      <p className="text-slate-600 italic">"{r.comment}"</p>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Settings, Support, and Legal Actions Menu */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden text-xs">
                
                {/* Multi-role Mode Switch if authorized */}
                {(user?.roles?.includes('PROVIDER') || user?.role === 'PROVIDER') && (
                  <button
                    onClick={async () => {
                      try {
                        await switchMode('PROVIDER');
                        if (onSwitchToProviderMode) {
                          onSwitchToProviderMode();
                        }
                      } catch (err: any) {
                        alert('Switch mode error: ' + err.message);
                      }
                    }}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-teal-50 bg-teal-50/40 text-teal-800 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4 text-teal-600" />
                      <div>
                        <span className="font-bold text-slate-900 block">Switch to Provider Mode</span>
                        <span className="text-[11px] text-teal-700">Access technician dispatch & job radar</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-teal-600" />
                  </button>
                )}

                {/* Dedicated Settings Screen Option */}
                <button
                  onClick={() => navigate('SettingsScreen', { initialSubView: 'main' })}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-900 block">App Settings & Preferences</span>
                      <span className="text-[11px] text-slate-500">Security, push alerts, languages & font size</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Help Centre Option */}
                <button
                  onClick={() => navigate('SettingsScreen', { initialSubView: 'faq' })}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="font-bold text-slate-900 block">Help & Support Centre</span>
                      <span className="text-[11px] text-slate-500">Hotline +94 11 234 5678 • FAQs & Mediation</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Privacy Policy & Terms */}
                <button
                  onClick={() => navigate('SettingsScreen', { initialSubView: 'privacy' })}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="font-bold text-slate-900 block">Privacy Policy & Terms</span>
                      <span className="text-[11px] text-slate-500">Sri Lanka home-service pricing terms & guarantees</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Admin Web Portal link */}
                {onOpenAdminPortal && (
                  <button
                    onClick={onOpenAdminPortal}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-purple-50 text-purple-700 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="font-bold text-slate-900 block">Admin Web Portal</span>
                        <span className="text-[11px] text-purple-600">Desktop operations & provider verification console</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </button>
                )}

                {/* Sign Out Button */}
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to sign out from your HelpDesk customer account?')) {
                      logout();
                    }
                  }}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-red-50 text-red-600 transition"
                >
                  <div className="flex items-center gap-2.5 font-bold">
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Sign Out</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </button>
              </div>

              <div className="text-center text-[11px] text-slate-400 pt-1 pb-2">
                HelpDesk Sri Lanka • Customer v2.5.0
              </div>
            </div>
          )}

          {/* ========================================================
              SCREEN 8: SettingsScreen
             ======================================================== */}
          {currentRoute.name === 'SettingsScreen' && (
            <div className="flex-1 flex flex-col h-full">
              <CustomerSettings 
                onBack={goBack} 
                initialSubView={(currentRoute.params as any)?.initialSubView || 'main'} 
              />
            </div>
          )}

          {/* ========================================================
              SCREEN 9: ProviderDetailsScreen
             ======================================================== */}
          {currentRoute.name === 'ProviderDetailsScreen' && (
            <div className="p-4 space-y-4">
              {(() => {
                const provId = (currentRoute.params as any).providerId;
                const p = providers.find(item => item.id === provId) as any;
                if (!p) {
                  return (
                    <div className="py-12 text-center text-slate-400">
                      <p>Provider profile not found.</p>
                      <button onClick={goBack} className="mt-2 text-blue-600 text-xs font-bold">Go Back</button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center font-bold text-blue-800 text-xl overflow-hidden">
                          {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" /> : p.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          </div>
                          <span className="text-xs text-slate-500 block">{p.businessName || 'Certified Technician'}</span>
                          <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5 mt-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {p.rating || 4.9} ({p.reviewCount || 10} customer reviews)
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                        {p.bio || 'Experienced trade professional certified in home repairs and maintenance.'}
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Base Callout</span>
                          <span className="font-extrabold text-blue-600 text-sm">Rs. {p.calloutFeeLkr || 1500}</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Hourly Rate</span>
                          <span className="font-extrabold text-slate-800 text-sm">Rs. {p.baseRateLkr || 1200}/hr</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setFormDirectProvider(p);
                          navigate('CreateServiceRequestScreen', { directProviderId: p.id });
                        }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
                      >
                        Book {p.name} Directly
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>

        {/* Global Bottom Tab Bar Navigation (5 Tabs: Home, My Jobs, Messages, Notifications, Profile) */}
        <div className="bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-sm shrink-0 z-20">
          
          {/* Tab 1: Home */}
          <button
            onClick={() => navigate('HomeScreen')}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold transition ${
              activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'home' ? 'bg-blue-50' : ''}`}>
              <Wrench className="w-4 h-4" />
            </div>
            <span>Home</span>
          </button>

          {/* Tab 2: My Jobs */}
          <button
            onClick={() => navigate('BookingHistoryScreen')}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold transition ${
              activeTab === 'jobs' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'jobs' ? 'bg-blue-50' : ''}`}>
              <Briefcase className="w-4 h-4" />
            </div>
            <span>My Jobs</span>
          </button>

          {/* Tab 3: Messages */}
          <button
            onClick={() => {
              if (activeBooking) {
                setChatBookingId(activeBooking.id);
              } else if (myBookings.length > 0) {
                setChatBookingId(myBookings[0].id);
              }
              navigate('MessagesScreen');
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold transition ${
              activeTab === 'messages' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'messages' ? 'bg-blue-50' : ''}`}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <span>Messages</span>
          </button>

          {/* Tab 4: Notifications */}
          <button
            onClick={() => navigate('NotificationsScreen')}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold transition relative ${
              activeTab === 'notifications' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl relative ${activeTab === 'notifications' ? 'bg-blue-50' : ''}`}>
              <Bell className="w-4 h-4" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </div>
            <span>Notifications</span>
          </button>

          {/* Tab 5: Profile */}
          <button
            onClick={() => navigate('ProfileScreen')}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold transition ${
              activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'profile' ? 'bg-blue-50' : ''}`}>
              <UserIcon className="w-4 h-4" />
            </div>
            <span>Profile</span>
          </button>
        </div>

        {/* ==================== ADD ADDRESS MODAL ==================== */}
        {showAddAddressModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Save New Address
                </h3>
                <button onClick={() => setShowAddAddressModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Address Label</label>
                  <select
                    value={newAddrLabel}
                    onChange={(e) => setNewAddrLabel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    <option value="Home">Home</option>
                    <option value="Work / Office">Work / Office</option>
                    <option value="Parents House">Parents House</option>
                    <option value="Rental Property">Rental Property</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={newAddrLine}
                    onChange={(e) => setNewAddrLine(e.target.value)}
                    placeholder="e.g. 12/4 Duplication Road"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">City / Postal Zone</label>
                  <input
                    type="text"
                    value={newAddrCity}
                    onChange={(e) => setNewAddrCity(e.target.value)}
                    placeholder="e.g. Colombo 04 / Bambalapitiya"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddressModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingNewAddr}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                  >
                    {isSavingNewAddr ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};
