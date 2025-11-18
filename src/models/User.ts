export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  lastActive: number;
  isDeleted: boolean;
  showName: boolean;
}
