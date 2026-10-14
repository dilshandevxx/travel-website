
import React, { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { customerApi } from '../services/api.js';

export const CreateServiceRequestScreen = ({
  serviceName = 'Plumbing',
  onBack,
  onRequestCreated,
}) => {
  const [description, setDescription] = useState(
    'There is a water leak under my kitchen sink.'
  );

  const [location] = useState('Colombo');

  const [urgency, setUrgency] = useState('Normal');

  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const samplePhotos = [
    {
      label: 'Kitchen Sink Leak',
      url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Bathroom Pipe Drip',
      url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Water Valve Issue',
      url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validation
    if (!description.trim()) {
      setErrorMessage(
        'Please describe the problem so the technician can prepare.'
      );
      return;
    }

    setSubmitting(true);

    try {
      // 2. Send POST /api/service-requests
      const newRequest = await customerApi.createServiceRequest({
        customerId: 1,
        service: serviceName,
        description: description.trim(),
        photoUrl,
        location,
        urgency,
      });

      // 3. Callback with created request to navigate to status screen
      onRequestCreated(newRequest);
    } catch (err) {
      console.error('Failed to create service request:', err);
      setErrorMessage(
        err.message || 'Could not connect to HelpDesk backend.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Navigation Header */}
      <div className="bg-white px-5 py-4 border-b border-slate-200/80 sticky top-0 z-10 flex items-center justify-between shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-base font-bold text-slate-900">
          Request a Service
        </h1>

        <div className="w-8" />
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5 flex-1">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Selected Service Banner */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              Selected Service
            </span>

            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {serviceName}
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-xs">
            Skilled Pro
          </span>
        </div>

        {/* Problem Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Problem Description <span className="text-red-500">*</span>
            </label>

            <button
              type="button"
              onClick={() =>
                setDescription(
                  'There is a water leak under my kitchen sink.'
                )
              }
              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              Quick Template
            </button>
          </div>

          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g., There is a water leak under my kitchen sink.)"
            className="w-full px-3.5 py-3 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
            required
          />
        </div>

        {/* Photo Upload / Picker */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
            <span>Issue Photo (Optional)</span>

            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer font-normal"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            )}
          </label>

          {photoUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-48 group shadow-2xs">
              <img
                src={photoUrl}
                alt="Problem preview"
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <label className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-semibold cursor-pointer hover:bg-white shadow">
                  Replace Photo

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 rounded-2xl p-5 flex flex-col items-center justify-center text-center bg-white hover:bg-slate-50 transition cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>

              <span className="text-xs font-semibold text-slate-800">
                Take photo or choose from library
              </span>

              <span className="text-[11px] text-slate-400 mt-0.5">
                Helps the plumber bring the right tools & parts
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}

          {/* Quick Preset Samples for Buildathon Demo */}
          <div className="pt-1">
            <span className="text-[11px] text-slate-500 font-medium block mb-1.5">
              Quick demo photos:
            </span>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {samplePhotos.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoUrl(s.url)}
                  className={`px-2.5 py-1 rounded-lg text-xs border font-medium whitespace-nowrap transition cursor-pointer ${
                    photoUrl === s.url
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Location
          </label>

          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 shadow-2xs">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />

            <span className="font-semibold">{location}</span>

            <span className="text-xs text-slate-400 ml-auto">
              Fixed (Gate 2)
            </span>
          </div>
        </div>

        {/* Urgency Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Urgency Level
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUrgency('Normal')}
              className={`p-3 rounded-xl border text-left font-medium text-xs flex items-center justify-between transition cursor-pointer ${
                urgency === 'Normal'
                  ? 'bg-blue-50/70 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="font-bold text-sm">Normal</div>
                <div className="text-slate-500 text-[11px]">
                  Standard response
                </div>
              </div>

              {urgency === 'Normal' && (
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setUrgency('Emergency')}
              className={`p-3 rounded-xl border text-left font-medium text-xs flex items-center justify-between transition cursor-pointer ${
                urgency === 'Emergency'
                  ? 'bg-amber-50/70 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="font-bold text-sm">Emergency</div>
                <div className="text-slate-500 text-[11px]">
                  Immediate priority
                </div>
              </div>

              {urgency === 'Emergency' && (
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending to HelpDesk Network...</span>
              </>
            ) : (
              <span>Submit Request</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
