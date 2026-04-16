import Donation from "../models/Donation.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

export const getMyDonorProfile = async (req, res, next) => {
  try {
    const donor = await User.findById(req.user._id);
    const history = await Donation.find({ donorId: req.user._id }).populate("requestId", "type urgency hospitalName");
    res.json({ donor, history });
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const donor = await User.findByIdAndUpdate(
      req.user._id,
      { isAvailable: Boolean(req.body.isAvailable) },
      { new: true }
    );
    res.json({ message: "Availability updated", donor });
  } catch (error) {
    next(error);
  }
};

export const toggleSmsAlerts = async (req, res, next) => {
  try {
    const donor = await User.findByIdAndUpdate(
      req.user._id,
      { smsAlertsEnabled: Boolean(req.body.smsAlertsEnabled) },
      { new: true }
    );
    res.json({ message: "SMS preference updated", donor });
  } catch (error) {
    next(error);
  }
};

export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const getPublicDonorProfile = async (req, res, next) => {
  try {
    const donor = await User.findOne({ _id: req.params.id, role: "donor", isVerified: true }).select(
      "name bloodGroup location.city donationCount createdAt"
    );
    if (!donor) return res.status(404).json({ message: "Donor not found" });
    res.json({
      id: donor._id,
      name: donor.name.split(" ")[0],
      bloodGroup: donor.bloodGroup,
      city: donor.location?.city,
      donationCount: donor.donationCount,
      memberSince: donor.createdAt
    });
  } catch (error) {
    next(error);
  }
};
