/**
 * Message Formatter - Format chat messages with links and emoji support
 * Uses linkify-react for automatic link detection and formatting
 */

import React from 'react';
import Linkify from 'linkify-react';

/**
 * Options for linkify - make links open in new tab with proper security
 */
const linkifyOptions = {
  target: '_blank',
  rel: 'noopener noreferrer',
  className: 'text-blue-600 hover:text-blue-700 underline hover:no-underline font-medium transition-colors',
  validate: {
    url: (value: string) => /^https?:\/\//.test(value) || /^www\./.test(value),
  },
  format: (value: string, type: string) => {
    if (type === 'url' && value.length > 50) {
      return value.slice(0, 50) + '...';
    }
    return value;
  },
};

/**
 * Format message with links (automatically detects and linkifies URLs)
 * Supports emojis natively (modern browsers handle Unicode emojis)
 */
export function formatMessage(text: string): React.ReactNode {
  return (
    <Linkify options={linkifyOptions}>
      {text}
    </Linkify>
  );
}
