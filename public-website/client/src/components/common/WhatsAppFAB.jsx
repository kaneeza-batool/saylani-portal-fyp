import useFooterInView from '../../hooks/useFooterInView';

// Same institute UAN shown in Footer/Contact (111-848-261), reformatted for
// a wa.me deep link (country code + digits, no spaces/dashes/parens).
const WHATSAPP_NUMBER = '92118848261';
const WHATSAPP_MESSAGE = "Hi TITAN, I'd like to know more about your programs.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

// Site-wide click-to-chat button, mounted once in PublicLayout next to
// QuizFAB. Stacked above it (`bottom-40` vs QuizFAB's `bottom-24` vs
// ScrollToTopButton's `bottom-8`) so none of the three floating buttons
// ever overlap; hides once the footer scrolls into view, same as the other
// two (see useFooterInView).
const WhatsAppFAB = () => {
  const footerInView = useFooterInView();

  if (footerInView) return null;

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-40 right-6 sm:right-8 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe5b] hover:-translate-y-1 transition-all duration-300"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.38-.49.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94s.73-2.09.99-2.37c.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.81 2 .88 2.15.07.14.11.32.02.51-.09.19-.14.31-.27.47-.14.17-.29.37-.41.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.63-.14.26.09 1.66.78 1.94.93.28.14.47.21.53.33.07.12.07.68-.17 1.36z" />
      </svg>
    </a>
  );
};

export default WhatsAppFAB;
