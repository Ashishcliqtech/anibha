
# Product and Product Management API Guide (Detailed)

## Introduction

This document provides a comprehensive guide for interacting with the product and product management APIs. It includes a Postman collection with detailed explanations, full payload and response examples, and clear instructions for frontend integration. The examples are derived directly from the project's codebase (`productController.js` and `productService.js`).

## Postman Collection

Import the following JSON into Postman. For best results, set up a Postman environment with a `baseURL` (e.g., `http://localhost:3000`) and an `authToken` for admin-only routes.

```json
{
	"info": {
		"_postman_id": "b8a3e4e4-1b1e-4b7b-9e4a-5e8a7f7d6a7c",
		"name": "Detailed Product Management API",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
	},
	"item": [
		{
			"name": "Get All Products (Public)",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "{{baseURL}}/api/v1/products?limit=10&page=1&category=Jewellery&sortBy=price&order=asc",
					"host": ["{{baseURL}}"],
					"path": ["api", "v1", "products"],
					"query": [
						{"key": "limit", "value": "10"},
						{"key": "page", "value": "1"},
						{"key": "category", "value": "Jewellery"},
						{"key": "sortBy", "value": "price"},
						{"key": "order", "value": "asc"}
					]
				}
			},
			"response": []
		},
		{
			"name": "Get Product by ID (Public)",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "{{baseURL}}/api/v1/products/60d21b4667d0d8992e610c85",
					"host": ["{{baseURL}}"],
					"path": ["api", "v1", "products", "60d21b4667d0d8992e610c85"]
				}
			},
			"response": []
		},
		{
			"name": "Admin: Create Product",
			"request": {
				"method": "POST",
				"header": [{"key": "Authorization", "value": "Bearer {{authToken}}", "type": "text"}],
				"body": {
					"mode": "formdata",
					"formdata": [
						{"key": "name", "value": "Elegant Gold-Plated Necklace", "type": "text"},
						{"key": "description", "value": "A stunning piece of jewellery, perfect for all occasions. Features a unique design with intricate details.", "type": "text"},
						{"key": "mrp", "value": "1299.00", "type": "text"},
						{"key": "discountPercent", "value": "15", "type": "text"},
						{"key": "sku", "value": "ELEG-NECK-002", "type": "text"},
						{"key": "category", "value": "Jewellery", "type": "text"},
						{"key": "material", "value": "Alloy", "type": "text"},
						{"key": "stock", "value": "50", "type": "text"},
						{"key": "tags", "value": "gold,necklace,jewellery,elegant", "type": "text"},
						{"key": "images", "type": "file", "src": []}
					]
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/admin/create-products",
					"host": ["{{baseURL}}"],
					"path": ["api", "v1", "admin", "create-products"]
				}
			},
			"response": []
		},
		{
			"name": "Admin: Update Product",
			"request": {
				"method": "PATCH",
				"header": [{"key": "Authorization", "value": "Bearer {{authToken}}", "type": "text"}],
				"body": {
					"mode": "raw",
					"raw": "{
    "name": "Exquisite Gold-Plated Necklace",
    "mrp": 1399,
    "discountPercent": 20
}",
					"options": {"raw": {"language": "json"}}
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/admin/products/60d21b4667d0d8992e610c85",
					"host": ["{{baseURL}}"],
					"path": ["api", "v1", "admin", "products", "60d21b4667d0d8992e610c85"]
				}
			},
			"response": []
		},
        {
			"name": "Admin: Update Stock",
			"request": {
				"method": "PATCH",
				"header": [{"key": "Authorization", "value": "Bearer {{authToken}}", "type": "text"}],
				"body": {
					"mode": "raw",
					"raw": "{
    "stock": 75
}",
					"options": {"raw": {"language": "json"}}
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/admin/products/60d21b4667d0d8992e610c85/stock",
					"host": ["{{baseURL}}"],
					"path": ["api", "v1", "admin", "products", "60d21b4667d0d8992e610c85", "stock"]
				}
			},
			"response": []
		},
		{
			"name": "Admin: Delete Product (Soft)",
			"request": {
				"method": "PATCH",
				"header": [{"key": "Authorization", "value": "Bearer {{authToken}}", "type": "text"}],
				"url": {
					"raw": "{{baseURL}}/api/v1/admin/delete-products/60d21b4667d0d8992e610c85",
					"host": ["{{baseURL}}"],
					"path": ["api", "v1", "admin", "delete-products", "60d21b4667d0d8992e610c85"]
				}
			},
			"response": []
		}
	]
}
```

---

## **1. Get All Products (Public)**

This endpoint retrieves a paginated and filterable list of products. It is publicly accessible.

*   **Endpoint:** `GET /api/v1/products`
*   **Method:** `GET`

#### Query Parameters:

*   `limit` (number, optional, default: 12): The number of products to return per page.
*   `page` (number, optional, default: 1): The page number to retrieve.
*   `sortBy` (string, optional, default: 'createdAt'): The field to sort by (e.g., `price`, `name`, `createdAt`).
*   `order` (string, optional, default: 'desc'): The sort order (`asc` or `desc`).
*   `search` (string, optional): A search term to find in product names and descriptions.
*   `category` (string, optional): Filter by a specific category name.
*   `material` (string, optional): Filter by material.
*   `minPrice` / `maxPrice` (number, optional): Filter by a price range.
*   `inStock` (boolean, optional): Set to `true` to only show products with `stock > 0`.
*   `isActive` (boolean, optional, **Admin-only**): Set to `false` to view soft-deleted products.

#### Full Response Example (`200 OK`):

```json
{
    "status": "success",
    "statusCode": 200,
    "message": "Successfully fetched products.",
    "data": {
        "products": [
            {
                "_id": "60d21b4667d0d8992e610c85",
                "name": "Elegant Gold-Plated Necklace",
                "description": "A stunning piece of jewellery, perfect for all occasions.",
                "price": 1119.20,
                "mrp": 1399,
                "discountPercent": 20,
                "category": {
                    "_id": "5f...e9",
                    "name": "Jewellery"
                },
                "stock": 75,
                "images": [
                    "https://res.cloudinary.com/.../image/upload/v.../xyz.jpg"
                ],
                "sku": "ELEG-NECK-002",
                "material": "Alloy",
                "isActive": true,
                "outOfStock": false,
                "createdAt": "2023-01-01T12:00:00.000Z",
                "updatedAt": "2023-01-02T14:30:00.000Z"
            }
        ],
        "total": 1,
        "count": 1,
        "currentPage": 1,
        "totalPages": 1
    }
}
```

---

## **2. Get Product by ID (Public)**

Retrieves a single product by its unique MongoDB `_id`.

*   **Endpoint:** `GET /api/v1/products/:id`
*   **Method:** `GET`

#### Full Response Example (`200 OK`):

```json
{
    "status": "success",
    "statusCode": 200,
    "message": "Successfully fetched the product.",
    "data": {
        "product": {
            "_id": "60d21b4667d0d8992e610c85",
            "name": "Elegant Gold-Plated Necklace",
            "description": "A stunning piece of jewellery, perfect for all occasions. Features a unique design with intricate details.",
            "price": 1119.20,
            "mrp": 1399,
            "discountPercent": 20,
            "discountAmount": null,
            "category": {
                "_id": "5f...e9",
                "name": "Jewellery"
            },
            "stock": 75,
            "images": [
                "https://res.cloudinary.com/.../image/upload/v.../xyz.jpg"
            ],
            "tags": ["gold", "necklace", "jewellery", "elegant"],
            "sku": "ELEG-NECK-002",
            "material": "Alloy",
            "metalType": null,
            "gemstones": [],
            "weight": null,
            "dimensions": null,
            "isActive": true,
            "outOfStock": false,
            "createdBy": {
                "_id": "5e...a1",
                "name": "Admin User"
            },
            "createdAt": "2023-01-01T12:00:00.000Z",
            "updatedAt": "2023-01-02T14:30:00.000Z"
        }
    }
}
```

---

## **3. Admin: Create Product**

Creates a new product. This is an admin-only endpoint and requires a `multipart/form-data` payload to handle image uploads.

*   **Endpoint:** `POST /api/v1/admin/create-products`
*   **Method:** `POST`
*   **Authorization:** `Bearer <authToken>`

#### Payload (`multipart/form-data`):

*   `name` (string, required): Product name.
*   `description` (string, required): Detailed product description.
*   `mrp` (number, required): Maximum Retail Price.
*   `discountPercent` (number, optional): A percentage discount to be applied to the MRP.
*   `stock` (number, required): The available quantity of the product.
*   `sku` (string, optional): Stock Keeping Unit.
*   `category` (string, required): The category of the product.
*   `material` (string, optional): Main material of the product.
*   `images` (file, optional): One or more image files for the product. The key should be `images` for each file.
*   `tags` (string, optional): Comma-separated tags.

**Price Logic:** The final `price` is automatically calculated on the backend: `price = mrp * (1 - discountPercent / 100)`. You only need to provide the `mrp` and an optional `discountPercent`.

#### Full Response Example (`201 Created`):

```json
{
    "status": "success",
    "statusCode": 201,
    "message": "Product created successfully.",
    "data": {
        "product": {
            "_id": "60d21b4667d0d8992e610c99",
            "name": "Elegant Gold-Plated Necklace",
            "description": "A stunning piece of jewellery...",
            "price": 1104.15,
            "mrp": 1299,
            "discountPercent": 15,
            "stock": 50,
            "images": [
                "https://res.cloudinary.com/.../image/upload/v.../new_image.jpg"
            ],
            "isActive": true,
            // ... other product fields
            "createdAt": "2023-01-05T10:00:00.000Z",
            "updatedAt": "2023-01-05T10:00:00.000Z"
        }
    }
}
```
---

## **4. Admin: Update Product**

Updates one or more fields of an existing product.

*   **Endpoint:** `PATCH /api/v1/admin/products/:id`
*   **Method:** `PATCH`
*   **Authorization:** `Bearer <authToken>`

#### Payload (raw JSON):

You can send any subset of the product's fields.

```json
{
    "name": "Exquisite Gold-Plated Necklace",
    "mrp": 1399,
    "discountPercent": 20
}
```

**Price Logic:** If `mrp` or `discountPercent` is updated, the `price` will be automatically recalculated.

#### Full Response Example (`200 OK`):

```json
{
    "status": "success",
    "statusCode": 200,
    "message": "Product updated successfully.",
    "data": {
        "product": {
            "_id": "60d21b4667d0d8992e610c85",
            "name": "Exquisite Gold-Plated Necklace",
            "price": 1119.20,
            "mrp": 1399,
            "discountPercent": 20,
            // ... other fields remain unchanged or are updated
            "updatedAt": "2023-01-05T11:00:00.000Z"
        }
    }
}
```
---

## **5. Admin: Update Stock**

Updates the stock quantity of a product. This can be done by setting an absolute value or by providing a delta.

*   **Endpoint:** `PATCH /api/v1/admin/products/:id/stock`
*   **Method:** `PATCH`
*   **Authorization:** `Bearer <authToken>`

#### Payload Examples (raw JSON):

**Option 1: Set absolute stock value**
```json
{
    "stock": 75
}
```

**Option 2: Adjust stock with a delta (e.g., add 10 items)**
```json
{
    "delta": 10
}
```
*(Use a negative number to decrease stock, e.g., `"delta": -5`)*

#### Full Response Example (`200 OK`):

```json
{
    "status": "success",
    "statusCode": 200,
    "message": "Product updated successfully.",
    "data": {
        "product": {
            "_id": "60d21b4667d0d8992e610c85",
            "name": "Exquisite Gold-Plated Necklace",
            "stock": 75,
            // ... other product fields
            "updatedAt": "2023-01-05T12:00:00.000Z"
        }
    }
}
```

---

## **6. Admin: Delete Product (Soft Delete)**

This performs a soft delete by setting the product's `isActive` flag to `false`. The product is hidden from public view but remains in the database.

*   **Endpoint:** `PATCH /api/v1/admin/delete-products/:id`
*   **Method:** `PATCH`
*   **Authorization:** `Bearer <authToken>`

#### Full Response Example (`200 OK`):

```json
{
    "status": "success",
    "statusCode": 200,
    "message": "Product deleted successfully."
}
```
