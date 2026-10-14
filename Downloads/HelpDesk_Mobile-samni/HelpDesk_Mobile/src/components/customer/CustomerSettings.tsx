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

            {/* Notifications Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Notifications
              </div>

              <button
                onClick={() => setActiveSubView('notifications')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Notification Preferences</span>
                    <span className="text-[11px] text-slate-500">Job alerts, technician arrival & promotions</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* App Preferences Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Preferences
              </div>

              <button
                onClick={() => setActiveSubView('preferences')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Language & Theme</span>
                    <span className="text-[11px] text-slate-500">English / Sinhala / Tamil, theme & font size</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Support & Privacy */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Support & Legal
              </div>

              <button
                onClick={() => setActiveSubView('faq')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Help Centre & FAQs</span>
                    <span className="text-[11px] text-slate-500">Pricing rules, callout policy & emergency help</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSubView('privacy')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Privacy Policy & Terms</span>
                    <span className="text-[11px] text-slate-500">Sri Lanka home-services terms of use</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* App Version Info */}
            <div className="pt-2 text-center text-slate-400 text-[11px] space-y-0.5">
              <p className="font-semibold text-slate-500">HelpDesk Sri Lanka • v2.4.0 (Build 2026.10)</p>
              <p>Designed for Colombo, Kandy, Gampaha & Galle</p>
            </div>
          </div>
        )}

        {/* ==================== SUBVIEW: ACCOUNT & SECURITY ==================== */}
        {activeSubView === 'account' && (
          <div className="space-y-4">
            
            {/* Edit Personal Info Form */}
            <form onSubmit={handleSaveProfile} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Personal Information
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Phone Number (+94)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <ActionButton
                type="submit"
                isLoading={isSavingProfile}
                loadingLabel="Saving changes..."
                label="Save Profile Changes"
                variant="primary"
                size="md"
              />
            </form>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Account Security & Password
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <ActionButton
                type="submit"
                isLoading={isChangingPass}
                loadingLabel="Updating password..."
                label="Update Password"
                variant="secondary"
                size="md"
              />
            </form>

            {/* Manage Saved Addresses */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Saved Service Addresses ({addresses.length})
                </h4>
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Address
                </button>
              </div>

              <div className="space-y-2">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{a.label}</span>
                        {a.isDefault && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-md font-bold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{a.addressLine}</p>
                      <span className="text-[11px] text-slate-400">{a.city}, {a.district}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!a.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(a.id)}
                          className="text-[11px] text-blue-600 font-bold hover:underline"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(a.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        title="Remove address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delete Account Danger Zone */}
            <div className="bg-red-50 p-4 rounded-2xl border border-red-200 space-y-2">
              <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider">
                Danger Zone
              </h4>
              <p className="text-xs text-red-700 leading-relaxed">
                Permanently delete your HelpDesk account, booking history, and stored preferences.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Request Account Deletion
              </button>
            </div>

          </div>
        )}

        {/* ==================== SUBVIEW: NOTIFICATION PREFERENCES ==================== */}
        {activeSubView === 'notifications' && (
          <div className="space-y-4">
            
            {/* Push notification banner */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">In-App Notifications Active: </strong>
                Foreground booking alerts and radar updates update in real-time. Background device push notifications require device FCM credentials.
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden text-xs">
              
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Booking Status Updates</span>
                  <span className="text-[11px] text-slate-500">Receive alerts when status changes to Accepted or In-Progress</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.bookingStatus}
                  onChange={() => handleToggleNotifPref('bookingStatus')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Technician Arrival Alerts</span>
                  <span className="text-[11px] text-slate-500">Notifies when provider taps 'On The Way' or 'Arrived'</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.providerArrival}
                  onChange={() => handleToggleNotifPref('providerArrival')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Completion & Review Reminders</span>
                  <span className="text-[11px] text-slate-500">Prompt to inspect completed repairs and rate technician</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.completionAndReview}
                  onChange={() => handleToggleNotifPref('completionAndReview')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Promotions & Home Tips</span>
                  <span className="text-[11px] text-slate-500">Seasonal AC servicing reminders & plumbing safety tips</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.promotions}
                  onChange={() => handleToggleNotifPref('promotions')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">In-App Notification Center Badge</span>
                  <span className="text-[11px] text-slate-500">Display unread badge counter in header navigation</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.inAppAlerts}
                  onChange={() => handleToggleNotifPref('inAppAlerts')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Changes are saved instantly and synchronized across devices.
            </p>
          </div>
        )}

        {/* ==================== SUBVIEW: APP PREFERENCES ==================== */}
        {activeSubView === 'preferences' && (
          <div className="space-y-4">
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden text-xs">
              
              {/* Language */}
              <div className="p-4 space-y-2">
                <span className="font-bold text-slate-900 block">Display Language</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'si', label: 'සිංහල (Sinhala)' },
                    { code: 'ta', label: 'தமிழ் (Tamil)' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleUpdateAppSetting('language', lang.code)}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                        appSettings.language === lang.code
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="p-4 space-y-2">
                <span className="font-bold text-slate-900 block">App Theme</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'system', label: 'System' },
                    { key: 'light', label: 'Light' },
                    { key: 'dark', label: 'Dark' }
                  ].map((theme) => (
                    <button
                      key={theme.key}
                      onClick={() => handleUpdateAppSetting('theme', theme.key)}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                        appSettings.theme === theme.key
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Billing Currency</span>
                  <span className="text-[11px] text-slate-500">Fixed to Sri Lankan Rupee (LKR)</span>
                </div>
                <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  LKR (Rs.)
                </span>
              </div>

              {/* Font Size Accessibility */}
              <div className="p-4 space-y-2">
                <span className="font-bold text-slate-900 block">Text Size Accessibility</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateAppSetting('fontSize', 'normal')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                      appSettings.fontSize === 'normal'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Standard Size
                  </button>
                  <button
                    onClick={() => handleUpdateAppSetting('fontSize', 'large')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                      appSettings.fontSize === 'large'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Large / Accessible
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== SUBVIEW: HELP CENTRE & FAQ ==================== */}
        {activeSubView === 'faq' && (
          <div className="space-y-4">
            
            {/* Contact Hotline */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 rounded-2xl shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">HelpDesk Sri Lanka Support</span>
              <h3 className="text-base font-extrabold">24/7 Home-Services Assistance</h3>
              <div className="flex items-center gap-4 pt-1 text-xs text-blue-100">
                <a href="tel:+94112345678" className="flex items-center gap-1 font-bold underline">
                  <Phone className="w-3.5 h-3.5" /> +94 11 234 5678
                </a>
                <a href="mailto:support@helpdesk.lk" className="flex items-center gap-1 underline">
                  <Mail className="w-3.5 h-3.5" /> support@helpdesk.lk
                </a>
              </div>
            </div>

            {/* FAQs Accordion Cards */}
            <div className="space-y-2.5 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">What is the Callout Fee and how is it calculated?</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  The callout fee covers the qualified technician's transport, initial on-site technical inspection, and diagnostic testing. Base fees start from Rs. 1,500 depending on category. For emergency dispatches, a 1.5x multiplier applies.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">How do Additional Charge Proposals work?</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  If replacement pipes, breakers, or unforeseen parts are needed, the technician sends a proposal directly to your app. The extra cost will only be added to your invoice after you click "Approve".
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">What happens if I am not satisfied with the repair?</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Do not confirm completion until you have tested the repair. You can tap "Report Issue" to immediately escalate a complaint to our Colombo administration team for mediation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUBVIEW: PRIVACY & TERMS ==================== */}
        {activeSubView === 'privacy' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 text-xs leading-relaxed text-slate-700">
              <h4 className="font-bold text-slate-900 text-sm">Privacy Policy & Platform Terms</h4>
              
              <p>
                HelpDesk Sri Lanka complies with domestic digital privacy best practices. Your exact GPS coordinates and residential address are only revealed to an assigned technician after a booking is confirmed.
              </p>

              <h5 className="font-bold text-slate-800">1. Verification & Identity</h5>
              <p className="text-[11px]">
                Technicians undergo identity document review, skills certification checking, and police clearance inspection before being granted access to customer jobs.
              </p>

              <h5 className="font-bold text-slate-800">2. Transparent Pricing Guarantee</h5>
              <p className="text-[11px]">
                All labor rates, callout fees, and material charges are itemized in Sri Lankan Rupees (LKR). Hidden markups or unapproved extra charges are strictly prohibited.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ==================== MODAL: ADD ADDRESS ==================== */}
      {showAddAddress && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add New Address</h3>
              <button onClick={() => setShowAddAddress(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Label</label>
                <select
                  value={newAddressLabel}
                  onChange={(e) => setNewAddressLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Villa">Villa / Property</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Address Line *</label>
                <input
                  type="text"
                  value={newAddressLine}
                  onChange={(e) => setNewAddressLine(e.target.value)}
                  placeholder="e.g. 15/4 Duplication Road"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">City / Area *</label>
                  <input
                    type="text"
                    value={newAddressCity}
                    onChange={(e) => setNewAddressCity(e.target.value)}
                    required
                    placeholder="e.g. Colombo 03"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">District</label>
                  <select
                    value={newAddressDistrict}
                    onChange={(e) => setNewAddressDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    <option value="Colombo">Colombo</option>
                    <option value="Gampaha">Gampaha</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Kalutara">Kalutara</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="flex-1 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {isSavingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DELETE ACCOUNT ==================== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-red-200 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Confirm Account Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                This action cannot be undone. All active requests and address records will be wiped.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Type <span className="text-red-600 font-extrabold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmationText !== 'DELETE'}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {isDeletingAccount ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};