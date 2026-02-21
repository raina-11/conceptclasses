import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Eager-load the home page (most common entry point)
import Home from "./pages";

// Lazy-load all other routes for code splitting
const About = lazy(() => import("./pages/about"));
const Images = lazy(() => import("./pages/images"));
const Courses = lazy(() => import("./pages/engineering"));
const CoursesM = lazy(() => import("./pages/medical"));
const CoursesP = lazy(() => import("./pages/pre-foundation"));
const ResultsEngineering = lazy(() => import("./pages/results-engineering"));
const ResultsMedical = lazy(() => import("./pages/results-medical"));
const ResultsPreFoundation = lazy(() => import("./pages/results-prefoundation"));
const CollegeSearch = lazy(() => import("./pages/CollegeSearch"));
const ResultLookup = lazy(() => import("./pages/scienceChampResult"));
const AdminApp = lazy(() => import("./admin/AdminApp"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>
    Loading...
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="about" element={<About />} />
      <Route path="images" element={<Images />} />
      <Route path="college-search" element={<CollegeSearch />} />
      <Route path="engineering" element={<Courses />} />
      <Route path="medical" element={<CoursesM/>} />
      <Route path="pre-foundation" element={<CoursesP/>} />
      <Route path="results/engineering" element={<ResultsEngineering/>} />
      <Route path="results/medical" element={<ResultsMedical/>} />
      <Route path="results/pre-foundation" element={<ResultsPreFoundation/>} />
      <Route path="science-champ-result-2026" element={<ResultLookup/>} />
      <Route path="admin/*" element={<AdminApp />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  </BrowserRouter>
  );
}
