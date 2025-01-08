import { getUserByEmail, insertAnnouncement, getNotification} from '../models/announcementModel.js';
import {sendAnnouncementEmail} from '../middlewares/emailService.js'; // Assuming you have this file

export async function createAnnouncement(req, res) {
    try {
        const { to, subject, Priority, message } = req.body;
        console.log('Announcement:', req.body);
        // Check if the email exists
        const targetUser = await getUserByEmail(to);
        if (!targetUser) {
            // If email is invalid
            return res.render('Doctor/Home', {
                alertMessage: 'Invalid email address. Please try again.',
                alertType: 'error', // Red background for error
            });
        }

        const createdBy = req.session.user.User_ID;
        // Insert the announcement into the database
        await insertAnnouncement(subject, message, targetUser.User_ID, Priority, createdBy);

        // Send the email after successfully adding the announcement
        const { FName, LName } = targetUser;
        const fullName = `${FName} ${LName}`;
        await sendAnnouncementEmail(to, fullName, subject, message);

        // Success message
        return res.render('Doctor/Home', {
            alertMessage: 'Announcement created successfully and email sent!',
            alertType: 'success', // Green background for success
        });
    } catch (error) {
        console.error('Error creating announcement:', error);

        // Error message
        res.render('Doctor/Home', {
            alertMessage: 'Internal server error. Please try again later.',
            alertType: 'error', // Red background for error
        });
    }
}

export async function fetchAnnouncements(req, res) {
    try {
      const userId = req.session.user.User_ID;
      const announcements = await getNotification(userId);
  
      res.render('Doctor/Notifications', { announcements });
    } catch (error) {
      res.status(500).send('Error fetching announcements: ' + error.message);
    }
  }
