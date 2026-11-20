import api from './api';
import { ApiResponse } from '../types';

export interface CurrentSubscription {
  id: string | number;
  status: string;
  plan_code: string;
  starts_at: string;
  expires_at: string;
  days_remaining: number;
}

export interface SubscriptionPlan {
  id: string | number;
  code: string;
  duration_months: number;
  base_amount: number | string;
  gst_rate: number | string;
  original_amount?: number;
  discount_amount?: number;
  discounted_amount?: number;
}

export const getCurrentSubscription = async () => {
  const response = await api.get<ApiResponse<CurrentSubscription | null>>('/subscription/current');
  if (!response.data.status) throw new Error(response.data.message || 'Unable to load subscription');
  return response.data.data;
};

export const getSubscriptionPlans = async () => {
  const response = await api.get<ApiResponse<SubscriptionPlan[]>>('/subscription/plans');
  if (!response.data.status) throw new Error(response.data.message || 'Unable to load plans');
  return response.data.data || [];
};
