import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const DataContext = createContext(null);

// Optimize Cloudinary URLs by adding auto quality + format transforms
function optimizeUrl(url) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_auto,f_auto/');
}

function optimizeProfileUrl(url) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/w_200,h_200,c_fill,g_face,q_auto,f_auto/');
}

function optimizeDoc(doc) {
  const optimized = { ...doc };
  if (optimized.imageUrl) optimized.imageUrl = optimizeUrl(optimized.imageUrl);
  if (optimized.photoUrl) optimized.photoUrl = optimizeProfileUrl(optimized.photoUrl);
  return optimized;
}

export function DataProvider({ children }) {
  const [data, setData] = useState({
    banners: [],
    results: [],
    successStories: [],
    announcements: [],
    faqs: [],
    legacyCards: [],
    courses: [],
    statisticsIndia: null,
    statisticsRajasthan: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const [
          bannersSnap,
          resultsSnap,
          storiesSnap,
          announcementsSnap,
          faqsSnap,
          legacySnap,
          coursesSnap,
          statsIndiaSnap,
          statsRajasthanSnap,
        ] = await Promise.all([
          getDocs(query(collection(db, 'banners'))),
          getDocs(query(collection(db, 'results'))),
          getDocs(query(collection(db, 'successStories'))),
          getDocs(query(collection(db, 'announcements'))),
          getDocs(query(collection(db, 'faqs'))),
          getDocs(query(collection(db, 'legacyCards'))),
          getDocs(query(collection(db, 'courses'))),
          getDoc(doc(db, 'statistics', 'india')),
          getDoc(doc(db, 'statistics', 'rajasthan')),
        ]);

        if (cancelled) return;

        setData({
          banners: bannersSnap.docs
            .map(d => optimizeDoc({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
          results: resultsSnap.docs
            .map(d => optimizeDoc({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
          successStories: storiesSnap.docs
            .map(d => optimizeDoc({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.row || 0) - (b.row || 0) || (a.order || 0) - (b.order || 0)),
          announcements: announcementsSnap.docs
            .map(d => ({ id: d.id, ...d.data() })),
          faqs: faqsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
          legacyCards: legacySnap.docs
            .map(d => optimizeDoc({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
          courses: coursesSnap.docs
            .map(d => optimizeDoc({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
          statisticsIndia: statsIndiaSnap.exists()
            ? { id: statsIndiaSnap.id, ...statsIndiaSnap.data() }
            : null,
          statisticsRajasthan: statsRajasthanSnap.exists()
            ? { id: statsRajasthanSnap.id, ...statsRajasthanSnap.data() }
            : null,
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return (
    <DataContext.Provider value={{ data, loading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return ctx;
}
