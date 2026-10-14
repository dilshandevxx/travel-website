import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Phone,
  Clock,
  MapPin,
  AlertCircle,
  Wrench,
  Check,
  ChevronLeft,
  UserCheck,
  Star,
  ExternalLink,
  Bell,
  Navigation,
  Hammer,
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { customerApi } from '../services/api.js';

export const RequestStatusScreen = ({
  initialRequest,
  onHomeClick,
  onSwitchToProviderApp,
  unreadCount = 0,
  onOpenNotifications,
}) => {
  const [request, setRequest] = useState(initialRequest);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [error, setError] = useState(null);

  // Rating State
  const [rating, setRating] = useState(request.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState(request.ratingFeedback || '');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(!!request.rating);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const updated = await customerApi.getServiceRequestById(initialRequest.id);

      setRequest(updated);

      if (updated.rating) {
        setRating(updated.rating);
        setRatingSubmitted(true);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to refresh status:', err);
      setError('Unable to reach server. Please tap refresh.');
    } finally {
      setLoading(false);
    }
  }, [initialRequest.id]);

  // Polling every 2.5 seconds to detect live provider actions
  useEffect(() => {
    const timer = setInterval(() => {
      fetchStatus();
    }, 2500);

    return () => clearInterval(timer);
  }, [fetchStatus]);

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);

    try {
      const updated = await customerApi.rateServiceRequest(request.id, {
        rating,
        feedback: feedback.trim() || undefined,
      });

      setRequest(updated);
      setRatingSubmitted(true);
    } catch (err) {
      console.error('Failed to submit rating:', err);
      alert(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const isAccepted = request.status !== 'PENDING';

  const isOnTheWay =
    request.status === 'ON_THE_WAY' ||
    request.status === 'IN_PROGRESS' ||
    request.status === 'COMPLETED';

  const isInProgress =
    request.status === 'IN_PROGRESS' ||
    request.status === 'COMPLETED';

  const isCompleted = request.status === 'COMPLETED';

  // Complete 6-Step Timeline
  const timelineSteps = [
    {
      id: 'created',
      title: 'Request Created',
      desc: 'Submitted and validated in PostgreSQL',
      state: 'done',
    },
    {
      id: 'finding',
      title: isAccepted ? 'Professional Found' : 'Finding Professional',
      desc: isAccepted
        ? 'Matched with verified technician in Colombo'
        : 'Dispatched to nearby Colombo plumbers',
      state: isAccepted ? 'done' : 'current',
    },
    {
      id: 'accepted',
      title: 'Worker Accepted',
      desc: isAccepted
        ? `${request.provider?.name || 'Kasun Perera'} accepted your request`
        : 'Waiting for available tradesman',
      state: isAccepted ? 'done' : 'upcoming',
    },
    {
      id: 'on_the_way',
      title: 'On the Way',
      desc: isOnTheWay
        ? `${request.provider?.name || 'Kasun Perera'} is en route to Colombo`
        : 'Technician will travel once ready',
      state:
        isCompleted || isInProgress
          ? 'done'
          : request.status === 'ON_THE_WAY'
          ? 'current'
          : 'upcoming',
    },
    {
      id: 'in_progress',
      title: 'Work Started',
      desc: isInProgress
        ? 'Technician arrived and plumbing work is underway'
        : 'Begins upon arrival at your address',
      state:
        isCompleted
          ? 'done'
          : request.status === 'IN_PROGRESS'
          ? 'current'
          : 'upcoming',
    },
    {
      id: 'completed',
      title: 'Service Completed',
      desc: isCompleted
        ? `Job finished at ${
            request.completedAt
              ? new Date(request.completedAt).toLocaleTimeString()
              : 'now'
          }`
        : 'Final customer verification and sign-off',
      state: isCompleted ? 'done' : 'upcoming',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Top Header */}
      <div className="bg-white px-5 py-4 border-b border-slate-200/80 sticky top-0 z-10 flex items-center justify-between shadow-2xs">
        <button
          onClick={onHomeClick}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Home
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Request #{request.id}
        </span>

        <div className="flex items-center gap-1">
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-blue-600 text-white font-extrabold text-[9px] flex items-center justify-center border border-white">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={fetchStatus}
            disabled={loading}
            title="Refresh Status"
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Dynamic Top Banner for the 5 Stages */}
        {isCompleted ? (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-md flex items-center gap-3.5 animate-in fade-in">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold">
                Service Completed ✓
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Your plumbing repair has been completed by{' '}
                {request.provider?.name || 'Kasun Perera'}.
              </p>
            </div>
          </div>
        ) : request.status === 'IN_PROGRESS' ? (
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 shadow-xs flex items-center gap-3.5 animate-in fade-in">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 animate-bounce">
              <Hammer className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-purple-950">
                Work Started 🛠️
              </h2>
              <p className="text-xs text-purple-700 mt-0.5">
                {request.provider?.name || 'Kasun Perera'} has arrived and
                service is in progress.
              </p>
            </div>
          </div>
        ) : request.status === 'ON_THE_WAY' ? (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 shadow-xs flex items-center gap-3.5 animate-in fade-in">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Navigation className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-indigo-950">
                Technician On the Way 🚗
              </h2>
              <p className="text-xs text-indigo-700 mt-0.5">
                {request.provider?.name || 'Kasun Perera'} is traveling to
                your location.
              </p>
            </div>
          </div>
        ) : isAccepted ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-emerald-950">
                Worker Accepted ✓
              </h2>
              <p className="text-xs text-emerald-700 mt-0.5">
                A skilled plumber has confirmed your booking!
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <Wrench className="w-5 h-5" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-blue-950">
                  Request Submitted ✓
                </h2>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>

                  <p className="text-xs text-blue-700 font-semibold">
                    Finding a Professional...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Fast-Switch Tip */}
        {onSwitchToProviderApp && !isCompleted && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>

              <span>
                <strong>Buildathon Demo:</strong> Switch to Provider App to
                progress the next stage.
              </span>
            </div>

            <button
              onClick={onSwitchToProviderApp}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] whitespace-nowrap cursor-pointer transition"
            >
              Open Provider App →
            </button>
          </div>
        )}

        {/* Rate Your Experience Card */}
        {isCompleted && (
          <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-md space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  Rate Your Experience
                </h3>

                <p className="text-xs text-slate-500 mt-0.5">
                  How was your service with{' '}
                  {request.provider?.name || 'Kasun Perera'}?
                </p>
              </div>

              {ratingSubmitted && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Rated ✓
                </span>
              )}
            </div>

            <form onSubmit={handleRateSubmit} className="space-y-3">
              {/* Star Rating Buttons */}
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={ratingSubmitted}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-slate-300 hover:scale-115 transition-transform cursor-pointer disabled:cursor-default"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="text-center text-xs font-bold text-slate-700">
                {rating === 5 && '⭐⭐⭐⭐⭐ Excellent Service!'}
                {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                {rating === 3 && '⭐⭐⭐ Average Service'}
                {rating === 2 && '⭐⭐ Below Expectations'}
                {rating === 1 && '⭐ Poor Service'}
              </div>

              {/* Review Input */}
              {!ratingSubmitted ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share feedback (e.g., Quick response and clean repair under the sink!)..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-60"
                  >
                    {submittingRating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving in PostgreSQL...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Rating</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs text-center border border-emerald-200">
                  <span className="font-bold">
                    Thank you for rating Kasun Perera!
                  </span>

                  {feedback && (
                    <p className="text-[11px] text-emerald-700 italic mt-1">
                      "{feedback}"
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Worker Profile Card */}
        {isAccepted && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  KP
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900">
                      Professional: {request.provider?.name || 'Kasun Perera'}
                    </h3>

                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-blue-700">
                      Service: {request.provider?.specialty || 'Plumber'}
                    </span>

                    <span>•</span>

                    <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {request.provider?.rating || 4.9}
                    </span>
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                Status: {request.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Distance
                </span>

                <span className="font-bold text-slate-800 text-sm">
                  {request.provider?.distance || '2.4 km'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {isCompleted ? 'Completed Status' : 'Estimated Arrival'}
                </span>

                <span className="font-bold text-slate-800 text-sm">
                  {isCompleted
                    ? 'Job Done ✓'
                    : isOnTheWay
                    ? 'Arriving now'
                    : '15 - 20 mins'}
                </span>
              </div>
            </div>

            {!isCompleted && (
              <div className="pt-1 flex gap-2">
                <a
                  href={`tel:${request.provider?.phone || '+94719876543'}`}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Technician
                </a>
              </div>
            )}
          </div>
        )}

        {/* Before / After Photos */}
        {(request.photoUrl || request.completionPhotoUrl) && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400 block">
              Job Work Order Photos
            </span>

            <div className="grid grid-cols-2 gap-2">
              {request.photoUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-32 bg-black relative">
                  <img
                    src={request.photoUrl}
                    alt="Before photo"
                    className="w-full h-full object-cover"
                  />

                  <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded">
                    Before
                  </span>
                </div>
              )}

              {request.completionPhotoUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-32 bg-black relative">
                  <img
                    src={request.completionPhotoUrl}
                    alt="After photo"
                    className="w-full h-full object-cover"
                  />

                  <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] px-1 rounded">
                    After (Repaired)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Request Summary Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">
              Request Details
            </span>

            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                request.urgency === 'Emergency'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {request.urgency} Urgency
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-slate-400 block font-medium">
                Service:
              </span>

              <span className="font-bold text-slate-900">
                {request.service}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium">
                Problem:
              </span>

              <p className="text-slate-700 text-xs mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                "{request.description}"
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{request.location}</span>
            </div>
          </div>
        </div>

        {/* Complete 6-Step Status Timeline */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Service Lifecycle Timeline
          </h3>

          <div className="space-y-4 pt-1">
            {timelineSteps.map((step, idx) => {
              const isStepDone = step.state === 'done';
              const isStepCurrent = step.state === 'current';
              const isLast = idx === timelineSteps.length - 1;

              return (
                <div key={step.id} className="flex gap-3 relative">
                  {!isLast && (
                    <div
                      className={`absolute left-[13px] top-[26px] bottom-[-16px] w-[2px] ${
                        isStepDone ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                  )}

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                      isStepDone
                        ? 'bg-blue-600 text-white'
                        : isStepCurrent
                        ? 'bg-blue-100 text-blue-700 ring-4 ring-blue-50'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isStepDone ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isStepCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    )}
                  </div>

                  <div className="flex-1 pb-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isStepDone || isStepCurrent
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {isStepDone ? `✓ ${step.title}` : step.title}
                      </span>

                      {isStepCurrent && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Polling indicator footer */}
        <div className="text-center pt-1 pb-4">
          <span className="text-[11px] text-slate-400">
            Auto-refreshing live status • Last checked{' '}
            {lastRefreshed.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};