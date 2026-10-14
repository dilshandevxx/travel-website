import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Address, UserNotificationPreferences, UserAppSettings } from '../../types';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Globe, 
  Shield, 
  HelpCircle, 
  Trash2, 
  Key, 
  MapPin, 
  Check, 
  AlertTriangle, 
  Plus, 
  Smartphone, 
  Info, 
  ChevronRight, 
  X,
  Phone,
  Mail,
  Lock
} from 'lucide-react';
import { ActionButton } from '../common/ActionButton';

interface Props {
  onBack: () => void;
  initialSubView?: 'main' | 'account' | 'notifications' | 'preferences' | 'privacy' | 'faq';
}

export const CustomerSettings: React.FC<Props> = ({ onBack, initialSubView = 'main' }) => {
  const { user, refreshMe, logout } = useAuth();

  // Settings State
  const [activeSubView, setActiveSubView] = useState<'main' | 'account' | 'notifications' | 'preferences' | 'privacy' | 'faq'>(initialSubView);

  // Account form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Address management states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newAddressCity, setNewAddressCity] = useState('Colombo 03');
  const [newAddressDistrict, setNewAddressDistrict] = useState('Colombo');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState<UserNotificationPreferences>({
    bookingStatus: user?.notificationPreferences?.bookingStatus ?? true,
    providerArrival: user?.notificationPreferences?.providerArrival ?? true,
    completionAndReview: user?.notificationPreferences?.completionAndReview ?? true,
    promotions: user?.notificationPreferences?.promotions ?? false,
    inAppAlerts: user?.notificationPreferences?.inAppAlerts ?? true,
    pushEnabled: user?.notificationPreferences?.pushEnabled ?? false
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // App Settings State
  const [appSettings, setAppSettings] = useState<UserAppSettings>({
    language: user?.appSettings?.language || 'en',
    theme: user?.appSettings?.theme || 'system',
    currency: 'LKR',
    locationPermission: user?.appSettings?.locationPermission ?? true,
    fontSize: user?.appSettings?.fontSize || 'normal'
  });
  const [isSavingAppSettings, setIsSavingAppSettings] = useState(false);

  // Delete account confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Success / error banner
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadAddresses = async () => {
    try {
      const res = await api.getAddresses();
      setAddresses(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.updateUserProfile({ name, phone });
      await refreshMe();
      showToast('Profile information updated successfully!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setIsChangingPass(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressLine || !newAddressCity) return;
    setIsSavingAddress(true);
    try {
      await api.addAddress({
        userId: user!.id,
        label: newAddressLabel,
        addressLine: newAddressLine,
        city: newAddressCity,
        district: newAddressDistrict,
        latitude: 6.9271,
        longitude: 79.8612,
        isDefault: addresses.length === 0
      });
      await loadAddresses();
      setShowAddAddress(false);
      setNewAddressLine('');
      showToast('Address saved successfully!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Set Default Address
  const handleSetDefaultAddress = async (id: string) => {
    try {
      await api.setDefaultAddress(id);
      await loadAddresses();
      showToast('Default address set!');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to remove this address?')) return;
    try {
      await api.deleteAddress(id);
      await loadAddresses();
      showToast('Address removed!');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Save Notification Preferences
  const handleToggleNotifPref = async (key: keyof UserNotificationPreferences) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    setIsSavingPrefs(true);
    try {
      await api.updateNotificationPreferences(updated);
      await refreshMe();
      showToast('Notification preference saved!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Save App Settings
  const handleUpdateAppSetting = async (key: keyof UserAppSettings, val: any) => {
    const updated = { ...appSettings, [key]: val };
    setAppSettings(updated);
    setIsSavingAppSettings(true);
    try {
      await api.updateAppSettings(updated);
      await refreshMe();
      showToast('App preference saved!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingAppSettings(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error');
      return;
    }
    setIsDeletingAccount(true);
    try {
      await api.deleteAccount('DELETE');
      alert('Your account has been permanently removed.');
      logout();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      
      {/* Header */}
      <div className="px-4 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs shrink-0">
        <button
          onClick={() => {
            if (activeSubView !== 'main') setActiveSubView('main');
            else onBack();
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{activeSubView === 'main' ? 'Profile' : 'Settings'}</span>
        </button>

        <h3 className="font-bold text-sm text-slate-900">
          {activeSubView === 'main' && 'App Settings'}
          {activeSubView === 'account' && 'Account & Security'}
          {activeSubView === 'notifications' && 'Notification Settings'}
          {activeSubView === 'preferences' && 'App Preferences'}
          {activeSubView === 'privacy' && 'Privacy & Terms'}
          {activeSubView === 'faq' && 'Help Centre & FAQs'}
        </h3>

        <div className="w-10" />
      </div>

      {/* Toast Alert */}
      {statusMessage && (
        <div className={`px-4 py-2 text-xs font-bold text-center ${
          statusMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        } transition animate-in fade-in`}>
          {statusMessage.text}
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* ==================== SUBVIEW: MAIN SETTINGS MENU ==================== */}
        {activeSubView === 'main' && (
          <div className="space-y-4">
            
            {/* Account Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Account & Addresses
              </div>

              <button
                onClick={() => setActiveSubView('account')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Personal Information</span>
                    <span className="text-[11px] text-slate-500">Edit name, phone, password & addresses</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
