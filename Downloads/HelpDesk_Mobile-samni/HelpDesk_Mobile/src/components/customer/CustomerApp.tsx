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
