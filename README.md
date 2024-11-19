## Enterprise Node.js Application

A production-ready Node.js application featuring advanced enterprise patterns, real-time capabilities, and scalable architecture.

### 🚀 Features

- Advanced Authentication & Authorization
- Real-time Updates with Socket.IO
- Queue Management with BullMQ
- Caching with Redis
- Metrics & Monitoring
- Event-Driven Architecture
- Rate Limiting & Security
- OpenAPI Documentation

### 🛠 Tech Stack

- Node.js & Express
- MongoDB & Mongoose
- Redis & BullMQ
- Socket.IO
- OpenTelemetry
- TypeDI (Dependency Injection)
- Routing Controllers
- Jest & Supertest

### 📦 Installation

```bash
npm install
```

### 🔧 Configuration

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/enterprise-app
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### 🚀 Running the Application

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

### 📊 Available Endpoints

- API: `http://localhost:3000/api`
- Queue Dashboard: `http://localhost:3000/admin/queues`
- Metrics: `http://localhost:3000/metrics`
- API Docs: `http://localhost:3000/api-docs`

### 🧪 Testing

```bash
npm test
```

### 📚 Documentation

Generate documentation:
```bash
npm run doc
```

### 🔄 Database Migrations

```bash
npm run migrate
```

### 🌱 Seeding Data

```bash
npm run seed
```
