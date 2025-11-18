import { firestore } from "@/lib/firebase";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import type { User } from "@/models/User";

const USERS_COLLECTION = "users";

export class UserService {
  /**
   * Create or update user in Firestore
   */
  static async createOrUpdateUser(
    uid: string,
    email: string | null,
    displayName: string | null,
    photoURL: string | null
  ): Promise<void> {
    try {
      const userRef = doc(firestore, USERS_COLLECTION, uid);
      const userDoc = await getDoc(userRef);

      const userData = {
        uid,
        email,
        displayName,
        photoURL,
        lastActive: Date.now(),
      };

      if (userDoc.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          ...userData,
        });
      } else {
        // Create new user
        await setDoc(userRef, {
          ...userData,
          createdAt: Date.now(),
          isDeleted: false,
          showName: false,
        });
      }
    } catch (error) {
      console.error("Error creating/updating user:", error);
      throw error;
    }
  }

  /**
   * Get user by UID
   */
  static async getUser(uid: string): Promise<User | null> {
    try {
      const userRef = doc(firestore, USERS_COLLECTION, uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  /**
   * Update user's last active timestamp
   */
  static async updateLastActive(uid: string): Promise<void> {
    try {
      const userRef = doc(firestore, USERS_COLLECTION, uid);
      await updateDoc(userRef, {
        lastActive: Date.now(),
      });
    } catch (error) {
      console.error("Error updating last active:", error);
      throw error;
    }
  }

  /**
   * Mark user account as deleted
   */
  static async markAsDeleted(uid: string): Promise<void> {
    try {
      const userRef = doc(firestore, USERS_COLLECTION, uid);
      await updateDoc(userRef, {
        isDeleted: true,
        lastActive: Date.now(),
      });
    } catch (error) {
      console.error("Error marking user as deleted:", error);
      throw error;
    }
  }

  /**
   * Recover deleted account
   */
  static async recoverAccount(uid: string): Promise<void> {
    try {
      const userRef = doc(firestore, USERS_COLLECTION, uid);
      await updateDoc(userRef, {
        isDeleted: false,
        lastActive: Date.now(),
      });
    } catch (error) {
      console.error("Error recovering account:", error);
      throw error;
    }
  }

  /**
   * Update user's show name preference
   */
  static async updateShowName(uid: string, showName: boolean): Promise<void> {
    try {
      const userRef = doc(firestore, USERS_COLLECTION, uid);
      await updateDoc(userRef, {
        showName,
        lastActive: Date.now(),
      });
    } catch (error) {
      console.error("Error updating show name:", error);
      throw error;
    }
  }
}
