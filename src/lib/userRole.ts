import { supabase } from './supabase';

export interface UserRole {
  isLoggedIn: boolean;
  isCoach: boolean;
  userId: string | null;
}

export async function getUserRole(userId: string | null): Promise<UserRole> {
  if (!userId) {
    return { isLoggedIn: false, isCoach: false, userId: null };
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_creator_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    const isCoach = profile?.is_creator_enabled === true;

    return { isLoggedIn: true, isCoach, userId };
  } catch (error) {
    console.error('Error fetching user role:', error);
    return { isLoggedIn: true, isCoach: false, userId };
  }
}

export function getAudienceContent(isCoach: boolean) {
  return {
    hero: {
      subtitle: isCoach
        ? 'Join the ELITE Coaching Network'
        : 'Coach2Coach',
      title: isCoach
        ? 'Created by coaches, for coaches'
        : 'Join the ELITE coaching network',
      description: 'Ready-to-use coaching resources created by proven coaches.',
      searchPlaceholder: 'Search drills, playbooks, practice plans…',
    },
    ctas: isCoach
      ? { primary: 'Upload Resource', primaryLink: '/upload', secondary: 'My Library', secondaryLink: '/account' }
      : { primary: 'Browse Resources', primaryLink: '/browse', secondary: 'Become a Seller', secondaryLink: '/become-seller' },
  };
}
