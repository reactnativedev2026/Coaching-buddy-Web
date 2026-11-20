import React from 'react';
import { Crown, LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import Button from './Button';

interface PremiumFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export const PremiumFeatureModal: React.FC<PremiumFeatureModalProps> = ({ isOpen, onClose, feature = 'This feature' }) => {
  const navigate = useNavigate();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Premium feature" description="Available with an active institute subscription">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <p className="text-sm text-slate-600">{feature} is included in Coaching Buddy Premium. Activate a plan to use it.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Not now</Button>
          <Button variant="primary" leftIcon={<Crown className="h-4 w-4" />} onClick={() => { onClose(); navigate('/subscription'); }}>
            View plans
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PremiumFeatureModal;
