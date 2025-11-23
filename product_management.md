
# Product and Product Management API Guide

## Introduction

This document provides a guide for interacting with the product and product management APIs, including a Postman collection and instructions for frontend integration.

## Postman Collection

Import the following JSON into Postman. It is recommended to use a Postman environment with a `baseURL` (e.g., `http://localhost:3000`) and an `authToken` for admin routes.

```json
{
	"info": {
		"_postman_id": "b8a3e4e4-1b1e-4b7b-9e4a-5e8a7f7d6a7c",
		"name": "Product Management API",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
	},
	"item": [
		{
			"name": "Get All Products (Public)",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "{{baseURL}}/api/v1/products?limit=10&page=1&category=Jewellery",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"products"
					],
					"query": [
						{
							"key": "limit",
							"value": "10"
						},
						{
							"key": "page",
							"value": "1"
						},
						{
							"key": "category",
							"value": "Jewellery"
						}
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
					"raw": "{{baseURL}}/api/v1/products/your_product_id",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"products",
						"your_product_id"
					]
				}
			},
			"response": []
		},
		{
			"name": "Admin: Create Product",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "Authorization",
						"value": "Bearer {{authToken}}",
						"type": "text"
					}
				],
				"body": {
					"mode": "formdata",
					"formdata": [
						{"key": "name", "value": "Sample Alloy Gold-plated Necklace", "type": "text"},
                        {"key": "description", "value": "Beautiful alloy gold-plated necklace with black beads. Ideal for ethnic wear.", "type": "text"},
                        {"key": "mrp", "value": "999.00", "type": "text"},
                        {"key": "discountPercent", "value": "81", "type": "text"},
                        {"key": "sku", "value": "BULSENK-NECK-001", "type": "text"},
                        {"key": "category", "value": "Jewellery", "type": "text"},
                        {"key": "material", "value": "Alloy", "type": "text"},
                        {"key": "stock", "value": "25", "type": "text"},
                        {"key": "images", "type": "file", "src": []}
					]
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/admin/create-products",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"admin",
						"create-products"
					]
				}
			},
			"response": []
		},
		{
			"name": "Admin: Update Product",
			"request": {
				"method": "PATCH",
				"header": [
					{
						"key": "Authorization",
						"value": "Bearer {{authToken}}",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"name\": \"Updated Product Name\"\n}",
                    "options": {"raw": {"language": "json"}}
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/admin/products/your_product_id",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"admin",
						"products",
						"your_product_id"
					]
				}
			},
			"response": []
		},
        {
			"name": "Admin: Update Stock",
			"request": {
				"method": "PATCH",
				"header": [
					{
						"key": "Authorization",
						"value": "Bearer {{authToken}}",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"stock\": 50\n}",
                    "options": {"raw": {"language": "json"}}
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/admin/products/your_product_id/stock",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"admin",
						"products",
						"your_product_id",
                        "stock"
					]
				}
			},
			"response": []
		},
		{
			"name": "Admin: Delete Product (Soft)",
			"request": {
				"method": "PATCH",
				"header": [
					{
						"key": "Authorization",
						"value": "Bearer {{authToken}}",
						"type": "text"
					}
				],
				"url": {
					"raw": "{{baseURL}}/api/v1/admin/delete-products/your_product_id",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"admin",
						"delete-products",
						"your_product_id"
					]
				}
			},
			"response": []
		}
	]
}
```

## Frontend Integration Guide

### 1. Setup

Use a centralized API client, like `axios`, to manage requests. This is the same setup as in the `auth_postman_collection.md` guide.

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1', // Your API base URL
});

// Set the auth token if available (e.g., from localStorage)
const token = localStorage.getItem('authToken');
if (token) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
```

### 2. Public Product Endpoints

#### Fetching a List of Products

- Make a `GET` request to `/products`.
- You can add query parameters to filter, sort, and paginate the results.

```javascript
const fetchProducts = async (filters) => {
  try {
    const response = await apiClient.get('/products', { params: filters });
    // filters could be: { page: 1, limit: 10, category: 'Jewellery' }
    return response.data; // { count, total, currentPage, totalPages, data: { products: [...] } }
  } catch (error) {
    console.error('Error fetching products:', error);
  }
};
```

#### Fetching a Single Product

- Make a `GET` request to `/products/:id`.

```javascript
const fetchProductById = async (productId) => {
  try {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data.data; // { product: {...} }
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
  }
};
```

### 3. Admin: Product Management

These routes require a valid JWT token in the `Authorization` header.

#### Creating a Product

- The `POST /admin/create-products` endpoint expects `multipart/form-data`, which is necessary for uploading images.
- Use the `FormData` API in JavaScript to build the request payload.

```javascript
const createProduct = async (productData) => {
  const formData = new FormData();

  // Append all text fields
  Object.keys(productData).forEach(key => {
    if (key !== 'images') {
      formData.append(key, productData[key]);
    }
  });

  // Append image files
  if (productData.images) {
    productData.images.forEach(image => {
      formData.append('images', image); // 'images' is the field name for the files
    });
  }

  try {
    const response = await apiClient.post('/admin/create-products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
  }
};
```

#### Updating a Product

- Make a `PATCH` request to `/admin/products/:id` with the fields to update.

```javascript
const updateProduct = async (productId, updates) => {
  try {
    const response = await apiClient.patch(`/admin/products/${productId}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
  }
};
```

#### Updating Stock

- Make a `PATCH` request to `/admin/products/:id/stock`.
- You can either set an absolute stock number or provide a delta to adjust it.

```javascript
// To set a specific stock value
const setStock = async (productId, stockValue) => {
  try {
    const response = await apiClient.patch(`/admin/products/${productId}/stock`, { stock: stockValue });
    return response.data;
  } catch (error) {
    console.error('Error setting stock:', error);
  }
};

// To adjust the stock by a certain amount (e.g., +5 or -10)
const adjustStock = async (productId, deltaValue) => {
  try {
    const response = await apiClient.patch(`/admin/products/${productId}/stock`, { delta: deltaValue });
    return response.data;
  } catch (error) {
    console.error('Error adjusting stock:', error);
  }
};
```

#### Deleting a Product (Soft Delete)

- Make a `PATCH` request to `/admin/delete-products/:id`.
- This performs a soft delete by setting the product's `isActive` flag to `false`.

```javascript
const deleteProduct = async (productId) => {
  try {
    const response = await apiClient.patch(`/admin/delete-products/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting product ${productId}:`, error);
  }
};
```
