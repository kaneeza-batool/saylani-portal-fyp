import { Link } from 'react-router-dom';
import Card from './Card';
import resolveImageUrl from '../../utils/resolveImageUrl';

/* ============================================================
   Shared course catalog card — used on the Programs grid and on
   the Find Your Path quiz results screen. Deliberately minimal:
   image, title, duration — the whole card is a single link to the
   course detail page, which carries all the other detail (category,
   prerequisites, tools, availability).
   `track` is a Course document fetched from GET /api/courses.
   ============================================================ */

const CourseCard = ({ track }) => (
  <Card className="bg-white border border-neutral-100/80 rounded-xl overflow-hidden shadow-xs hover:shadow-xl hover:border-primary-600 transition-all duration-300 group h-fit">
    <Link to={`/programs/${track.slug}`} className="flex flex-col no-underline text-inherit cursor-pointer">
      <div className="relative h-44 bg-neutral-50/40 overflow-hidden">
        {track.img ? (
          <img src={resolveImageUrl(track.img)} alt={track.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-neutral-100">
            <span className="te-mono text-[10px] font-bold text-primary-800/50 uppercase tracking-widest">TITAN</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="p-5 flex items-center justify-between gap-3">
        <h3 className="te-display text-base font-bold text-neutral-900 leading-snug group-hover:text-neutral-800 transition-colors">
          {track.title}
        </h3>
        <span className="te-mono text-[11px] font-bold text-neutral-500 bg-neutral-50/60 border border-neutral-100 px-2.5 py-1 rounded shrink-0 whitespace-nowrap">
          {track.duration}
        </span>
      </div>
    </Link>
  </Card>
);

export default CourseCard;
