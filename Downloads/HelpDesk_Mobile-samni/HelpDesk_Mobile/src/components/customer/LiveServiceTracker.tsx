import React, { useState, useEffect } from 'react';
import { 
  ServiceRequest, 
  BookingStatus, 
  RequestUrgency, 
  AdditionalChargeProposal,
  Review
} from '../../types';
import { api } from '../../services/api';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Star, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  X, 
  Info, 
  HelpCircle, 
  Calendar, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Camera,
  Check,
  AlertCircle
} from 'lucide-react';
import { ActionButton } from '../common/ActionButton';

interface Props {
  bookingId: string;
  onBack: () => void;
  onOpenChat: (bookingId: string) => void;
  onBookingUpdated?: (booking: any) => void;
  onBookAnother?: () => void;
  onReturnHome?: () => void;
  hideTopHeader?: boolean;
}

export const LiveServiceTracker: React.FC<Props> = ({
  bookingId,
  onBack,
  onOpenChat,
  onBookingUpdated,
  onBookAnother,
  onReturnHome,
  hideTopHeader
}) => {
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modals & confirmation dialogs
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [isCancelling, setIsCancelling] = useState(false);

  const [showConfirmCompletionModal, setShowConfirmCompletionModal] = useState(false);
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTags, setReviewTags] = useState<string[]>(['Professional', 'On time', 'Quality work']);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmittedSuccess, setReviewSubmittedSuccess] = useState(false);

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState('Work quality issue');
  const [complaintText, setComplaintText] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // Collapsible sections
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [priceDetailsExpanded, setPriceDetailsExpanded] = useState(true);

  // Searching retry state
  const [searchingSeconds, setSearchingSeconds] = useState(0);

  // Load booking details
  const fetchBooking = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await api.getServiceRequest(bookingId);
      setBooking(data);
      if (onBookingUpdated) onBookingUpdated(data);
      setError(null);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Real-time polling every 3 seconds for live status transitions
  useEffect(() => {
    const timer = setInterval(() => {
      fetchBooking(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [bookingId]);

  // Searching timer
  useEffect(() => {
    let timer: any;
    if (booking?.status === 'PENDING') {
      timer = setInterval(() => {
        setSearchingSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [booking?.status]);

  // Handle proposal respond
  const handleRespondToProposal = async (proposalId: string, approved: boolean) => {
    try {
      await api.respondToAdditionalCost(bookingId, { proposalId, approved });
      await fetchBooking();
    } catch (err: any) {
      alert('Error updating proposal: ' + err.message);
    }
  };

  // Handle confirm completion
  const handleConfirmCompletion = async () => {
    setIsConfirmingCompletion(true);
    try {
      const res = await api.confirmCompletion(bookingId);
      setBooking(res.booking);
      setShowConfirmCompletionModal(false);
      // Immediately open rating & review modal if not reviewed yet
      setShowReviewModal(true);
    } catch (err: any) {
      alert('Could not confirm completion: ' + err.message);
    } finally {
      setIsConfirmingCompletion(false);
    }
  };

  // Handle Cancel
  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      await api.cancelServiceRequest(bookingId, cancelReason);
      await fetchBooking();
      setShowCancelModal(false);
    } catch (err: any) {
      alert('Cancellation failed: ' + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Submit Review
  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      alert('Please add a comment about your experience');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await api.submitReview(bookingId, ratingScore, reviewComment, reviewTags);
      setReviewSubmittedSuccess(true);
      setTimeout(() => {
        setShowReviewModal(false);
        fetchBooking();
      }, 1500);
    } catch (err: any) {
      alert('Review submission failed: ' + err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Submit Complaint
  const handleSubmitComplaint = async () => {
    if (!complaintText.trim()) {
      alert('Please explain the issue encountered');
      return;
    }
    setIsSubmittingComplaint(true);
    try {
      await api.submitComplaint(bookingId, complaintCategory, complaintText);
      alert('Your report has been submitted to HelpDesk Administration. Our Colombo customer support will mediate immediately.');
      setShowComplaintModal(false);
      setComplaintText('');
      await fetchBooking();
    } catch (err: any) {
      alert('Complaint filing failed: ' + err.message);
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Review Tag Toggle Helper
  const toggleReviewTag = (tag: string) => {
    setReviewTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (loading && !booking) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 space-y-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600">Loading service tracker...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <h4 className="text-sm font-bold text-slate-800">Booking Details Unavailable</h4>
        <p className="text-xs text-slate-500 max-w-xs">{error || 'Could not find booking record'}</p>
        <button
          onClick={() => fetchBooking()}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition"
        >
          Retry
        </button>
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isPending = booking.status === 'PENDING';
  const isAccepted = booking.status === 'ACCEPTED';
  const isOnTheWay = booking.status === 'ON_THE_WAY';
  const isArrived = booking.status === 'ARRIVED';
  const isInProgress = booking.status === 'IN_PROGRESS';
  const isAwaitingConfirmation = booking.status === 'AWAITING_CUSTOMER_CONFIRMATION';
  const isCompleted = booking.status === 'COMPLETED';
  const isCancelled = booking.status === 'CANCELLED';

  // Map 9 stages to boolean status
  // 1. Request submitted (always true)
  // 2. Finding provider (PENDING)
  // 3. Provider accepted (ACCEPTED+)
  // 4. Provider on the way (ON_THE_WAY+)
  // 5. Provider arrived (ARRIVED+)
  // 6. Work started (IN_PROGRESS+)
  // 7. Work completed by provider (AWAITING_CUSTOMER_CONFIRMATION+)
  // 8. Awaiting your confirmation (AWAITING_CUSTOMER_CONFIRMATION)
  // 9. Completed (COMPLETED)

  const stageStatuses = [
    {
      id: 1,
      title: 'Request submitted',
      subtitle: 'Your service request has been sent to dispatch',
      done: true,
      current: false
    },
    {
      id: 2,
      title: 'Finding provider',
      subtitle: isPending 
        ? 'HelpDesk is actively contacting verified nearby professionals' 
        : 'Matching completed',
      done: !isPending,
      current: isPending
    },
    {
      id: 3,
      title: 'Provider accepted',
      subtitle: ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status)
        ? `${booking.provider?.name || 'A professional'} accepted your booking`
        : 'Awaiting provider acceptance',
      done: ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status),
      current: isAccepted
    },
    {
      id: 4,
      title: 'Provider on the way',
      subtitle: ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status)
        ? 'Technician has departed and is travelling to your location'
        : 'Provider preparing tools and route',
      done: ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status),
      current: isOnTheWay
    },
    {
      id: 5,
      title: 'Provider arrived',
      subtitle: ['ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status)
        ? 'Technician has reached your premises'
        : 'Awaiting technician arrival',
      done: ['ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status),
      current: isArrived
    },
    {
      id: 6,
      title: 'Work started',
      subtitle: ['IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status)
        ? 'Inspection and repair work actively in progress'
        : 'Awaiting work start',
      done: ['IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status),
      current: isInProgress
    },
    {
      id: 7,
      title: 'Work completed by provider',
      subtitle: ['AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status)
        ? 'Technician completed repairs and submitted labor & parts bill'
        : 'Awaiting repair completion',
      done: ['AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status),
      current: isAwaitingConfirmation
    },
    {
      id: 8,
      title: 'Awaiting your confirmation',
      subtitle: isCompleted 
        ? 'Confirmed by customer' 
        : (isAwaitingConfirmation ? 'Please inspect completed repairs and confirm invoice' : 'Pending completion review'),
      done: isCompleted,
      current: isAwaitingConfirmation
    },
    {
      id: 9,
      title: 'Completed',
      subtitle: isCompleted 
        ? 'Service successfully verified and finished' 
        : 'Final completion sign-off',
      done: isCompleted,
      current: isCompleted
    }
  ];

  // Estimated Arrival calculation
  const getEtaText = () => {
    if (isPending) return 'Calculating after acceptance';
    if (isAccepted) return 'Preparing equipment • ETA ~15-25 mins';
    if (isOnTheWay) return 'En route • ETA ~10-15 mins';
    if (isArrived) return 'Arrived on premises';
    if (isInProgress) return 'Work underway';
    if (isAwaitingConfirmation) return 'Work finished';
    if (isCompleted) return 'Service finished';
    return 'Arrival time unavailable';
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      
      {/* ==================== 1. COMPACT HEADER ==================== */}
      {!hideTopHeader && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs shrink-0 z-20">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>My Jobs</span>
          </button>

          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Service Booking</span>
            <span className="text-xs font-extrabold text-slate-900">{booking.bookingReference}</span>
          </div>

          <button
            onClick={() => fetchBooking()}
            disabled={refreshing}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
            title="Refresh booking"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      )}