import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import About from "./pages/about";
import Images from "./pages/images";
import Home from "./pages";
import Courses from "./pages/engineering";
import CoursesM from "./pages/medical";
import CoursesP from "./pages/pre-foundation";
import ResultsEngineering from "./pages/results-engineering";
import ResultsMedical from "./pages/results-medical";
import ResultsPreFoundation from "./pages/results-prefoundation";
import CollegeSearch from "./pages/CollegeSearch";
// import RegistrationForm from "./components/common/RegistrationForm";
import ResultLookup from "./pages/scienceChampResult";

export default function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="about" element={<About />} />
      <Route path="images" element={<Images />} />
      <Route path="college-search" element={<CollegeSearch />} />
      <Route path="engineering" element={<Courses />} />
      <Route path="medical" element={< CoursesM/>} />
      <Route path="pre-foundation" element={< CoursesP/>} />
      <Route path="results/engineering" element={< ResultsEngineering/>} />
      <Route path="results/medical" element={< ResultsMedical/>} />
      <Route path="results/pre-foundation" element={< ResultsPreFoundation/>} />
      <Route path="science-champ-result-2026" element={< ResultLookup/>} />
      {/* <Route path="science-champ-2025-2026" element={< RegistrationForm/>} /> */}


      {/* <Route path="courses" element={<Courses />} /> */}
    </Routes>
  </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
