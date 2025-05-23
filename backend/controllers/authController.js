import Employee from "../models/EmployeeModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret";
//const SECRET_KEY =  "your_jwt_secret";
console.log("JWT_SECRET from controller:",SECRET_KEY); //remove this line in production
// Employee Login Function
export const loginEmployee = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if employee exists
        const employee = await Employee.findOne({ username });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found." });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid username or password " });
        }

        // Generate JWT token with permissions
        const token = jwt.sign(
            {
                id: employee._id,
                username: employee.username,
                name: employee.name,               //  full name
                employeeId: employee.employeeId,
                position: employee.position,
                permissions: employee.permissions //Store permissions in token
            },
            SECRET_KEY,
            { expiresIn: "1h" }
        );
        console.log("JWT Token:", token); //remove this line in production

        res.status(200).json({ message: "Login Successful - authController.", token });
    } catch (error) {
        res.status(500).json({ message: "Server Error - authController.", error: error.message });
    }
};
