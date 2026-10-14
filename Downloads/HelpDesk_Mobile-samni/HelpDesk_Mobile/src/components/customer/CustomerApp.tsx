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
