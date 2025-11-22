const Blog = require("../models/blogModel");
const { AppError, catchAsync } = require("../utils/errorUtils");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} = require("../utils/constant/Messages");
const logger = require("../utils/logger");
const successResponse = require("../utils/successResponse");
const emptyListResponse = require("../utils/emptyListResponse");

// Create a new blog post
exports.createBlog = catchAsync(async (req, res, next) => {
  if (req.body.createdBy) {
    delete req.body.createdBy;
  }
  req.body.createdBy = req.user ? req.user.id : null;

  const newBlog = await Blog.create(req.body);

  res.status(201).json({
    success: true,
    message: SUCCESS_MESSAGES.BLOG_CREATED,
    data: { blog: newBlog },
  });
});

// Get all blog posts
exports.getAllBlogs = catchAsync(async (req, res, next) => {
  const blogs = await Blog.find({ isActive: true })
    .sort({ createdAt: -1 })
    .populate({
      path: "createdBy",
      select: "name email",
    });

  if (!blogs || blogs.length === 0) {
    return emptyListResponse(res, "No blogs found", "blogs");
  }
  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.BLOG_FETCHED,
    results: blogs.length,
    data: { blogs },
  });
});

// NEW: Get all Blog (for admin) - active and inactive
exports.getAllBlogForAdmin = catchAsync(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {}; // Admins see all blogs by default

  // Filter by active status (assuming blogs have an 'isActive' field)
  if (req.query.isActive !== undefined && req.query.isActive !== null) {
    filter.isActive = req.query.isActive === "true";
  }

  // Filter by search term (assuming blogs have 'title' and 'description' fields)
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i");
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const query = Blog.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }) // Sort by creation date, newest first
    .populate("createdBy", "name email");

  const [blogs, total] = await Promise.all([
    query,
    Blog.countDocuments(filter),
  ]);

  if (!blogs || blogs.length === 0) {
    return emptyListResponse(res, "No blogs found", "blogs", {
      pagination: {
        totalBlogs: 0,
        totalPages: 1,
        currentPage: page,
        pageSize: limit,
      },
    });
  }
  res.status(200).json({
    success: true,
    message: "Successfully fetched blogs for admin.",
    count: blogs.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: { blogs },
  });
});

// Get a single blog post by ID
exports.getBlogbyId = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOne({
    _id: req.params.id,
    isActive: true,
  }).populate({
    path: "createdBy",
    select: "name email",
  });

  if (!blog) {
    return next(new AppError(ERROR_MESSAGES.BLOG_NOT_FOUND, 404));
  }

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.BLOG_FETCHED,
    data: { blog },
  });
});

// Update a blog post by ID
exports.updateBlog = catchAsync(async (req, res, next) => {
  if (req.body.createdBy) {
    return next(new AppError(ERROR_MESSAGES.BLOG_UPDATE_FORBIDDEN, 400));
  }

  const blog = await Blog.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!blog) {
    return next(new AppError(ERROR_MESSAGES.BLOG_NOT_FOUND, 404));
  }

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.BLOG_UPDATED,
    data: { blog },
  });
});

// Delete a blog post (soft delete)
exports.deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    { isActive: false },
    { new: true }
  );

  if (!blog) {
    return next(new AppError(ERROR_MESSAGES.BLOG_NOT_FOUND, 404));
  }

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.BLOG_DELETED,
    data: null,
  });
});

exports.getBlogbyIdAdmin = catchAsync(async (req, res, next) => {
  const requestedBlogId = req.params.id;

  const blog = await Blog.findById(requestedBlogId);
  if (!blog) {
    return next(new AppError(ERROR_MESSAGES.BLOG_NOT_FOUND, 404));
  }
  successResponse(res, 200, SUCCESS_MESSAGES.BLOG_FETCHED, {
    blog,
  });
});
