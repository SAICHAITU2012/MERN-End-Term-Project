import Notification from "../models/notification.model.js";

// GET /api/notifications
export const getNotifications = async (req, res, next) => {
    try {
        const limit = Math.min(100, Number(req.query.limit) || 50);
        // caregivers see caregiver + broadcast + personal notifications;
        // members see broadcast + personal
        const audienceFilter =
            req.user.role === "caregiver"
                ? { audience: { $in: ["caregivers", "all"] } }
                : { audience: "all" };

        const query = {
            family: req.user.family,
            ...audienceFilter,
            $or: [{ user: null }, { user: req.user._id }],
        };

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

        res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        next(error);
    }
};

// POST /api/notifications/read  { ids: [...] }
export const markRead = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const query = { family: req.user.family, isRead: false };
        if (Array.isArray(ids) && ids.length) {
            query._id = { $in: ids };
        }
        await Notification.updateMany(query, { isRead: true });
        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        next(error);
    }
};
