const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' },
];

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-overline uppercase text-neutral-500">{label}</span>
      <p className="text-body-sm text-neutral-900 whitespace-pre-line">{value}</p>
    </div>
  );
}

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

function initials(name) {
  return (
    (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export default function DonationProfilePanel({ open, donation, onClose, onStatusChange, statusUpdating }) {
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(13,25,53,0.35)] z-20 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
      />

      <div
        className="fixed top-0 right-0 h-screen w-[460px] bg-surface shadow-panel z-30 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ transform: open ? 'translateX(0%)' : 'translateX(100%)', pointerEvents: open ? 'auto' : 'none' }}
      >
        <div className="px-6 py-[22px] border-b border-neutral-200 flex items-center justify-between">
          <div className="font-heading font-bold text-h5 text-neutral-900">Donation Details</div>
          <button
            type="button"
            onClick={onClose}
            className="w-[30px] h-[30px] border-none bg-neutral-100 rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-neutral-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {donation && (
          <div className="px-6 py-[22px] overflow-y-auto flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-navy-800 text-gold-400 flex items-center justify-center font-heading font-bold text-h6 border border-gold-500/40">
                {initials(donation.donorName)}
              </div>
              <div>
                <div className="font-heading font-bold text-body text-neutral-900">{donation.donorName}</div>
                <div className="text-caption text-neutral-400">For {donation.campaignTitle}</div>
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 flex items-center justify-between">
              <span className="text-body-sm text-neutral-600">Amount</span>
              <span className="font-heading font-bold text-h6 text-gold-600">{money(donation.amount)}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-overline uppercase text-neutral-500">Status</span>
              <div className="flex gap-1.5 flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => onStatusChange(s.value)}
                    className={`text-caption font-semibold px-3 py-[7px] rounded-pill cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      donation.status === s.value ? 'bg-gold-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Email" value={donation.email} />
            <Field label="Phone" value={donation.phone} />
            <Field label="Payment Method" value={donation.paymentMethod} />
            <Field label="Message" value={donation.message} />
            <Field label="Public on Donor Wall" value={donation.anonymous ? 'No — donor requested anonymity' : 'Yes'} />
          </div>
        )}
      </div>
    </>
  );
}
