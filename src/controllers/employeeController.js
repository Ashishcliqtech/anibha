const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const { generateAccessToken } = require('../utils/jwtUtils');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constant/Messages');

// Admin creates employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, employeeId, password } = req.body;
    if (!name || !employeeId || !password) {
      return res.status(400).json({ message: ERROR_MESSAGES.ALL_FIELDS_REQUIRED || "All fields are required." });
    }
    const existing = await Employee.findOne({ employeeId });
    if (existing) {
      return res.status(409).json({ message: ERROR_MESSAGES.DUPLICATE_EMPLOYEE_ID || "Employee ID already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = new Employee({
      name,
      employeeId,
      password: hashedPassword,
      createdBy: req.user ? req.user._id : null,
    });
    await employee.save();
    res.status(201).json({ message: SUCCESS_MESSAGES.EMPLOYEE_CREATED || "Employee created successfully.", employeeId });
  } catch (err) {
    res.status(500).json({ message: ERROR_MESSAGES.SERVER_ERROR || 'Server error', error: err.message });
  }
};

// Employee login
exports.employeeLogin = async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: ERROR_MESSAGES.EMPLOYEE_NOT_FOUND || "Employee not found." });
    }
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: ERROR_MESSAGES.INVALID_CREDENTIALS || "Invalid credentials." });
    }
    // Generate JWT for employee
    const token = generateAccessToken(employee._id, 'employee');
    res.setHeader('x-access-token', token);
    res.json({ message: SUCCESS_MESSAGES.EMPLOYEE_LOGIN_SUCCESS || "Login successful.", employee: { id: employee._id, name: employee.name, employeeId: employee.employeeId } });
  } catch (err) {
    res.status(500).json({ message: ERROR_MESSAGES.SERVER_ERROR || 'Server error', error: err.message });
  }
};

// Employee updates daily work
exports.updateDailyWork = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ message: ERROR_MESSAGES.DESCRIPTION_REQUIRED || "Description is required." });
    }
    const employee = await Employee.findById(req.user._id);
    if (!employee) {
      return res.status(404).json({ message: ERROR_MESSAGES.EMPLOYEE_NOT_FOUND || "Employee not found." });
    }
    employee.dailyWork.push({ description });
    await employee.save();
    res.json({ message: SUCCESS_MESSAGES.DAILY_WORK_UPDATED || "Daily work updated successfully." });
  } catch (err) {
    res.status(500).json({ message: ERROR_MESSAGES.SERVER_ERROR || 'Server error', error: err.message });
  }
};

// Admin: Get all employees' daily work
exports.getAllEmployeesDailyWork = async (req, res) => {
  try {
    const employees = await Employee.find({}, 'name employeeId dailyWork');
    const result = employees.map(emp => ({
      employeeId: emp.employeeId,
      name: emp.name,
      dailyWork: emp.dailyWork
    }));
    res.json({ employees: result });
  } catch (err) {
    res.status(500).json({ message: ERROR_MESSAGES.SERVER_ERROR || 'Server error', error: err.message });
  }
};
