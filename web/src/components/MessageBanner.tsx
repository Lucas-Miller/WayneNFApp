// components/MessageBanner.tsx

import { useEffect } from 'react';

type MessageBannerProps = {
  message: string;
  onDismiss: () => void;
};

export function MessageBanner({ message, onDismiss }: MessageBannerProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 3600);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  // key restarts the fade animation when the text changes
  return (
    <div key={message} className="message-banner" role="status">
      {message}
    </div>
  );
}
