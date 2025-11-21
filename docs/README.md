# Omeagle VITAP Backend Documentation

Complete documentation for the WebSocket-based matchmaking backend.

## 📚 Documentation Index

### Core Documentation

1. **[API.md](API.md)** - WebSocket API Reference
   - Connection authentication
   - Message types (join, leave, ping)
   - Message flows with diagrams
   - Error handling
   - Integration examples
   - Best practices

2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System Architecture
   - System overview with architecture diagram
   - Core components (WebSocket, Matchmaking, Room, Token services)
   - Data flow diagrams (matchmaking, leave)
   - Redis data model with visualization
   - Agora integration (RTC + RTM)
   - Horizontal scaling strategy
   - Security and performance

3. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment Guide
   - Prerequisites (Agora, Redis, Domain, VPS)
   - Environment setup
   - Docker deployment (recommended)
   - VPS/Cloud deployment (AWS, DigitalOcean, GCP)
   - Domain & SSL setup with Nginx
   - Production checklist
   - Monitoring and troubleshooting
   - Cost estimation

4. **[VERSIONING.md](VERSIONING.md)** - Version Management
   - Semantic versioning strategy
   - Release process
   - Changelog management

5. **[DIAGRAMS.md](DIAGRAMS.md)** - Diagram Guide
   - How to read Mermaid diagrams
   - Diagram color coding
   - Viewing and editing diagrams
   - Contributing new diagrams

### Additional Documentation

- **[../README.md](../README.md)** - Project Overview & Quick Start
- **[../TESTING.md](../TESTING.md)** - Testing Guide
- **[../CHANGELOG.md](../CHANGELOG.md)** - Version History

---

## 🚀 Quick Start

New to the project? Start here:

1. **Understand the System**: Read [ARCHITECTURE.md](ARCHITECTURE.md) for overview
2. **Set Up Environment**: Follow [DEPLOYMENT.md](DEPLOYMENT.md) for setup
3. **Learn the API**: Check [API.md](API.md) for WebSocket endpoints
4. **Test Connection**: Use Postman or WebSocket client (see below)
5. **Test It**: Use [../TESTING.md](../TESTING.md) for complete testing guide

### Connect to Backend (Quick)

**Option 1: Using Postman (Recommended)**
1. Import `../postman-collection/collection.json`
2. Set environment variables:
   - `ws_host`: `localhost:8080`
   - `api_key`: Your API key from `.env` file
3. Open "User 1 - Join Queue" WebSocket request
4. Connect (API key sent via `X-API-Key` header)

**Option 2: Using JavaScript (Browser)**
```javascript
const ws = new WebSocket('ws://localhost:8080/ws/match?apiKey=YOUR_API_KEY');
ws.onopen = () => ws.send(JSON.stringify({
  type: 'join',
  data: { uid: 'user_123', name: 'Test User', gender: 'male' }
}));
ws.onmessage = (e) => console.log('Match:', JSON.parse(e.data));
```

See [API.md](API.md) → Quick Start for more connection examples.

---

## 📊 Visual Guides

All documentation includes **Mermaid diagrams** for better visualization:

- **System Architecture**: Component relationships
- **Sequence Diagrams**: Message flows and interactions
- **Data Models**: Redis structure
- **Scaling Strategy**: Multi-instance deployment

View diagrams on GitHub or with [Mermaid Preview](https://mermaid.live/).

---

## 🔧 For Developers

### Backend Development
- Core: [ARCHITECTURE.md](ARCHITECTURE.md) → Core Components
- API: [API.md](API.md) → WebSocket API
- Testing: [../TESTING.md](../TESTING.md)

### Frontend Integration
- Connection: [API.md](API.md) → Authentication
- Messages: [API.md](API.md) → Message Types
- Examples: [API.md](API.md) → Integration Guide
- Agora Setup: [API.md](API.md) → Agora Integration

### DevOps
- Docker: [DEPLOYMENT.md](DEPLOYMENT.md) → Docker Deployment
- Cloud: [DEPLOYMENT.md](DEPLOYMENT.md) → VPS/Cloud Deployment
- SSL: [DEPLOYMENT.md](DEPLOYMENT.md) → Domain & SSL Setup
- Monitoring: [DEPLOYMENT.md](DEPLOYMENT.md) → Monitoring

---

## 🎯 Common Tasks

### I want to...

**Deploy the backend**
→ [DEPLOYMENT.md](DEPLOYMENT.md) → Choose deployment method

**Integrate with frontend**
→ [API.md](API.md) → Integration Guide

**Understand data flow**
→ [ARCHITECTURE.md](ARCHITECTURE.md) → Data Flow

**Set up SSL certificate**
→ [DEPLOYMENT.md](DEPLOYMENT.md) → Domain & SSL Setup

**Test WebSocket connection**
→ [API.md](API.md) → Quick Start (3-step guide)
→ [../TESTING.md](../TESTING.md) → WebSocket Testing

**Understand authentication**
→ [API.md](API.md) → Authentication (Header vs Query Parameter)

**Scale the system**
→ [ARCHITECTURE.md](ARCHITECTURE.md) → Scalability

**Troubleshoot issues**
→ [DEPLOYMENT.md](DEPLOYMENT.md) → Troubleshooting

**Understand Redis structure**
→ [ARCHITECTURE.md](ARCHITECTURE.md) → Redis Design

**Add new features**
→ [ARCHITECTURE.md](ARCHITECTURE.md) → Core Components

---

## 📖 Documentation Structure

```
docs/
├── README.md           ← You are here
├── API.md             ← WebSocket API reference
├── ARCHITECTURE.md    ← System design & architecture
├── DEPLOYMENT.md      ← Production deployment guide
├── VERSIONING.md      ← Version management
└── DIAGRAMS.md        ← Mermaid diagram guide
```

---

## 🔄 Keeping Documentation Updated

When making changes:

1. **Code Changes** → Update [ARCHITECTURE.md](ARCHITECTURE.md)
2. **API Changes** → Update [API.md](API.md)
3. **Deployment Changes** → Update [DEPLOYMENT.md](DEPLOYMENT.md)
4. **Version Bump** → Update [../CHANGELOG.md](../CHANGELOG.md)
5. **New Diagrams** → Update [DIAGRAMS.md](DIAGRAMS.md)

---

## 💡 Tips

- All diagrams are **Mermaid-based** and render on GitHub
- Use **Cmd/Ctrl + F** to search within docs
- Check [DIAGRAMS.md](DIAGRAMS.md) for diagram syntax
- Examples are copy-paste ready
- Production checklist in [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🤝 Contributing

When contributing:

1. Update relevant documentation
2. Add diagrams for new features
3. Include code examples
4. Test on GitHub markdown preview
5. Keep diagrams simple and clear

See [DIAGRAMS.md](DIAGRAMS.md) for diagram guidelines.

---

## 📞 Support

- **GitHub Issues**: Bug reports and feature requests
- **API Questions**: See [API.md](API.md) examples
- **Deployment Help**: Check [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting
- **Architecture Questions**: Read [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 📝 License

This documentation is part of the Omeagle VITAP Backend project.

---

**Last Updated**: November 21, 2025  
**Version**: 1.0.0  
**Maintained by**: [rudra-sah00](https://github.com/rudra-sah00)
