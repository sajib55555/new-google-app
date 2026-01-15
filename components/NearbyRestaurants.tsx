
import React from 'react';
import { Restaurant } from '../types';

interface NearbyRestaurantsProps {
  restaurants: Restaurant[];
  onClose: () => void;
}

const NearbyRestaurants: React.FC<NearbyRestaurantsProps> = ({ restaurants, onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Healthy Nearby</h2>
          <p className="text-xs text-slate-400 font-medium uppercase">Powered by Google Maps</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Looking for healthy spots nearby...</p>
          </div>
        ) : (
          restaurants.map((place, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group">
              <h3 className="text-lg font-bold text-slate-800 mb-1">{place.name}</h3>
              {place.snippet && (
                <p className="text-sm text-slate-500 italic mb-4">"{place.snippet}"</p>
              )}
              <a 
                href={place.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-emerald-100 group-hover:bg-emerald-700 transition-colors"
              >
                View on Google Maps
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NearbyRestaurants;
