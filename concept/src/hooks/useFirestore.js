import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useDataContext } from '../context/DataContext';

// Hook to fetch banners (reads from cached DataContext)
export function useBanners() {
  const { data, loading, error } = useDataContext();
  const banners = useMemo(
    () => data.banners.filter(b => b.isActive !== false),
    [data.banners]
  );
  return { banners, loading, error };
}

// Hook to fetch all banners (for admin)
export function useAllBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'banners'),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBanners(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { banners, loading, error };
}

// Hook to fetch statistics (reads from cached DataContext)
export function useStatistics(type = 'india') {
  const { data, loading, error } = useDataContext();
  const statistics = type === 'rajasthan' ? data.statisticsRajasthan : data.statisticsIndia;
  return { statistics, loading, error };
}

// Hook to fetch results by category (reads from cached DataContext)
export function useResults(category) {
  const { data, loading, error } = useDataContext();
  const results = useMemo(
    () => data.results.filter(r => r.category === category && r.isActive !== false),
    [data.results, category]
  );
  return { results, loading, error };
}

// Hook to fetch all results (for admin)
export function useAllResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'results'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.category || '').localeCompare(b.category || '') || (a.order || 0) - (b.order || 0));
        setResults(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching results:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { results, loading, error };
}

// Hook to fetch success stories (reads from cached DataContext)
export function useSuccessStories() {
  const { data, loading, error } = useDataContext();
  const stories = useMemo(
    () => data.successStories.filter(s => s.isActive !== false),
    [data.successStories]
  );
  return { stories, loading, error };
}

// Hook to fetch all success stories (for admin)
export function useAllSuccessStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'successStories'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.row || 0) - (b.row || 0) || (a.order || 0) - (b.order || 0));
        setStories(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching success stories:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { stories, loading, error };
}

// Hook to fetch announcements (reads from cached DataContext)
export function useAnnouncements() {
  const { data, loading, error } = useDataContext();
  const announcements = useMemo(
    () => data.announcements.filter(a => a.isActive !== false),
    [data.announcements]
  );
  return { announcements, loading, error };
}

// Hook to fetch all announcements (for admin)
export function useAllAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'announcements'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAnnouncements(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { announcements, loading, error };
}

// Utility function to upload image via Cloudinary
export async function uploadImage(file, folder) {
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Image upload failed');
  }

  const data = await response.json();
  return { url: data.secure_url, path: data.public_id };
}

// Utility function to delete image
// Cloudinary deletion requires server-side API secret, so we only remove the reference.
// Unused images can be cleaned up from the Cloudinary dashboard.
export async function deleteImage(path) {
  console.log('Image reference removed:', path);
}

// CRUD operations for banners
export const bannerOperations = {
  async add(data, imageFile) {
    const { url, path } = await uploadImage(imageFile, 'banners');
    return addDoc(collection(db, 'banners'), {
      ...data,
      imageUrl: url,
      imagePath: path,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async update(id, data, imageFile = null) {
    const docRef = doc(db, 'banners', id);
    const updateData = { ...data, updatedAt: serverTimestamp() };

    if (imageFile) {
      // Delete old image if exists
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().imagePath) {
        try {
          await deleteImage(docSnap.data().imagePath);
        } catch (e) {
          console.log('Old image not found');
        }
      }
      const { url, path } = await uploadImage(imageFile, 'banners');
      updateData.imageUrl = url;
      updateData.imagePath = path;
    }

    return updateDoc(docRef, updateData);
  },

  async delete(id) {
    const docRef = doc(db, 'banners', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().imagePath) {
      try {
        await deleteImage(docSnap.data().imagePath);
      } catch (e) {
        console.log('Image not found');
      }
    }
    return deleteDoc(docRef);
  }
};

// CRUD operations for statistics
export const statisticsOperations = {
  async update(type, data) {
    const docRef = doc(db, 'statistics', type);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    } else {
      return setDoc(docRef, {
        ...data,
        type,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }
};

// CRUD operations for results
export const resultsOperations = {
  async add(data, imageFile) {
    const { url, path } = await uploadImage(imageFile, 'results');
    return addDoc(collection(db, 'results'), {
      ...data,
      imageUrl: url,
      imagePath: path,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async update(id, data, imageFile = null) {
    const docRef = doc(db, 'results', id);
    const updateData = { ...data, updatedAt: serverTimestamp() };

    if (imageFile) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().imagePath) {
        try {
          await deleteImage(docSnap.data().imagePath);
        } catch (e) {
          console.log('Old image not found');
        }
      }
      const { url, path } = await uploadImage(imageFile, 'results');
      updateData.imageUrl = url;
      updateData.imagePath = path;
    }

    return updateDoc(docRef, updateData);
  },

  async delete(id) {
    const docRef = doc(db, 'results', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().imagePath) {
      try {
        await deleteImage(docSnap.data().imagePath);
      } catch (e) {
        console.log('Image not found');
      }
    }
    return deleteDoc(docRef);
  }
};

// CRUD operations for success stories
export const successStoriesOperations = {
  async add(data, imageFile) {
    const { url, path } = await uploadImage(imageFile, 'success-stories');
    return addDoc(collection(db, 'successStories'), {
      ...data,
      photoUrl: url,
      photoPath: path,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async update(id, data, imageFile = null) {
    const docRef = doc(db, 'successStories', id);
    const updateData = { ...data, updatedAt: serverTimestamp() };

    if (imageFile) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().photoPath) {
        try {
          await deleteImage(docSnap.data().photoPath);
        } catch (e) {
          console.log('Old image not found');
        }
      }
      const { url, path } = await uploadImage(imageFile, 'success-stories');
      updateData.photoUrl = url;
      updateData.photoPath = path;
    }

    return updateDoc(docRef, updateData);
  },

  async delete(id) {
    const docRef = doc(db, 'successStories', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().photoPath) {
      try {
        await deleteImage(docSnap.data().photoPath);
      } catch (e) {
        console.log('Image not found');
      }
    }
    return deleteDoc(docRef);
  }
};

// Hook to fetch legacy cards (reads from cached DataContext)
export function useLegacyCards() {
  const { data, loading, error } = useDataContext();
  const cards = useMemo(
    () => data.legacyCards.filter(c => c.isActive !== false),
    [data.legacyCards]
  );
  return { cards, loading, error };
}

// Hook to fetch all legacy cards (admin)
export function useAllLegacyCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'legacyCards'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setCards(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching legacy cards:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { cards, loading, error };
}

// CRUD operations for legacy cards
export const legacyCardsOperations = {
  async add(data, imageFile) {
    const { url, path } = await uploadImage(imageFile, 'legacy-cards');
    return addDoc(collection(db, 'legacyCards'), {
      ...data,
      imageUrl: url,
      imagePath: path,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async update(id, data, imageFile = null) {
    const docRef = doc(db, 'legacyCards', id);
    const updateData = { ...data, updatedAt: serverTimestamp() };

    if (imageFile) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().imagePath) {
        try {
          await deleteImage(docSnap.data().imagePath);
        } catch (e) {
          console.log('Old image not found');
        }
      }
      const { url, path } = await uploadImage(imageFile, 'legacy-cards');
      updateData.imageUrl = url;
      updateData.imagePath = path;
    }

    return updateDoc(docRef, updateData);
  },

  async delete(id) {
    const docRef = doc(db, 'legacyCards', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().imagePath) {
      try {
        await deleteImage(docSnap.data().imagePath);
      } catch (e) {
        console.log('Image not found');
      }
    }
    return deleteDoc(docRef);
  }
};

// Hook to fetch courses by category (reads from cached DataContext)
export function useCourses(category) {
  const { data, loading, error } = useDataContext();
  const courses = useMemo(
    () => data.courses.filter(c => c.category === category && c.isActive !== false),
    [data.courses, category]
  );
  return { courses, loading, error };
}

// Hook to fetch all courses (for admin)
export function useAllCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'courses'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.category || '').localeCompare(b.category || '') || (a.order || 0) - (b.order || 0));
        setCourses(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching courses:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { courses, loading, error };
}

// CRUD operations for courses
export const coursesOperations = {
  async add(data, imageFile) {
    const { url, path } = await uploadImage(imageFile, 'courses');
    return addDoc(collection(db, 'courses'), {
      ...data,
      imageUrl: url,
      imagePath: path,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async update(id, data, imageFile = null) {
    const docRef = doc(db, 'courses', id);
    const updateData = { ...data, updatedAt: serverTimestamp() };

    if (imageFile) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().imagePath) {
        try {
          await deleteImage(docSnap.data().imagePath);
        } catch (e) {
          console.log('Old image not found');
        }
      }
      const { url, path } = await uploadImage(imageFile, 'courses');
      updateData.imageUrl = url;
      updateData.imagePath = path;
    }

    return updateDoc(docRef, updateData);
  },

  async delete(id) {
    const docRef = doc(db, 'courses', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().imagePath) {
      try {
        await deleteImage(docSnap.data().imagePath);
      } catch (e) {
        console.log('Image not found');
      }
    }
    return deleteDoc(docRef);
  }
};

// Hook to fetch FAQs (reads from cached DataContext)
export function useFaqs() {
  const { data, loading, error } = useDataContext();
  const faqs = useMemo(
    () => data.faqs.filter(f => f.isActive !== false),
    [data.faqs]
  );
  return { faqs, loading, error };
}

// Hook to fetch all FAQs (for admin)
export function useAllFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'faqs'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setFaqs(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching FAQs:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { faqs, loading, error };
}

// CRUD operations for FAQs
export const faqOperations = {
  async add(data) {
    return addDoc(collection(db, 'faqs'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async update(id, data) {
    const docRef = doc(db, 'faqs', id);
    return updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  },

  async delete(id) {
    return deleteDoc(doc(db, 'faqs', id));
  }
};

// CRUD operations for announcements
export const announcementsOperations = {
  async add(data) {
    return addDoc(collection(db, 'announcements'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async update(id, data) {
    const docRef = doc(db, 'announcements', id);
    return updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  },

  async delete(id) {
    return deleteDoc(doc(db, 'announcements', id));
  }
};
