import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  Plus,
  Percent,
  Gift,
} from 'lucide-react';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import { useInstituteSubscription } from '../../hooks/useInstituteSubscription';
import api from '../../services/api';

export interface OfferItem {
  id: string;
  offerName: string;
  discountPercentage: string;
}

const INITIAL_OFFERS: OfferItem[] = [];

export const OffersPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { store } = useAuth();
  const { isPremium, isLoading: isSubscriptionLoading } = useInstituteSubscription();
  const [offers, setOffers] = useState<OfferItem[]>(INITIAL_OFFERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    offerName: '',
    discountPercentage: '',
  });

  const validate = () => {
    const err: { [key: string]: string } = {};
    if (!formData.offerName.trim()) {
      err.offerName = 'Offer name is required';
    }
    const discountNum = Number(formData.discountPercentage);
    if (!formData.discountPercentage || isNaN(discountNum) || discountNum < 1 || discountNum > 100) {
      err.discountPercentage = 'Enter a valid percentage between 1 and 100';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);

    if (!store?.id) {
      toast.error('Institute not found', 'Please sign out and sign in again.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await api.put(`/store/offer/update/${store.id}`, {
        discountTitle: formData.offerName.trim(),
        discountPercentage: Number(formData.discountPercentage),
      });
      if (!response.data?.status) throw new Error(response.data?.message || 'Unable to save offer');
      const newOffer: OfferItem = {
        id: 'offer_' + Date.now(),
        ...formData,
      };

      setOffers((prev) => [newOffer, ...prev]);
      setIsSaving(false);
      setIsModalOpen(false);
      toast.success('Offer Created', `"${formData.offerName}" discount is now active`);
      setFormData({
        offerName: '',
        discountPercentage: '',
      });
    } catch (error: any) {
      toast.error('Could not save offer', error.response?.data?.message || error.message || 'Please try again');
    } finally {
      setIsSaving(false);
    }
  };

  if (isSubscriptionLoading) {
    return <Card className="p-8 text-center text-sm text-slate-500">Checking your subscription…</Card>;
  }

  if (!isPremium) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Gift className="h-7 w-7" /></div>
        <h1 className="text-xl font-bold text-slate-800">Offers & discounts are a Premium feature</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Activate an institute subscription to publish offers that students can see.</p>
        <Button className="mt-6" variant="primary" onClick={() => navigate('/subscription')}>View Plans</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <Header
        title="Offers & Discounts"
        subtitle="Create seasonal promotional discounts, scholarships, and coupon codes for students"
        rightAction={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setErrors({});
              setIsModalOpen(true);
            }}
          >
            Create New Offer
          </Button>
        }
      />

      {/* Promotional Callout Card */}
      <Card variant="gradient" className="border-blue-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#006EFF] text-white flex items-center justify-center shadow-brand shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1E293B]">Boost Student Admissions with Festive Offers</h3>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Active discounts are highlighted with special animated badges on student search feeds.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setErrors({});
              setIsModalOpen(true);
            }}
          >
            Add Discount
          </Button>
        </div>
      </Card>

      {/* Offers Grid */}
      {offers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className="flex flex-col justify-between p-5 sm:p-6 border border-[#E2E8F0] hover:border-[#006EFF]/30 transition-all"
            >
              <div>
                {/* Top Badge: Discount & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black tracking-wide flex items-center gap-1 shadow-xs">
                    <Percent className="w-3.5 h-3.5" />
                    <span>{offer.discountPercentage}% OFF</span>
                  </span>

                  <Badge variant="success" size="sm" dot>Active</Badge>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#1E293B] mt-2 line-clamp-1">
                  {offer.offerName}
                </h3>

              </div>

              <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">Publishing a new offer replaces the current institute offer.</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Tag className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#1E293B]">No Promotional Offers Active</h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto mt-1">
            Create discount vouchers and scholarships to attract more student inquiries.
          </p>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
            className="mt-4"
          >
            Create First Offer
          </Button>
        </Card>
      )}

      {/* Create Offer Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Promotional Discount"
        description="Add a seasonal scholarship or discount voucher for student applicants"
        maxWidth="md"
      >
        <form onSubmit={handleCreateOffer} className="space-y-4 pt-1">
          <InputField
            label="Offer / Voucher Title"
            placeholder="e.g. Diwali Scholarship 2026"
            value={formData.offerName}
            onChange={(e) => {
              setFormData({ ...formData, offerName: e.target.value });
              if (errors.offerName) setErrors({ ...errors, offerName: '' });
            }}
            error={errors.offerName}
            required
            autoFocus
          />

          <InputField
            label="Discount Percentage (%)"
            type="number"
            placeholder="e.g. 20"
            value={formData.discountPercentage}
            onChange={(e) => {
              setFormData({ ...formData, discountPercentage: e.target.value });
              if (errors.discountPercentage) setErrors({ ...errors, discountPercentage: '' });
            }}
            error={errors.discountPercentage}
            icon={<Percent className="w-4 h-4" />}
            helperText="Direct percentage discount applied at course checkout"
            required
          />

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              Publish Offer
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default OffersPage;
