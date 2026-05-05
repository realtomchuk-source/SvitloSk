import React from 'react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import { SubgroupGrid } from '../../../components/ui/SubgroupGrid/SubgroupGrid';

interface SubGroupSheetProps {
    isOpen: boolean;
    onClose: () => void;
    selectedGroup: string;
    onSelectGroup: (group: string) => void;
}

export const SubGroupSheet: React.FC<SubGroupSheetProps> = ({ 
    isOpen, 
    onClose, 
    selectedGroup, 
    onSelectGroup 
}) => {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Оберіть підчергу">
            <div style={{ padding: '16px 16px 120px' }}>
                <SubgroupGrid 
                    selectedGroup={selectedGroup} 
                    onSelect={(g) => {
                        onSelectGroup(g);
                        onClose();
                    }} 
                />
            </div>
        </BottomSheet>
    );
};
