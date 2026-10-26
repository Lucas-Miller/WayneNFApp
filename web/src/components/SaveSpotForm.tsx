import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useState } from "react";

type SaveSpotFormProps = {
  signedIn: boolean;
  saving: boolean;
  onSave: (name: string) => void;
};

export function SaveSpotForm({signedIn, saving, onSave} : SaveSpotFormProps) {
    const [name, setName] = useState('');

    return (<div>{
        signedIn ? (
            <form
                className="save-row"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (name.trim()) onSave(name.trim());
                }}
            >
                <input
                    className="input"
                    placeholder="Name this spot, e.g. Creek Overlook"
                    aria-label="Spot name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                />
                <button type="submit" className="btn btn-primary" disabled={!name.trim() || saving}>
                    <MapPin size={18} />
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </form >
        ) : (
            <p className="muted sign-in-hint">
                <Link to="/account">Sign in</Link> to save this spot.
            </p>
        )}</div>);
}