const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Doctor, Patient } = require('../models');
const mailjet = require('../config/email');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save to DB
        const newUser = await User.create({
            fullName,
            email,
            passwordHash: hashedPassword,
            role
        });

        // Create role-specific record
        if (role === 'doctor') {
            await Doctor.create({
                user_id: newUser.userId,
                specialization: 'General Practice', // Default specialization
                consultationFee: 0, // Default fee, can be updated later
                bio: null,
                roomNumber: null
            });
        } else if (role === 'patient') {
            await Patient.create({
                user_id: newUser.userId,
                dateOfBirth: null,
                gender: null,
                address: null,
                phoneNumber: null,
                emergencyContact: null
            });
        }

        // Send Response immediately - don't wait for anything else
        res.status(201).json({
            success: true,
            message: "User created!"
        });

        // Send Welcome Email via Mailjet (completely async, no blocking)
        // Use setImmediate to ensure this runs after the response is sent
        setImmediate(async () => {
            try {
                const request = mailjet
                    .post("send", { 'version': 'v3.1' })
                    .request({
                        "Messages": [
                            {
                                "From": {
                                    "Email": process.env.MAIL_SENDER, // Sender must be verified in Mailjet
                                    "Name": "Clinic Admin"
                                },
                                "To": [
                                    {
                                        "Email": email,
                                        "Name": fullName
                                    }
                                ],
                                "Subject": "Welcome to the Clinic!",
                                "TextPart": `Dear ${fullName},\n\nWelcome to our clinic system. Your account has been created successfully.`,
                                "HTMLPart": `<h3>Dear ${fullName},</h3><p>Welcome to our clinic system. Your account has been created successfully.</p>`
                            }
                        ]
                    });

                const result = await request;
                console.log('Welcome email sent successfully to:', email);
                console.log('Mailjet response:', result.body);
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError.statusCode, emailError.message);
                // Email failure is logged but doesn't affect registration response
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error registering user",
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find User
        const user = await User.findOne({ where: { email } });

        // Check 1: If !user
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check 2: Compare passwords
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.userId, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Return success JSON
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.userId,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error logging in",
            error: error.message
        });
    }
};
