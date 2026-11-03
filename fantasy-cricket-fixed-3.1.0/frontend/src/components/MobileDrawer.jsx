import React from 'react';
import { X } from 'lucide-react';
import PitchPreview from './PitchPreview';

const MobileDrawer = ({
  isOpen,
  onClose,
  selectedPlayers,
  captainId,
  viceCaptainId,
  boosterId,
  onSetBooster,
  onSetCaptain,
  onSetViceCaptain,
  onRemovePlayer,
  onSaveTeam,
  validationErrors,
  isSubmitting,
  teamA,
  teamB,
  isLocked,
  selectedMatch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#031a14] border-t-2 border-amber-400 rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
        
        {/* Drawer Header */}
        <div className="p-3 border-b border-emerald-900/80 flex items-center justify-between bg-emerald-950/60">
          <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto" />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pitch Content */}
        <div className="flex-1 overflow-y-auto p-3">
          <PitchPreview
            selectedPlayers={selectedPlayers}
            captainId={captainId}
            viceCaptainId={viceCaptainId}
            boosterId={boosterId}
            onSetBooster={onSetBooster}
            onSetCaptain={onSetCaptain}
            onSetViceCaptain={onSetViceCaptain}
            onRemovePlayer={onRemovePlayer}
            onSaveTeam={onSaveTeam}
            validationErrors={validationErrors}
            isSubmitting={isSubmitting}
            teamA={teamA}
            teamB={teamB}
            isLocked={isLocked}
            selectedMatch={selectedMatch}
          />
        </div>

      </div>
    </div>
  );
};

export default MobileDrawer;
