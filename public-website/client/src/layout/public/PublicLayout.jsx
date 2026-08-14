import { Outlet } from 'react-router-dom';
import Navbar from '../../components/navigation/Navbar';
import Footer from '../../components/common/Footer';
import QuizFAB from '../../components/common/QuizFAB';

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Sticky Top Navigation */}
      <Navbar />

      {/* Dynamic Content Pipeline Container */}
      <main className="flex-grow w-full">
        <Outlet /> {/* 👈 This core injection node guarantees real-time path updates */}
      </main>

      {/* Institutional Core Footer */}
      <Footer />

      {/* Site-wide floating entry point into the Find Your Path quiz */}
      <QuizFAB />
    </div>
  );
};

export default PublicLayout;