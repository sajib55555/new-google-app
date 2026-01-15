
import { useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export const useSubscription = (isPro: boolean, setIsPro: (val: boolean) => void) => {
  const [isLoading, setIsLoading] = useState(false);

  const buyMonthly = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call to RevenueCat
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ is_pro: true }).eq('id', user.id);
      setIsPro(true);
      alert("Subscription activated: Monthly Plan (£4.95)");
    }
    setIsLoading(false);
  }, [setIsPro]);

  const buyYearly = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call to RevenueCat
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ is_pro: true }).eq('id', user.id);
      setIsPro(true);
      alert("Subscription activated: Yearly Plan (£49.95)");
    }
    setIsLoading(false);
  }, [setIsPro]);

  const restorePurchases = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
      if (data?.is_pro) {
        setIsPro(true);
        alert("Purchases restored!");
      } else {
        alert("No active subscription found.");
      }
    }
    setIsLoading(false);
  }, [setIsPro]);

  return { isPro, isLoading, buyMonthly, buyYearly, restorePurchases };
};
