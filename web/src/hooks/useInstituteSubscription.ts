import { useEffect, useMemo, useState } from 'react';
import { CurrentSubscription, getCurrentSubscription } from '../services/subscription.api';

export const useInstituteSubscription = () => {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCurrentSubscription()
      .then((data) => active && setSubscription(data))
      .catch(() => active && setSubscription(null))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, []);

  const isPremium = useMemo(() => (
    subscription?.status === 'active' && new Date(subscription.expires_at).getTime() > Date.now()
  ), [subscription]);

  return { subscription, isPremium, isLoading };
};
