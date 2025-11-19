/**
 * User model representing a registered user in the system
 */
export interface User {
  /** Unique user identifier */
  uid: string;
  /** User's email address */
  email: string | null;
  /** User's display name */
  displayName: string | null;
  /** URL to user's profile photo */
  photoURL: string | null;
  /** Timestamp when user was created */
  createdAt: number;
  /** Timestamp of user's last activity */
  lastActive: number;
  /** Whether the user account is deleted */
  isDeleted: boolean;
  /** Whether to show user's name in chat */
  showName: boolean;
}
