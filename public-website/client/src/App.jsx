import PublicRoutes from './routes/public/PublicRoutes';
import ScrollToTop from './components/common/ScrollToTop';

function App() {
  return (
    <>
      {/* Ab saari navigation aur layouts aapki PublicRoutes file handle karegi.
        Navbar, Footer aur Home page sab auto-manage ho jayenge bina crash hue!
      */}
      <ScrollToTop />
      <PublicRoutes />
    </>
  );
}

export default App;