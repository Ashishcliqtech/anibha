const ERROR_MESSAGES = {
  COURSE_NOT_FOUND: "Course not found.",
  EVENT_NOT_FOUND: "Event not found.",
  BLOG_NOT_FOUND: "Blog not found.",
  COURSE_DELETE_FORBIDDEN: "You do not have permission to delete this course.",
  EVENT_DELETE_FORBIDDEN: "You do not have permission to delete this event.",
  BLOG_DELETE_FORBIDDEN: "You do not have permission to delete this blog.",
  COURSE_UPDATE_FORBIDDEN: "You do not have permission to update this course.",
  EVENT_UPDATE_FORBIDDEN: "You do not have permission to update this event.",
  BLOG_UPDATE_FORBIDDEN: "You do not have permission to update this blog.",
  DUPLICATE_COURSE: "A course with this title already exists.",
  DUPLICATE_EVENT: "An event with this title already exists.",
  DUPLICATE_BLOG: "A blog with this title already exists.",
  INVALID_COURSE_ID: "Invalid course ID.",
  INVALID_EVENT_ID: "Invalid event ID.",
  INVALID_BLOG_ID: "Invalid blog ID.",
  IMAGE_UPLOAD_FAILED: "Image upload to Cloudinary failed. Please try again.",
  FILE_UPLOAD_ERROR: "File upload error.",
  PDF_UPLOAD_FAILED: "PDF upload to Cloudinary failed.",
  INVALID_IMAGE_FILE: "Only image files are allowed.",
  INVALID_PDF_FILE: "Only PDF files are allowed.",
  FILE_SIZE_EXCEEDED: "File size exceeds the allowed limit.",
  CERTIFICATE_NOT_FOUND: "Certificate not found.",
  CERTIFICATE_CREATE_FORBIDDEN: "You do not have permission to create a certificate.",
  CERTIFICATE_DOWNLOAD_FORBIDDEN: "You do not have permission to download this certificate."
  // Add more as needed...
};

// Cart / Order / Wishlist errors
ERROR_MESSAGES.CART_NOT_FOUND = "Cart not found.";
ERROR_MESSAGES.CART_EMPTY = "Cart is empty.";
ERROR_MESSAGES.INSUFFICIENT_STOCK = "Insufficient stock for one or more products.";
ERROR_MESSAGES.ORDER_NOT_FOUND = "Order not found.";
ERROR_MESSAGES.WISHLIST_NOT_FOUND = "Wishlist not found.";
ERROR_MESSAGES.COUPON_NOT_FOUND = "Coupon not found.";
ERROR_MESSAGES.COUPON_INVALID = "Coupon is invalid or not applicable.";

const SUCCESS_MESSAGES = {
  COURSE_CREATED: "Course created successfully.",
  COURSE_UPDATED: "Course updated successfully.",
  COURSE_DELETED: "Course deleted successfully.",
  EVENT_CREATED: "Event created successfully.",
  EVENT_UPDATED: "Event updated successfully.",
  EVENT_DELETED: "Event deleted successfully.",
  BLOG_CREATED: "Blog created successfully.",
  BLOG_UPDATED: "Blog updated successfully.",
  BLOG_DELETED: "Blog deleted successfully.",
  COURSE_FETCHED: "Course fetched successfully.",
  EVENT_FETCHED: "Event fetched successfully.",
  BLOG_FETCHED: "Blog fetched successfully.",
  CERTIFICATE_CREATED: "Certificate created successfully.",
  CERTIFICATE_FETCHED: "Certificate fetched successfully.",
  // Product messages
  PRODUCT_CREATED: "Product created successfully.",
  PRODUCT_UPDATED: "Product updated successfully.",
  PRODUCT_DELETED: "Product deleted successfully.",
  PRODUCT_FETCHED: "Product fetched successfully.",
  // Cart / Order / Wishlist success messages
  CART_UPDATED: "Cart updated successfully.",
  CART_CLEARED: "Cart cleared successfully.",
  ORDER_CREATED: "Order created successfully.",
  ORDER_FETCHED: "Order(s) fetched successfully.",
  WISHLIST_UPDATED: "Wishlist updated successfully.",
  WISHLIST_FETCHED: "Wishlist fetched successfully.",
  COUPON_CREATED: "Coupon created successfully.",
  COUPON_UPDATED: "Coupon updated successfully.",
  COUPON_VALID: "Coupon is valid.",
  PAYMENT_REQUEST_CREATED: "Payment request created.",
  PAYMENT_CONFIRMED: "Payment confirmed successfully.",
  PAYMENT_FAILED: "Payment failed.",
  // Add more as needed...
};

// Add product-related error messages
ERROR_MESSAGES.PRODUCT_REQUIRED_FIELDS = "Required product fields are missing (name, description, price).";
ERROR_MESSAGES.PRODUCT_NOT_FOUND = "Product not found.";
ERROR_MESSAGES.PRODUCT_ID_REQUIRED = "Product id is required.";

const OTHER_CONSTANTS = {
  // Define any other constants that are not error or success messages
};

module.exports = {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  OTHER_CONSTANTS,
};
