
# Course Platform REST API

Demo Endpoint for testing: [https://metaborong-backend.harshbanjare.me/](https://metaborong-backend.harshbanjare.me/)
  

# Technologies

  
- NestJS

- MongoDB

- Stripe

- SendGrid

- AWS S3

  

# PUBLIC ROUTES

  

## Register

```typescript
[POST] /users/register;
```
Creates a new user account in the system and sends a welcome email.

````json
{
"email": "string", // Valid email address
"password": "string", // Min 6 characters
"firstName": "string", // Required
"lastName": "string", // Required
"role": "STUDENT" | "INSTRUCTOR" | "ADMIN"
}
````

  

---

  

## Login

```typescript
POST /auth/login;
````  

### Request Body

```json
{
"email": "string", // Valid email
"password": "string"  // Min 6 characters
}

```

  

---


# PROTECTED ROUTES

All protected routes should have Authorization header

```
Authorization: Bearer <access_token>
```
  

## Logout
```typescript
POST /auth/logout;
```

### Success Response (200)
```json
{
"message": "Successfully logged out"
}
```

  


  

## Refresh Token

  

```typescript
POST /auth/refresh;
```


### Headers

```
Authorization: Bearer <refresh_token>
```

  

### Success Response (200)

 
```json
{
"access_token": "eyJhbGciOiJIUzI1NiIs...",
"refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

# PAYMENT ROUTES

## Create Stripe Checkout Session

```typescript
POST /payments/create-checkout-session/:courseId
```

## Success Response (200)
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "expiresAt": "2024-03-15T11:30:00.000Z"
}
```



## Stripe Webhook Handler

> Webhook for stripe to be called when a payment is completed

```typescript
POST /payments/webhook
```


### Security
```typescript
Headers: {
  'stripe-signature': string  // Required for webhook verification
}
```


## Payment History 

```typescript
GET /payments/history
```



  

# Courses Routes

> If user is not enrolled in the course the lecture array in the object
> will be empty

  

## Get All Courses

 
```typescript
GET / courses;
```

  

### Query Parameters


```typescript
{
page?:  number;
limit?:  number;
}
```

  

### Success Response (200)

  

```json
{
"items": [
{
"id": "string",
"title": "string",
"description": "string",
	"instructor": {
		"id": "string",
		"firstName": "string",
		"lastName": "string"
		},
	"price": 0,
	"thumbnail": "string",
	"category": "string",
	"difficulty": "string",
	"tags": ["string"]
	}
],
"meta": {
"totalItems": 0,
"itemsPerPage": 0,
"totalPages": 0,
"currentPage": 0
}
}
```

  

---

  

## Get Course by ID

  

```typescript
GET /courses/:courseId;
```

  

### Success Response (200)

  

```json

{
"id": "string",
"title": "string",
"description": "string",
"instructor": {
"id": "string",
"firstName": "string",
"lastName": "string"
},
"price": 0,
"sections": [
{
"id": "string",
"title": "string",
"order": 0,
"lectures": [
{
"id": "string",
"title": "string",
"content": "string",
"videoUrl": "string",
"resourceUrls": ["string"],
"duration": 0
}
]
}
],
"thumbnail": "string",
"category": "string",
"difficulty": "string",
"tags": ["string"]
}

```

  

## Create Course

> Only user type admin or instructor can create or update courses

  


```typescript
POST / courses;
```

  

### Headers

  


```
Authorization: Bearer <access_token>
```

  

### Request Body

  

```json
{
"title": "string",
"description": "string",
"price": 0,
"category": "PROGRAMMING | DESIGN | BUSINESS | MARKETING | PERSONAL_DEVELOPMENT | MUSIC | PHOTOGRAPHY | OTHER",
"difficulty": "BEGINNER | INTERMEDIATE | ADVANCED | EXPERT",
"tags": ["string"]
}
```


## Add Section to Course

### Description

Adds a new section to an existing course. Only course instructors or admins can add sections.
```typescript
POST /courses/:courseId/sections
```
### Request Body
```typescript
{
  "title": string,   // Required: Section title
  "order": number    // Required: Section order (min: 1)
}
```




## Add Lecture to Section

```typescript
POST /courses/:courseId/sections/:sectionId/lectures
```

### Request Body
```typescript
{
  "title": string,       // Required: Lecture title
  "content": string,     // Required: Lecture content/description
  "duration": number,    // Required: Duration in minutes
  "resourceUrls": string[]  // Optional: Array of resource URLs
}
```


## Upload Course Thumbnail

```typescript
POST /courses/:courseId/upload_thumbnail
```


### Request
```typescript
Content-Type: multipart/form-data

{
  "thumbnail": File  // Required: Image file
}
```


### File Restrictions
```typescript
{
  maxFileSize: 5 * 1024 * 1024,  // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  allowedExtensions: ['jpg', 'jpeg', 'png']
}
```

## Upload Lecture Video

```typescript
POST /courses/:courseId/sections/:sectionId/lectures/:lectureId/upload_video
```


## Request
```typescript
Content-Type: multipart/form-data

{
  "video": File  // Single video file
}
```


## File Restrictions
```typescript
{
  maxFileSize: 100 * 1024 * 1024,  // 100MB
  allowedTypes: ['video/mp4', 'video/x-msvideo'],
  allowedExtensions: ['mp4','avi'],
}
```




## Upload Lecture Resources

```typescript
POST /courses/:courseId/sections/:sectionId/lectures/:lectureId/upload_resources
```


### Request
```typescript
Content-Type: multipart/form-data

{
  "resources": File[]  // Multiple files
}
```


### File Restrictions
```typescript
{
  maxFiles: 10,
  maxFileSize: 25 * 1024 * 1024,  // 25MB per file
  allowedTypes: ['pdf', 'png', 'jpeg', 'jpg', 'docx', 'csv'],
  totalMaxSize: 100 * 1024 * 1024  // 100MB total
}
```
