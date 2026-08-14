import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card';
import Badge from './Badge';
import resolveImageUrl from '../../utils/resolveImageUrl';

/* ============================================================
   Shared course catalog card — used on the Programs grid and on
   the Find Your Path quiz results screen. Card body (image through
   tools list) links to the course detail page; footer keeps a
   direct "Enroll Now" shortcut alongside "View Details".
   `track` is a Course document fetched from GET /api/courses.
   Delivery mode and registration status vary by campus and aren't
   tracked per-course — see the audit note on the Course model — so
   this card shows a generic honest line instead of a status badge.
   ============================================================ */

const AVAILABILITY_NOTE = 'Delivery mode and availability vary by campus. Contact your nearest campus or Enroll Now for current details.';

const CourseCard = ({ track }) => {
  const [showRoadmap, setShowRoadmap] = useState(false);
  const slug = track.slug;

  return (
    <Card className="flex flex-col bg-white border border-neutral-100/80 rounded-xl overflow-hidden shadow-xs hover:shadow-xl hover:border-primary-600 transition-all duration-300 group h-fit">
      {/* Main click target — whole card body navigates to the course detail page */}
      <Link to={`/programs/${slug}`} className="flex flex-col no-underline text-inherit cursor-pointer">
        {/* Card Image Banner */}
        <div className="relative h-44 bg-neutral-50/40 overflow-hidden">
          <img src={resolveImageUrl(track.img)} alt={track.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 via-transparent to-transparent pointer-events-none" />

          <Badge className="absolute top-4 left-4 te-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 text-white bg-primary-900/90 backdrop-blur rounded border border-white/10">
            {track.category.toUpperCase()} NODE
          </Badge>
        </div>

        {/* Operational Availability Badges Row */}
        <div className="px-5 pt-4 flex flex-wrap gap-1.5">
          {track.codingRequired ? (
            <Badge className="inline-flex items-center gap-1 text-[10px] font-bold text-warning-text bg-warning-bg border border-warning-text/20 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-warning-text" /> Coding Required
            </Badge>
          ) : (
            <Badge className="inline-flex items-center gap-1 text-[10px] font-bold text-success-text bg-success-bg border border-success-text/20 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-success-text" /> No Coding Needed
            </Badge>
          )}
        </div>

        {/* Card Content Base */}
        <div className="p-5 pb-0">
          <h3 className="te-display text-base font-bold text-neutral-900 leading-snug group-hover:text-neutral-800 transition-colors">
            {track.title}
          </h3>

          {/* Integrated Programming Languages Sub-Row */}
          {track.languages.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {track.languages.map((lang, lIdx) => (
                <Badge key={lIdx} className="te-mono text-[9px] font-bold text-neutral-900 bg-neutral-50 border border-neutral-100 px-1.5 py-0.5 rounded">
                  {lang}
                </Badge>
              ))}
            </div>
          )}

          <p className="te-body text-xs text-neutral-900/70 mt-2.5 font-normal leading-relaxed">
            {track.desc}
          </p>

          {/* Tool Modules list */}
          <div className="mt-4 pt-3.5 border-t border-neutral-50">
            <div className="te-mono text-[9px] font-bold text-neutral-300 uppercase tracking-wider mb-2">Target Framework Core:</div>
            <ul className="space-y-1.5 list-none p-0 m-0">
              {track.tools.map((tool, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-neutral-900/90 font-medium">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CEA45C" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>{tool}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Link>

      <div className="px-5 pb-5 flex-1 flex flex-col justify-between">
        {/* DYNAMIC ROADMAP ACCORDION TRIGGER */}
        <div className="mt-4 pt-1">
          <button
            onClick={() => setShowRoadmap((prev) => !prev)}
            className="w-full text-center py-2 border border-dashed border-neutral-100 hover:border-neutral-400 hover:bg-neutral-50/30 text-[11px] font-bold text-neutral-900/80 hover:text-neutral-900 rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <span>{showRoadmap ? 'Hide Course Blueprint Roadmap' : 'View Course Blueprint Roadmap'}</span>
            <span className="font-mono">{showRoadmap ? '↑' : '↓'}</span>
          </button>

          {/* Hidden Outline Panel */}
          {showRoadmap && (
            <div className="mt-2.5 p-3.5 bg-neutral-50/20 rounded-lg border border-neutral-50 animate-fadeIn">
              {/* Cohort size note (no live seat count — varies by campus) */}
              <div className="mb-3 pb-2 border-b border-neutral-100/60 flex justify-between items-center">
                <span className="te-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Cohort Size:</span>
                <span className="text-[11px] font-bold text-neutral-900 bg-neutral-100/50 px-2 py-0.5 rounded te-mono">
                  Small, Focused Cohorts
                </span>
              </div>

              <div className="te-mono text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Term Roadmap Breakdown:</div>
              <div className="space-y-2">
                {track.roadmap.map((step, sIdx) => (
                  <div key={sIdx} className="text-[11px] text-neutral-900/90 font-medium flex gap-2 items-start">
                    <span className="te-mono text-neutral-600 font-bold">0{sIdx + 1}.</span>
                    <span className="leading-tight">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Operational Metrics Row */}
        <div className="mt-4 pt-3.5 border-t border-neutral-50 space-y-2">
          <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-neutral-900/50">
            <span className="te-mono px-2 py-0.5 bg-neutral-50/40 rounded border border-neutral-50 shrink-0">{track.duration}</span>
          </div>
          <p className="text-[10px] text-neutral-400 leading-snug">{AVAILABILITY_NOTE}</p>
        </div>

        {/* Action Footer — primary path is the detail page, Enroll Now stays as a quick secondary action */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 items-center">
          <Link to={`/programs/${slug}`} className="px-3 py-2 font-bold text-xs rounded-md text-center no-underline transition-all active:scale-98 bg-primary-900 text-white hover:bg-primary-800 shadow-md shadow-primary-900/10">
            View Details
          </Link>
          <Link to={`/apply?program=${track._id}`} className="px-3 py-2 font-bold text-xs rounded-md text-center no-underline transition-all active:scale-98 border border-neutral-200 text-neutral-900 hover:bg-neutral-50">
            Enroll Now
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default CourseCard;
