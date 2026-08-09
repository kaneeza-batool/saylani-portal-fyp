import { useAuth } from '../context/AuthContext';

// Reached only when an authenticated user's role has no mapped home route
// (see utils/roleHome.js) or isn't allowed on the route they hit — a dead
// end by design, so it never redirects anywhere on its own.
export default function UnauthorizedPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 font-sans px-4">
      <div className="w-full max-w-[380px] bg-white border border-neutral-200 rounded-xl p-[30px] flex flex-col items-center gap-4 text-center">
        <div className="font-heading font-bold text-h5 text-neutral-900">Portal not available</div>
        <p className="text-body-sm text-neutral-500">
          Your account doesn't have a portal set up yet. Contact an administrator if you think this is a mistake.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded px-4 py-[11px] text-body font-semibold bg-royal-500 text-white transition-colors hover:bg-royal-600"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
