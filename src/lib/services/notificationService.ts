/**
 * Notification Service
 *
 * This service handles push notifications for the matchmaking application.
 * It provides methods for sending different types of notifications to users.
 */

export type NotificationType =
  | "new_match"
  | "message"
  | "profile_view"
  | "subscription_expiring"
  | "verification_approved"
  | "verification_rejected"
  | "system";

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  link?: string;
  timestamp?: Date;
}

export interface NotificationPreferences {
  newMatches: boolean;
  messages: boolean;
  profileViews: boolean;
  subscriptionAlerts: boolean;
  verificationUpdates: boolean;
  systemAnnouncements: boolean;
}

/**
 * Default notification preferences for new users
 */
export const defaultNotificationPreferences: NotificationPreferences = {
  newMatches: true,
  messages: true,
  profileViews: true,
  subscriptionAlerts: true,
  verificationUpdates: true,
  systemAnnouncements: true,
};

/**
 * Notification Service class for handling push notifications
 */
export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  /**
   * Get the singleton instance of NotificationService
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // In a real implementation, this would initialize the push notification service
      // such as Firebase Cloud Messaging, OneSignal, etc.
      console.log("Initializing notification service...");

      // Check if browser supports notifications
      if (typeof window !== "undefined" && "Notification" in window) {
        // Request permission
        const permission = await Notification.requestPermission();
        this.isInitialized = permission === "granted";
      }

      return this.isInitialized;
    } catch (error) {
      console.error("Failed to initialize notification service:", error);
      return false;
    }
  }

  /**
   * Send a notification to a user
   */
  public async sendNotification(
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // In a real implementation, this would send the notification through a service
      console.log("Sending notification:", payload);

      // For browser notifications in development
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const notification = new Notification(payload.title, {
          body: payload.body,
          icon: payload.imageUrl || "/logo.png",
          data: payload.data,
        });

        if (payload.link) {
          notification.onclick = () => {
            window.open(payload.link);
          };
        }
      }

      // Store notification in database (would be implemented in a real app)
      await this.storeNotification(payload);

      return true;
    } catch (error) {
      console.error("Failed to send notification:", error);
      return false;
    }
  }

  /**
   * Store notification in database for history
   */
  private async storeNotification(payload: NotificationPayload): Promise<void> {
    // In a real implementation, this would store the notification in a database
    // for notification history and to handle offline users
    console.log("Storing notification in database:", payload);

    // Mock implementation
    const notification = {
      ...payload,
      timestamp: payload.timestamp || new Date(),
      read: false,
    };

    // This would be a database call in a real implementation
    console.log("Notification stored:", notification);
  }

  /**
   * Send a new match notification
   */
  public async sendNewMatchNotification(
    userId: string,
    matchName: string,
    matchId: string,
    compatibilityScore: number,
    matchImageUrl?: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: "new_match",
      title: "New Match!",
      body: `You matched with ${matchName} with ${compatibilityScore}% compatibility!`,
      data: { matchId, compatibilityScore },
      imageUrl: matchImageUrl,
      link: `/matches/${matchId}`,
    });
  }

  /**
   * Send a new message notification
   */
  public async sendNewMessageNotification(
    userId: string,
    senderName: string,
    senderId: string,
    messagePreview: string,
    senderImageUrl?: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: "message",
      title: `New message from ${senderName}`,
      body: messagePreview,
      data: { senderId },
      imageUrl: senderImageUrl,
      link: `/chat/${senderId}`,
    });
  }

  /**
   * Send a profile view notification
   */
  public async sendProfileViewNotification(
    userId: string,
    viewerName: string,
    viewerId: string,
    viewerImageUrl?: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: "profile_view",
      title: "Someone viewed your profile",
      body: `${viewerName} just checked out your profile!`,
      data: { viewerId },
      imageUrl: viewerImageUrl,
      link: `/profile/${viewerId}`,
    });
  }

  /**
   * Send a subscription expiring notification
   */
  public async sendSubscriptionExpiringNotification(
    userId: string,
    daysLeft: number
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: "subscription_expiring",
      title: "Subscription Expiring Soon",
      body: `Your premium subscription will expire in ${daysLeft} days. Renew now to keep your benefits!`,
      data: { daysLeft },
      link: "/subscription",
    });
  }

  /**
   * Send a verification approved notification
   */
  public async sendVerificationApprovedNotification(
    userId: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: "verification_approved",
      title: "Profile Verification Approved",
      body: "Congratulations! Your profile has been verified. Your profile will now be shown to more potential matches.",
      link: "/profile",
    });
  }

  /**
   * Send a verification rejected notification
   */
  public async sendVerificationRejectedNotification(
    userId: string,
    reason: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: "verification_rejected",
      title: "Profile Verification Rejected",
      body: `Your profile verification was rejected. Reason: ${reason}. Please try again with the suggested improvements.`,
      data: { reason },
      link: "/profile/verification",
    });
  }

  /**
   * Send a system announcement notification
   */
  public async sendSystemAnnouncementNotification(
    userId: string,
    title: string,
    body: string,
    link?: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: "system",
      title,
      body,
      link,
    });
  }

  /**
   * Update a user's notification preferences
   */
  public async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      // In a real implementation, this would update the user's preferences in the database
      console.log(
        `Updating notification preferences for user ${userId}:`,
        preferences
      );

      // This would be a database call in a real implementation
      return true;
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      return false;
    }
  }

  /**
   * Get a user's notification preferences
   */
  public async getNotificationPreferences(
    userId: string
  ): Promise<NotificationPreferences> {
    try {
      // In a real implementation, this would fetch the user's preferences from the database
      console.log(`Fetching notification preferences for user ${userId}`);

      // This would be a database call in a real implementation
      // For now, return default preferences
      return defaultNotificationPreferences;
    } catch (error) {
      console.error("Failed to get notification preferences:", error);
      return defaultNotificationPreferences;
    }
  }
}
