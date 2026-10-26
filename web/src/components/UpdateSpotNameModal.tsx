import { Save } from "lucide-react";
import { useState } from "react";
import { Modal } from "./Modal";

type UpdateSpotNameModalProps = {
  open: boolean;
  onSave: (newName: string) => void;
  onCancel: () => void;
  currentName: string;
  saving: boolean;
};

export function UpdateSpotNameModal({open, onSave, onCancel, currentName, saving}: UpdateSpotNameModalProps) {
    const [name, setName] = useState(currentName);

    const trimmed = name.trim();
    const valid = trimmed.length <= 50 && trimmed !== "";

    return(
    <Modal
        open={open}
        title="Update Spot Name"
        subtitle={`Currently "${currentName}"`}
        onClose={onCancel}
    >

        <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave(trimmed);
        }}
      >
          <label>
            <span className="label">New Name</span>
            <input
              className="input"
              placeholder={currentName}
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!valid || saving}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

    </Modal>
    )
}