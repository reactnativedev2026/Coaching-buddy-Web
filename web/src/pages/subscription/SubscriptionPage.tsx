import React, { useEffect, useState } from 'react';
import { CheckCircle2, Crown, Smartphone } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { getSubscriptionPlans, SubscriptionPlan } from '../../services/subscription.api';
import { useInstituteSubscription } from '../../hooks/useInstituteSubscription';

const money = (value: number | string | undefined) => Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const SubscriptionPage: React.FC = () => {
  const { subscription, isPremium, isLoading } = useInstituteSubscription();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansError, setPlansError] = useState(false);

  useEffect(() => {
    getSubscriptionPlans().then(setPlans).catch(() => setPlansError(true));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-3xl bg-gradient-to-br from-teal-700 to-cyan-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/15 p-3"><Crown className="h-7 w-7 text-amber-300" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-100">Institute subscription</p>
            <h1 className="mt-1 text-2xl font-black">{isPremium ? 'Premium is active' : 'Unlock Premium tools'}</h1>
            <p className="mt-2 max-w-xl text-sm text-teal-50">Offers, call and WhatsApp inquiry analytics are available only while your institute plan is active.</p>
          </div>
        </div>
        {!isLoading && subscription && <div className="mt-5"><Badge variant="success">{subscription.plan_code} · {subscription.days_remaining} days remaining</Badge></div>}
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-800">What Premium includes</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
          {['Create admission offers & discounts', 'Call, WhatsApp and share inquiry analytics', 'Premium institute visibility'].map((feature) => (
            <div key={feature} className="flex gap-2 rounded-xl bg-slate-50 p-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" />{feature}</div>
          ))}
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-800">Available plans</h2>
        {plansError ? <Card className="p-5 text-sm text-slate-500">Plans could not be loaded right now. Please try again from the Institute mobile app.</Card> :
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const base = plan.discounted_amount ?? plan.base_amount;
              const total = Number(base) * (1 + Number(plan.gst_rate || 0) / 100);
              return <Card key={plan.id} className="p-5 border-teal-100"><p className="font-bold text-slate-800">{plan.code}</p><p className="mt-2 text-2xl font-black text-teal-700">₹{money(total)}</p><p className="text-xs text-slate-500">including GST · {plan.duration_months} month{plan.duration_months === 1 ? '' : 's'}</p></Card>;
            })}
          </div>}
      </div>

      {!isPremium && <Card className="flex gap-3 border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><Smartphone className="h-5 w-5 shrink-0" /><p>Plan purchase currently opens securely in the Coaching Buddy Institute mobile app. After payment, this web dashboard will unlock automatically on refresh.</p></Card>}
    </div>
  );
};

export default SubscriptionPage;
