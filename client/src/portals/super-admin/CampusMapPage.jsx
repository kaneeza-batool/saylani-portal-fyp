import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { fetchCampusMap } from '../../services/mapService';

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

export default function CampusMapPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['campus-map'], queryFn: fetchCampusMap });

  if (isLoading) {
    return <div className="bg-surface border border-neutral-200 rounded-xl animate-pulse" style={{ height: 560 }} />;
  }
  if (isError) {
    return <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] text-body-sm text-danger-600">Couldn't load map data.</div>;
  }

  const cities = data.cities;
  const maxCount = Math.max(1, ...cities.map((c) => c.studentCount));

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <motion.div variants={fadeIn} className="bg-surface border border-neutral-200 rounded-xl overflow-hidden" style={{ height: 560 }}>
        <MapContainer center={[30.3753, 69.3451]} zoom={5} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {cities.map((c) => {
            const radius = 10 + (c.studentCount / maxCount) * 30;
            return (
              <CircleMarker key={c.city} center={[c.lat, c.lng]} radius={radius} pathOptions={{ color: '#1D56C4', fillColor: '#2F6FE4', fillOpacity: 0.5, weight: 2 }}>
                <Tooltip direction="top" offset={[0, -radius]}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
                    <strong>{c.city}</strong>
                    <div>{c.studentCount} students</div>
                    <div>{c.campusCount} campuses</div>
                    <div>{c.trainerCount} trainers</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </motion.div>

      <div className="grid grid-cols-4 gap-4">
        {cities.map((c) => (
          <motion.div key={c.city} variants={fadeIn} className="bg-surface border border-neutral-200 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-overline uppercase text-neutral-500">{c.city}</span>
            <span className="font-heading text-h5 text-neutral-900">{c.studentCount}</span>
            <span className="text-caption text-neutral-400 font-normal">
              {c.campusCount} campus{c.campusCount === 1 ? '' : 'es'} · {c.trainerCount} trainer{c.trainerCount === 1 ? '' : 's'}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
