import { db } from '../config/firebase.js';
import { generateRandomID } from '../utils/helpers.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createNotification } from './notificationController.js';
import { generateOtpCode, validateCaptcha } from '../utils/authHelpers.js';
import { sendOtpEmail } from '../utils/emailService.js';

const getUserDocByUsername = async (username) => {
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('username', '==', username).get();

    if (querySnapshot.empty) {
        return null;
    }

    let userDoc = null;
    querySnapshot.forEach(doc => {
        userDoc = doc;
    });

    return userDoc;
};

const getUserDocByEmail = async (email) => {
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('email', '==', email).get();

    if (querySnapshot.empty) {
        return null;
    }

    let userDoc = null;
    querySnapshot.forEach(doc => {
        userDoc = doc;
    });

    return userDoc;
};

/**
 * Generates a signed JWT token
 */
const generateToken = (userID, username) => {
    return jwt.sign(
        { userID, username },
        process.env.JWT_SECRET || 'travelsaathi-pro-secret-key',
        { expiresIn: '30d' }
    );
};

/**
 * Register a new user with password hashing and JWT issuance
 * POST /api/users/register
 */
export const registerUser = async (req, res) => {
    const { username, password, email } = req.body;

    try {
        const usersRef = db.collection('users');
        const existingByUsername = await usersRef.where('username', '==', username).get();
        const existingByEmail = email ? await usersRef.where('email', '==', email).get() : { empty: true };
        
        if (!existingByUsername.empty || !existingByEmail.empty) {
            return res.json("userexists");
        }

        let randomID;
        let idExists = true;
        do {
            randomID = await generateRandomID();
            const idSnapshot = await usersRef.where('userID', '==', randomID).get();
            idExists = !idSnapshot.empty;
        } while (idExists);

        // Hash password with salt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username,
            email: email || '',
            password: hashedPassword,
            userID: randomID,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await usersRef.add(newUser);

        // Issue JWT token
        const token = generateToken(randomID, username);

        res.json({
            status: "accountcreated",
            userID: randomID,
            token
        });
    } catch (error) {
        console.error("Error in registration:", error);
        res.json("usernotfound");
    }
};

/**
 * Login user with password comparisons and JWT generation
 * POST /api/users/login
 */
export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('username', '==', username).get();
        
        if (querySnapshot.empty) {
            return res.json("usernotfound");
        }

        let user;
        querySnapshot.forEach(doc => {
            user = doc.data();
        });

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = generateToken(user.userID, user.username);
            await createNotification({
                recipient: user.username,
                title: 'Welcome back!',
                message: 'You signed in successfully to TravelSaathi.',
                type: 'success',
                metadata: { source: 'login' }
            });
            res.json({
                status: "userfound",
                userID: user.userID,
                token
            });
        } else {
            res.json("usernotfound");
        }
    } catch (error) {
        console.error("Error in login:", error);
        res.json("usernotfound");
    }
};

export const socialLogin = async (req, res) => {
    const { provider, email, username } = req.body;

    try {
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('email', '==', email).get();

        let userDoc;
        if (!querySnapshot.empty) {
            querySnapshot.forEach(doc => {
                userDoc = doc;
            });
        }

        const resolvedUsername = username || email.split('@')[0];
        if (!userDoc) {
            const randomID = await generateRandomID();
            const newUser = {
                username: resolvedUsername,
                email,
                provider,
                userID: randomID.toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const createdDoc = await usersRef.add(newUser);
            userDoc = { id: createdDoc.id, data: () => newUser };
        }

        const user = userDoc.data();
        const token = generateToken(user.userID, user.username);
        await createNotification({
            recipient: user.username,
            title: `${provider} login enabled`,
            message: `You signed in with ${provider} successfully.`,
            type: 'success',
            metadata: { source: 'social-login' }
        });
        res.json({ status: 'social-authenticated', userID: user.userID, token, username: user.username });
    } catch (error) {
        console.error('Error in social login:', error);
        res.status(500).json({ message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    const { email, otp, newPassword, captchaAnswer, captchaQuestion } = req.body;

    if (!email || !otp || !newPassword || !captchaQuestion || typeof captchaAnswer !== 'number') {
        return res.status(400).json({ message: 'Email, OTP, new password, and captcha answer are required' });
    }

    if (!validateCaptcha(captchaQuestion, captchaAnswer)) {
        return res.status(400).json({ message: 'Captcha verification failed' });
    }

    try {
        const userDoc = await getUserDocByEmail(email);

        if (!userDoc) {
            return res.json({ status: 'usernotfound' });
        }

        const user = userDoc.data();
        const storedOtp = user.resetOtp;
        const otpExpiry = user.resetOtpExpiry;

        if (!storedOtp || !otpExpiry || storedOtp !== otp || Date.now() > otpExpiry) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await userDoc.ref.update({
            password: hashedPassword,
            resetOtp: null,
            resetOtpExpiry: null,
            updatedAt: new Date().toISOString()
        });

        await createNotification({
            recipient: user.username,
            title: 'Password reset complete',
            message: 'Your password was updated successfully.',
            type: 'success',
            metadata: { source: 'password-reset' }
        });

        res.json({ status: 'passwordupdated' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: error.message });
    }
};

export const requestPasswordReset = async (req, res) => {
    const { email, captchaAnswer, captchaQuestion } = req.body;

    if (!email || !captchaQuestion || typeof captchaAnswer !== 'number') {
        return res.status(400).json({ message: 'Email and captcha answer are required' });
    }

    if (!validateCaptcha(captchaQuestion, captchaAnswer)) {
        return res.status(400).json({ message: 'Captcha verification failed' });
    }

    try {
        const userDoc = await getUserDocByEmail(email);

        if (!userDoc) {
            return res.json({ status: 'usernotfound' });
        }

        const otp = generateOtpCode();
        const expiry = Date.now() + 10 * 60 * 1000;

        await userDoc.ref.update({
            resetOtp: otp,
            resetOtpExpiry: expiry,
            updatedAt: new Date().toISOString()
        });

        const emailAddress = userDoc.data().email;
        if (emailAddress) {
            await sendOtpEmail({
                to: emailAddress,
                otp,
                username: userDoc.data().username
            });
        }

        await createNotification({
            recipient: userDoc.data().username,
            title: 'Password reset requested',
            message: `A reset OTP was sent to ${emailAddress || 'your email'}.`,
            type: 'info',
            metadata: { source: 'password-reset-request' }
        });

        res.json({ status: 'otpsent' });
    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({ message: error.message });
    }
};

export const changePassword = async (req, res) => {
    const username = req.user.username;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ message: 'New password is required' });
    }

    try {
        const userDoc = await getUserDocByUsername(username);

        if (!userDoc) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userDoc.data();

        if (user.password) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required' });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await userDoc.ref.update({
            password: hashedPassword,
            updatedAt: new Date().toISOString()
        });

        await createNotification({
            recipient: username,
            title: 'Password updated',
            message: 'Your password was changed successfully.',
            type: 'success',
            metadata: { source: 'password-change' }
        });

        res.json({ status: 'passwordupdated' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: error.message });
    }
};
