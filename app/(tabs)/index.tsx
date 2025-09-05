import { useRouter } from 'expo-router';
import { useEffect } from 'react';

// Redirect to home tab when index is accessed
export default function Index() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/(tabs)/home');
  }, []);

  return null;
}