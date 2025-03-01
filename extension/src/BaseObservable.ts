type Notification<T> = (listener: T) => void;

// Not an interface because it provides concrete method implementations
// and maintains internal state
// Not a Class because it should only be extended and not instantiated
export abstract class BaseObservable<T> {
  private listeners: T[] = [];
  private notifications: Notification<T>[] = [];

  notifyListeners(notification: Notification<T>) {
    // no listeners to notify
    if (this.listeners.length === 0) {
      console.warn(
        "No listeners registered to notify in this:" +
          this.constructor.name +
          ", function: " +
          notification
      );
      // store callback fct in the notification array
      this.notifications.push(notification);
    }
    // iterate over the listeners and invode the given notification
    this.listeners.forEach((listener) => notification(listener));
  }
  registerListener(listener: T): void {
    // no listeners and pending notifications
    if (this.listeners.length == 0 && this.notifications.length !== 0) {
      console.warn("registerListener later: " + this.constructor.name);
      // processes each pending notification by invoking the
      // stored callback functions on the newly registered listener.
      this.notifications.forEach((notification) => notification(listener));
      this.notifications = [];
    }
    console.debug("registerListener: " + listener);
    // add the new listener to the listeners array
    this.listeners.push(listener);
  }
}
