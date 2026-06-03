import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const AuthContext = createContext({
  user: null,
  role: null,
  userProfile: null,
  recruiterProfile: null,
  profileLoading: false,
});

export function AuthProvider({ user, role, children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [recruiterProfile, setRecruiterProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setUserProfile(null);
      setRecruiterProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const unsubscribers = [];

    const userUnsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setUserProfile(snap.exists() ? snap.data() : null);
        setProfileLoading(false);
      },
      (error) => {
        console.error('AuthContext users profile subscription error', error);
        setProfileLoading(false);
      },
    );
    unsubscribers.push(userUnsub);

    const recruiterUnsub = onSnapshot(
      doc(db, 'recruiters', user.uid),
      (snap) => {
        setRecruiterProfile(snap.exists() ? snap.data() : null);
      },
      (error) => console.error('AuthContext recruiter profile subscription error', error),
    );
    unsubscribers.push(recruiterUnsub);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [user?.uid]);

  const value = useMemo(
    () => ({
      user,
      role,
      userProfile,
      recruiterProfile,
      profileLoading,
      // Helper: is this user a platform admin?
      isAdmin: () => {
        // Prefer explicit role on the users profile; fall back to recruiterProfile role if present
        if (userProfile?.role && String(userProfile.role).toLowerCase() === 'admin') return true;
        if (recruiterProfile?.role && String(recruiterProfile.role).toLowerCase() === 'admin') return true;
        return false;
      },
    }),
    [profileLoading, recruiterProfile, role, user, userProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}

