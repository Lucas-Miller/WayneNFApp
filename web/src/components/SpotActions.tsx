import { useDeleteSpot, useUpdateSpot } from "@/hooks/useSpots";
import { Spot } from "@/lib/types";
import { Edit, Navigation, Trash2 } from "lucide-react";
import { useState } from "react";
import { UpdateSpotNameModal } from "./UpdateSpotNameModal";

type SpotActionProps = {
  spot: Spot;
  onClose: () => void;
  onNavigate: () => void;
};

export function SpotActions({spot, onClose, onNavigate} : SpotActionProps) {
    const deleteSpot = useDeleteSpot();
    const updateSpot = useUpdateSpot();

    const [renaming, setRenaming] = useState(false);

    return(
        <div className="actions">
            <button className="btn btn-primary" onClick={onNavigate} title="Navigate" aria-label="Navigate">
              <Navigation size={20} />
              Navigate
            </button>

            <button className="btn btn-secondary"
                title="Delete spot"
                aria-label={`Delete ${spot.name}`}
                disabled={deleteSpot.isPending}
                onClick={() => {
                  if (confirm(`Delete "${spot.name}"?`)) {
                    deleteSpot.mutate(spot.id, { onSuccess: onClose });
                  }
                }}>
              <Trash2 size={20} />
              Delete Spot
            </button>

            <button className="btn btn-secondary" onClick={() => setRenaming(true)} title="Rename Spot" aria-label="Rename Spot">
              <Edit size={20} />
              Rename Spot
            </button>

            {renaming && <UpdateSpotNameModal open={true} 
                                              onSave={(newName) => updateSpot.mutate({ id: spot.id, name: newName }, 
                                                                              { onSuccess: () => setRenaming(false)})}
                                              onCancel={() => setRenaming(false)}
                                              currentName={spot.name}
                                              saving={updateSpot.isPending}/>
            }
        </div>
    )
}