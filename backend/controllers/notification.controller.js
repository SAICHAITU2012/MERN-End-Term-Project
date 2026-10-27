import Notification from "../models/notification.model.js";

// GET /api/notifications
export const getNotifications = async (req, res, next) => {
    try {
        const limit = Math.min(100, Number(req.query.limit) || 50);
        // caregivers see caregiver + broadcast + personal notifications;
        // members see broadcast + personal
        const audienceFilter =
            req.user.role === "caregiver"
                ? { audience: { $in: ["caregivers", "all", "user"] } }
                : { audience: { $in: ["all", "user"] } };

        const query = {
            family: req.user.family,
            ...audienceFilter,
            $or: [{ user: null }, { user: req.user._id }],
        };

        const rows = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        const notifications = rows.map((item) => ({
            ...item,
            isRead: Boolean(item.isRead || item.readBy?.some((id) => String(id) === String(req.user._id))),
        }));
        const unreadCount = notifications.filter((item) => !item.isRead).length;

        res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        next(error);
    }
};

// POST /api/notifications/read  { ids: [...] }
export const markRead = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const audienceFilter = req.user.role === "caregiver"
            ? { audience: { $in: ["caregivers", "all", "user"] } }
            : { audience: { $in: ["all", "user"] } };
        const visibleQuery = {
            family: req.user.family,
            ...audienceFilter,
            $or: [{ user: null }, { user: req.user._id }],
        };
        const idFilter = Array.isArray(ids) && ids.length ? { _id: { $in: ids } } : {};
        const personalQuery = { ...visibleQuery, user: req.user._id, isRead: false, ...idFilter };
        const sharedQuery = { ...visibleQuery, user: null, isRead: false, ...idFilter };
        await Promise.all([
            Notification.updateMany(personalQuery, { isRead: true }),
            Notification.updateMany(sharedQuery, { $addToSet: { readBy: req.user._id } }),
        ]);
        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        next(error);
    }
};
