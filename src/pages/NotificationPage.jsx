import React, { useEffect, useState } from "react";
import Layout from "../pages/Layout";
import "../styles/NotificationPageStyle.css";
import { getNotifications, markNotificationRead, deleteNotification } from "../db/queries";

// --- COLOR PALETTE (used in icon SVGs only, not for layout) ---
const notificationPalette = {
  accent: "#F3C623",
  accent2: "#FFB22C",
  accent3: "#FA812F",
  unreadBg: "#FFF7E0",
  readBg: "#EAEFEF",
  border: "#EAEFEF",
  dot: "#FA812F",
  text: "#333446",
  textLight: "#8A857A",
};

// --- NOTIFICATION ICON ---
function NotifTypeIcon({ type }) {
  if (type === "reminder")
    return (
      <span className={`notification-type-icon ${type}`} title="Reminder">
        <svg width="26" height="27" fill="none">
          <circle cx="13" cy="13" r="13" fill={notificationPalette.accent + "33"} />
          <path d="M13 7v7l5 3" stroke={notificationPalette.accent3} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </span>
    );
  if (type === "success")
    return (
      <span className={`notification-type-icon ${type}`} title="Success">
        <svg width="26" height="27" fill="none">
          <circle cx="13" cy="13" r="13" fill={notificationPalette.accent2 + "33"} />
          <path d="M8 13l4 4 6-7" stroke={notificationPalette.accent2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  return (
    <span className={`notification-type-icon ${type}`} title="Info">
      <svg width="26" height="27" fill="none">
        <circle cx="13" cy="13" r="13" fill={notificationPalette.accent3 + "22"} />
        <circle cx="13" cy="17.5" r="1.3" fill={notificationPalette.accent3} />
        <rect x="12" y="8" width="2" height="7" rx="1" fill={notificationPalette.accent3}/>
      </svg>
    </span>
  );
}

// --- REAL NOTIFICATIONS ---
export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifs() {
      setLoading(true);
      try {
        const notifs = await getNotifications();
        setNotifications(notifs || []);
      } catch {
        setNotifications([]);
      }
      setLoading(false);
    }
    fetchNotifs();
  }, []);

  const handleMarkRead = async (notifId) => {
    await markNotificationRead(notifId);
    setNotifications((prev) => prev.map(n => n.notification_id === notifId ? { ...n, read_status: 1 } : n));
  };

  const handleDelete = async (notifId) => {
    await deleteNotification(notifId);
    setNotifications((prev) => prev.filter(n => n.notification_id !== notifId));
  };

  // Responsive padding for the notification main content
  useEffect(() => {
    const main = document.getElementById("main-notification");
    if (main) {
      if (window.innerWidth <= 480) {
        main.style.paddingLeft = "0.15rem";
        main.style.paddingRight = "0.15rem";
      } else {
        main.style.paddingLeft = "0.5rem";
        main.style.paddingRight = "0.5rem";
      }
    }
    const handleResize = () => {
      if (main) {
        if (window.innerWidth <= 480) {
          main.style.paddingLeft = "0.15rem";
          main.style.paddingRight = "0.15rem";
        } else {
          main.style.paddingLeft = "0.5rem";
          main.style.paddingRight = "0.5rem";
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Layout>
      <main id="main-notification" className="notification-main">
        <h1 className="notification-title">Notifications</h1>
        <div className="notification-list">
          {loading ? (
            <div className="notification-card">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-card">No notifications.</div>
          ) : notifications.map((notif) => (
            <div
              key={notif.notification_id}
              className={`notification-card${notif.read_status ? " read" : " unread"}`}
            >
              <div className={`notification-dot${notif.read_status ? " read" : ""}`} />
              <NotifTypeIcon type={notif.type} />
              <div className="notification-content">
                <span className="notification-title-text">{notif.message}</span>
                <span className="notification-msg">{notif.scheduled_for ? new Date(notif.scheduled_for).toLocaleString() : ''}</span>
                <span className="notification-time">{notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 8 }}>
                {!notif.read_status && (
                  <button onClick={() => handleMarkRead(notif.notification_id)} style={{ fontSize: 12, color: '#1da1f2', background: 'none', border: 'none', cursor: 'pointer' }}>Mark as read</button>
                )}
                <button onClick={() => handleDelete(notif.notification_id)} style={{ fontSize: 12, color: '#fa812f', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}