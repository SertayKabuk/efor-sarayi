#!/bin/bash

# Load environment variables automatically (root first, then backend overrides).
set -a
[ -f ./.env ] && . ./.env
[ -f ./backend/.env ] && . ./backend/.env
set +a

API="http://localhost:8080/api/v1/projects"
SEED_AUTH_TOKEN="${SEED_AUTH_TOKEN:-}"
PYTHON_BIN="$(command -v python3 || command -v python)"

if [ -z "$PYTHON_BIN" ]; then
  echo "FAIL: python3/python not found in PATH"
  exit 1
fi

post() {
  local name="$1"
  local resp
  if [ -n "$SEED_AUTH_TOKEN" ]; then
    resp=$(curl -sf -X POST "$API" \
      -H "Content-Type: application/json" \
      -H "X-Seed-Token: $SEED_AUTH_TOKEN" \
      -d "$2")
  else
    resp=$(curl -sf -X POST "$API" -H "Content-Type: application/json" -d "$2")
  fi
  if [ $? -eq 0 ]; then
    echo "OK: $name"
  else
    echo "FAIL: $name"
    echo "$resp"
  fi
}

post "E-Commerce Platform" '{
  "name": "E-Commerce Platform",
  "description": "Full-stack e-commerce platform with product catalog, shopping cart, checkout flow, payment integration, order management, admin dashboard, and email notifications. Multi-language support and responsive design.",
  "modules": ["Product Catalog", "Shopping Cart", "Checkout Flow", "Order Management", "Admin Dashboard", "Email Notifications"],
  "integrations": ["Stripe", "SendGrid", "Cloudinary"],
  "requirements": ["PCI DSS compliance", "Multi-language support", "Responsive design", "99.9% uptime"],
  "tech_stack": ["React", "Node.js", "PostgreSQL", "Redis", "Docker"],
  "duration_days": 120,
  "effort_person_days": 360,
  "complexity": "high",
  "constraints": ["Must support 3 currencies at launch"],
  "implementation_plan": [
    {"phase": "Phase 1: Setup & Infrastructure", "tasks": ["Project scaffolding", "CI/CD pipeline", "Database schema design", "Auth system"], "effort_days": 40},
    {"phase": "Phase 2: Product & Cart", "tasks": ["Product catalog CRUD", "Search & filtering", "Shopping cart", "Wishlist"], "effort_days": 80},
    {"phase": "Phase 3: Checkout & Payments", "tasks": ["Checkout flow", "Stripe integration", "Multi-currency support", "Order management"], "effort_days": 100},
    {"phase": "Phase 4: Admin & Notifications", "tasks": ["Admin dashboard", "Email notifications", "Reporting", "SEO"], "effort_days": 80},
    {"phase": "Phase 5: Testing & Launch", "tasks": ["E2E testing", "Performance optimization", "Security audit", "Deployment"], "effort_days": 60}
  ],
  "team_composition": ["2 Backend Developers", "2 Frontend Developers", "1 QA Engineer"],
  "assumptions": ["Stripe handles all payment processing", "No legacy data migration", "Cloudinary for all media assets"],
  "risks": [
    {"description": "Multi-currency payment edge cases (refunds, partial payments)", "impact": "high"},
    {"description": "PCI DSS compliance audit delays", "impact": "medium"}
  ],
  "questions": ["How many product categories at launch?", "Is there an existing customer database to migrate?"],
  "notes": "Payment integration and multi-currency support added significant complexity. Had to handle edge cases around failed payments and refunds."
}'

post "Internal HR Portal" '{
  "name": "Internal HR Portal",
  "description": "Employee self-service portal with leave management, timesheet tracking, org chart, performance reviews, and document storage. SSO integration with Azure AD.",
  "modules": ["Leave Management", "Timesheet Tracking", "Org Chart", "Performance Reviews", "Document Storage"],
  "integrations": ["Azure AD", "Azure Blob Storage"],
  "requirements": ["SSO authentication", "Role-based access control"],
  "tech_stack": ["Angular", ".NET Core", "SQL Server"],
  "duration_days": 90,
  "effort_person_days": 180,
  "complexity": "medium",
  "constraints": [],
  "implementation_plan": [
    {"phase": "Phase 1: Auth & Core", "tasks": ["Azure AD SSO", "RBAC system", "Employee profiles", "Org chart"], "effort_days": 45},
    {"phase": "Phase 2: Leave & Timesheets", "tasks": ["Leave request workflow", "Multi-level approval", "Timesheet entry", "Reporting"], "effort_days": 70},
    {"phase": "Phase 3: Reviews & Docs", "tasks": ["Performance review cycles", "Document upload/storage", "Notifications"], "effort_days": 45},
    {"phase": "Phase 4: Polish & Deploy", "tasks": ["UI polish", "Testing", "Documentation", "Deployment"], "effort_days": 20}
  ],
  "team_composition": ["1 Backend Developer", "1 Frontend Developer", "1 QA Engineer"],
  "assumptions": ["Azure AD tenant already configured", "No payroll integration needed"],
  "risks": [
    {"description": "Complex leave approval hierarchy may require rework", "impact": "medium"}
  ],
  "questions": ["How many levels of leave approval?", "Is payroll integration needed in the future?"],
  "notes": "SSO integration was straightforward. Most effort went into the leave approval workflow with multi-level hierarchies."
}'

post "Real-Time Chat Application" '{
  "name": "Real-Time Chat Application",
  "description": "Slack-like team messaging app with channels, direct messages, file sharing, message search, typing indicators, read receipts, and push notifications.",
  "modules": ["Channels", "Direct Messages", "File Sharing", "Message Search", "Push Notifications", "Typing Indicators"],
  "integrations": ["Firebase", "AWS S3"],
  "requirements": ["Real-time delivery < 100ms", "Offline message queuing", "Cross-platform push notifications"],
  "tech_stack": ["React", "Node.js", "Socket.io", "MongoDB", "Redis"],
  "duration_days": 100,
  "effort_person_days": 300,
  "complexity": "high",
  "constraints": [],
  "implementation_plan": [
    {"phase": "Phase 1: Core Messaging", "tasks": ["WebSocket infrastructure", "Channels CRUD", "Direct messaging", "Message persistence"], "effort_days": 80},
    {"phase": "Phase 2: Rich Features", "tasks": ["File sharing with S3", "Message search with indexing", "Typing indicators", "Read receipts"], "effort_days": 100},
    {"phase": "Phase 3: Notifications & Offline", "tasks": ["Push notifications", "Offline message queue", "Notification preferences"], "effort_days": 70},
    {"phase": "Phase 4: Testing & Optimization", "tasks": ["Load testing", "Performance tuning", "E2E tests", "Deployment"], "effort_days": 50}
  ],
  "team_composition": ["2 Backend Developers", "2 Frontend Developers", "1 DevOps Engineer"],
  "assumptions": ["No video/voice calling needed", "Firebase for push notifications only"],
  "risks": [
    {"description": "Real-time sync at scale may require architecture changes", "impact": "high"},
    {"description": "Offline message queuing edge cases", "impact": "medium"}
  ],
  "questions": ["Expected concurrent user count?", "Is message encryption (E2E) required?"],
  "notes": "Real-time sync and offline message queuing were the hardest parts. Push notification delivery across platforms required significant testing."
}'

post "Fleet Management Dashboard" '{
  "name": "Fleet Management Dashboard",
  "description": "GPS tracking dashboard for a logistics company with real-time vehicle location, route optimization, driver assignment, fuel consumption reports, maintenance scheduling, and geofencing alerts.",
  "modules": ["GPS Tracking", "Route Optimization", "Driver Assignment", "Fuel Reports", "Maintenance Scheduling", "Geofencing Alerts"],
  "integrations": ["Mapbox", "RabbitMQ", "GPS Hardware API"],
  "requirements": ["Real-time location updates", "Sub-second geofence detection"],
  "tech_stack": ["Vue.js", "Python", "FastAPI", "PostgreSQL", "PostGIS"],
  "duration_days": 110,
  "effort_person_days": 330,
  "complexity": "high",
  "constraints": ["Must handle 10k concurrent vehicle streams"],
  "implementation_plan": [
    {"phase": "Phase 1: Data Ingestion", "tasks": ["GPS data pipeline", "RabbitMQ setup", "PostGIS schema", "Real-time tracking API"], "effort_days": 80},
    {"phase": "Phase 2: Map & Tracking", "tasks": ["Mapbox integration", "Live vehicle tracking UI", "Historical route playback"], "effort_days": 70},
    {"phase": "Phase 3: Fleet Operations", "tasks": ["Route optimization algorithm", "Driver assignment", "Geofencing engine", "Alerts"], "effort_days": 100},
    {"phase": "Phase 4: Reporting & Maintenance", "tasks": ["Fuel consumption reports", "Maintenance scheduling", "Dashboard analytics"], "effort_days": 50},
    {"phase": "Phase 5: Scale Testing", "tasks": ["Load testing 10k streams", "Performance optimization", "Deployment"], "effort_days": 30}
  ],
  "team_composition": ["2 Backend Developers", "1 Frontend Developer", "1 Data Engineer"],
  "assumptions": ["GPS hardware API is stable and documented", "Mapbox plan covers expected usage"],
  "risks": [
    {"description": "10k concurrent GPS streams may require streaming architecture", "impact": "high"},
    {"description": "Route optimization algorithm accuracy for complex routes", "impact": "medium"}
  ],
  "questions": ["What GPS hardware/protocol is used?", "Is offline tracking needed when vehicles lose connectivity?"],
  "notes": "Geospatial queries and real-time GPS data ingestion at scale were challenging. Route optimization algorithm took several iterations."
}'

post "Company Website Redesign" '{
  "name": "Company Website Redesign",
  "description": "Corporate website with CMS integration, blog, career page, contact forms, SEO optimization, analytics tracking, and multi-language support.",
  "modules": ["CMS", "Blog", "Career Page", "Contact Forms", "Analytics"],
  "integrations": ["Strapi", "Cloudinary", "Google Analytics"],
  "requirements": ["SEO optimization", "Multi-language support", "Core Web Vitals passing"],
  "tech_stack": ["Next.js", "Strapi", "PostgreSQL", "Vercel"],
  "duration_days": 45,
  "effort_person_days": 60,
  "complexity": "low",
  "constraints": [],
  "implementation_plan": [
    {"phase": "Phase 1: Setup & CMS", "tasks": ["Next.js scaffolding", "Strapi CMS setup", "Content models", "Media pipeline"], "effort_days": 15},
    {"phase": "Phase 2: Pages & Content", "tasks": ["Homepage", "Blog", "Career page", "Contact forms", "i18n"], "effort_days": 25},
    {"phase": "Phase 3: SEO & Launch", "tasks": ["SEO optimization", "Analytics integration", "Performance audit", "Deployment"], "effort_days": 20}
  ],
  "team_composition": ["1 Full-stack Developer", "1 Designer (part-time)"],
  "assumptions": ["Content provided by marketing team", "No custom backend logic"],
  "risks": [
    {"description": "Content migration from old WordPress may have formatting issues", "impact": "low"}
  ],
  "questions": ["How many languages at launch?", "Is the old WordPress content structured or free-form?"],
  "notes": "Straightforward project. CMS setup and content migration from the old WordPress site took more time than expected."
}'

post "Patient Records Management System" '{
  "name": "Patient Records Management System",
  "description": "HIPAA-compliant electronic health records system with patient registration, appointment scheduling, medical history, prescription management, lab results integration, and billing.",
  "modules": ["Patient Registration", "Appointment Scheduling", "Medical History", "Prescription Management", "Lab Results", "Billing"],
  "integrations": ["Keycloak", "HL7 FHIR API", "Lab Systems API"],
  "requirements": ["HIPAA compliance", "Encryption at rest", "Full audit logging", "Role-based access control"],
  "tech_stack": ["React", "Java", "Spring Boot", "PostgreSQL", "Elasticsearch"],
  "duration_days": 150,
  "effort_person_days": 600,
  "complexity": "very_high",
  "constraints": ["External security audit required before go-live", "Must pass HIPAA certification"],
  "implementation_plan": [
    {"phase": "Phase 1: Security Foundation", "tasks": ["Keycloak integration", "RBAC system", "Audit logging", "Encryption at rest", "Secure API layer"], "effort_days": 120},
    {"phase": "Phase 2: Patient Core", "tasks": ["Patient registration", "Medical history", "Appointment scheduling", "Calendar integration"], "effort_days": 130},
    {"phase": "Phase 3: Clinical Features", "tasks": ["Prescription management", "Lab results integration", "HL7 FHIR API connector"], "effort_days": 150},
    {"phase": "Phase 4: Billing & Reports", "tasks": ["Billing module", "Insurance integration", "Report generation", "Dashboard"], "effort_days": 100},
    {"phase": "Phase 5: Compliance & Audit", "tasks": ["Security audit preparation", "Penetration testing", "HIPAA documentation", "Go-live"], "effort_days": 100}
  ],
  "team_composition": ["3 Backend Developers", "2 Frontend Developers", "1 Security Engineer", "1 QA Engineer"],
  "assumptions": ["Lab systems have documented APIs", "Keycloak instance already available"],
  "risks": [
    {"description": "HIPAA certification process may cause launch delays", "impact": "high"},
    {"description": "HL7 FHIR integration complexity with legacy lab systems", "impact": "high"},
    {"description": "Security audit findings may require rework", "impact": "medium"}
  ],
  "questions": ["Which lab systems need integration?", "Is there an existing patient database to migrate?", "What is the go-live deadline?"],
  "notes": "HIPAA compliance requirements added significant overhead. Audit logging, encryption at rest, and access controls required careful implementation."
}'

post "Mobile Banking App" '{
  "name": "Mobile Banking App",
  "description": "iOS and Android banking application with account overview, fund transfers, bill payments, QR code payments, card management, spending analytics, and biometric authentication.",
  "modules": ["Account Overview", "Fund Transfers", "Bill Payments", "QR Payments", "Card Management", "Spending Analytics", "Biometric Auth"],
  "integrations": ["Core Banking API", "Firebase", "Apple Pay", "Google Pay"],
  "requirements": ["PCI compliance", "Certificate pinning", "Biometric authentication", "Transaction signing"],
  "tech_stack": ["React Native", "Node.js", "PostgreSQL", "Redis"],
  "duration_days": 140,
  "effort_person_days": 560,
  "complexity": "very_high",
  "constraints": ["App store review timelines", "Banking regulator approval"],
  "implementation_plan": [
    {"phase": "Phase 1: Security Layer", "tasks": ["Certificate pinning", "Biometric auth", "Transaction signing", "Secure storage"], "effort_days": 100},
    {"phase": "Phase 2: Core Banking", "tasks": ["Account overview", "Fund transfers", "Transaction history", "Core Banking API integration"], "effort_days": 130},
    {"phase": "Phase 3: Payments", "tasks": ["Bill payments", "QR code payments", "Apple Pay", "Google Pay"], "effort_days": 120},
    {"phase": "Phase 4: Analytics & Cards", "tasks": ["Spending analytics", "Card management", "Notifications", "Settings"], "effort_days": 100},
    {"phase": "Phase 5: Compliance & Launch", "tasks": ["PCI audit", "Regulator submission", "App store preparation", "Beta testing"], "effort_days": 110}
  ],
  "team_composition": ["2 Mobile Developers", "2 Backend Developers", "1 Security Engineer", "1 QA Engineer"],
  "assumptions": ["Core Banking API is stable", "Apple/Google Pay SDKs are well-documented"],
  "risks": [
    {"description": "Banking regulator approval delays", "impact": "high"},
    {"description": "Core Banking API instability or rate limits", "impact": "high"},
    {"description": "App store rejection due to policy changes", "impact": "medium"}
  ],
  "questions": ["Which core banking system is used?", "Is there a sandbox environment for the banking API?", "What are the regulator submission timelines?"],
  "notes": "Security requirements were extensive. Biometric auth, certificate pinning, transaction signing, and PCI compliance added significant effort."
}'

post "Inventory Management System" '{
  "name": "Inventory Management System",
  "description": "Warehouse inventory system with barcode scanning, stock level tracking, purchase order management, supplier management, low-stock alerts, and reporting dashboards.",
  "modules": ["Barcode Scanning", "Stock Tracking", "Purchase Orders", "Supplier Management", "Alerts", "Reporting"],
  "integrations": ["Barcode Scanner SDK", "ERP System"],
  "requirements": ["Multi-warehouse support", "Real-time stock accuracy"],
  "tech_stack": ["Vue.js", "Python", "Django", "PostgreSQL", "Celery", "Redis"],
  "duration_days": 80,
  "effort_person_days": 200,
  "complexity": "medium",
  "constraints": [],
  "implementation_plan": [
    {"phase": "Phase 1: Core Inventory", "tasks": ["Product CRUD", "Stock tracking", "Multi-warehouse support", "Barcode scanning"], "effort_days": 60},
    {"phase": "Phase 2: Procurement", "tasks": ["Purchase orders", "Supplier management", "Receiving workflow"], "effort_days": 50},
    {"phase": "Phase 3: Alerts & Reporting", "tasks": ["Low-stock alerts", "Reporting dashboards", "Export functionality"], "effort_days": 50},
    {"phase": "Phase 4: Integration & Testing", "tasks": ["ERP integration", "E2E testing", "UAT", "Deployment"], "effort_days": 40}
  ],
  "team_composition": ["1 Backend Developer", "1 Frontend Developer", "1 QA Engineer"],
  "assumptions": ["ERP system has REST API", "Barcode scanners are USB/Bluetooth HID devices"],
  "risks": [
    {"description": "ERP integration may require custom middleware", "impact": "medium"},
    {"description": "Multi-warehouse stock transfer reconciliation edge cases", "impact": "medium"}
  ],
  "questions": ["Which ERP system is in use?", "How many warehouses at launch?"],
  "notes": "Barcode scanning integration was smooth. The complex part was multi-warehouse stock transfer logic and inventory reconciliation."
}'

post "Learning Management System" '{
  "name": "Learning Management System",
  "description": "Online education platform with course creation, video hosting, quizzes, assignments, progress tracking, certificates, discussion forums, and instructor analytics.",
  "modules": ["Course Builder", "Video Player", "Quiz Engine", "Assignments", "Progress Tracking", "Certificates", "Discussion Forums", "Analytics"],
  "integrations": ["MinIO", "WebRTC", "SMTP"],
  "requirements": ["Video transcoding pipeline", "Live session support", "SCORM compliance"],
  "tech_stack": ["React", "Python", "FastAPI", "PostgreSQL", "Redis"],
  "duration_days": 130,
  "effort_person_days": 390,
  "complexity": "high",
  "constraints": [],
  "implementation_plan": [
    {"phase": "Phase 1: Course Platform", "tasks": ["Course builder", "Content management", "Enrollment system", "Progress tracking"], "effort_days": 80},
    {"phase": "Phase 2: Video & Live", "tasks": ["Video upload & transcoding", "Video player", "WebRTC live sessions", "Recording"], "effort_days": 100},
    {"phase": "Phase 3: Assessment", "tasks": ["Quiz engine (multiple types)", "Assignments", "Grading", "Certificates"], "effort_days": 80},
    {"phase": "Phase 4: Community & Analytics", "tasks": ["Discussion forums", "Instructor analytics", "Student dashboard", "Notifications"], "effort_days": 70},
    {"phase": "Phase 5: SCORM & Launch", "tasks": ["SCORM compliance", "Testing", "Performance optimization", "Deployment"], "effort_days": 60}
  ],
  "team_composition": ["2 Backend Developers", "2 Frontend Developers", "1 DevOps Engineer"],
  "assumptions": ["MinIO for object storage is sufficient", "No mobile app needed initially"],
  "risks": [
    {"description": "Video transcoding pipeline reliability at scale", "impact": "high"},
    {"description": "SCORM compliance may require significant effort", "impact": "medium"},
    {"description": "WebRTC live sessions may have browser compatibility issues", "impact": "medium"}
  ],
  "questions": ["Expected number of concurrent live session participants?", "Is SCORM 1.2 or SCORM 2004 required?"],
  "notes": "Video transcoding pipeline and live session infrastructure were the most complex parts. Quiz engine with multiple question types required more effort than estimated."
}'

post "CI/CD Pipeline Automation Tool" '{
  "name": "CI/CD Pipeline Automation Tool",
  "description": "Internal DevOps platform for managing build pipelines, deployment configurations, environment provisioning, rollback management, and deployment approvals.",
  "modules": ["Pipeline Builder", "Deployment Manager", "Environment Provisioning", "Rollback Management", "Approval Workflows"],
  "integrations": ["GitHub API", "Jenkins", "Kubernetes", "Terraform"],
  "requirements": ["Zero-downtime deployments", "Audit trail for all deployments"],
  "tech_stack": ["React", "Go", "PostgreSQL", "Kubernetes"],
  "duration_days": 75,
  "effort_person_days": 150,
  "complexity": "high",
  "constraints": ["Must integrate with existing Jenkins pipelines"],
  "implementation_plan": [
    {"phase": "Phase 1: Pipeline Engine", "tasks": ["Pipeline DSL", "GitHub webhook integration", "Jenkins connector", "Build execution"], "effort_days": 40},
    {"phase": "Phase 2: Deployment", "tasks": ["Kubernetes deployer", "Environment provisioning", "Terraform integration", "Rollback mechanism"], "effort_days": 50},
    {"phase": "Phase 3: Governance", "tasks": ["Approval workflows", "Audit logging", "RBAC", "Dashboard"], "effort_days": 35},
    {"phase": "Phase 4: Testing & Docs", "tasks": ["Integration testing", "Documentation", "Migration guide", "Deployment"], "effort_days": 25}
  ],
  "team_composition": ["2 Backend Developers (Go)", "1 Frontend Developer"],
  "assumptions": ["Kubernetes clusters already provisioned", "Teams willing to migrate from Jenkins gradually"],
  "risks": [
    {"description": "Jenkins pipeline migration may break existing workflows", "impact": "high"},
    {"description": "Kubernetes operator development complexity", "impact": "medium"}
  ],
  "questions": ["How many Jenkins pipelines need migration?", "Is Terraform state managed centrally or per-team?"],
  "notes": "Small but experienced team. Kubernetes operator development and Terraform state management were the key technical challenges."
}'

post "Restaurant Ordering Kiosk" '{
  "name": "Restaurant Ordering Kiosk",
  "description": "Self-service ordering kiosk application for a restaurant chain. Touch-screen menu browsing, customization options, payment terminal integration, kitchen display system, and order queue management.",
  "modules": ["Menu Browser", "Order Customization", "Payment", "Kitchen Display", "Order Queue"],
  "integrations": ["Stripe Terminal", "Receipt Printer SDK"],
  "requirements": ["Touch-screen optimized UI", "Offline fallback mode"],
  "tech_stack": ["React", "Node.js", "MongoDB", "Electron"],
  "duration_days": 60,
  "effort_person_days": 120,
  "complexity": "medium",
  "constraints": ["Hardware integration requires on-site testing"],
  "implementation_plan": [
    {"phase": "Phase 1: Menu & Ordering", "tasks": ["Menu browsing UI", "Order customization", "Cart management", "Touch optimization"], "effort_days": 30},
    {"phase": "Phase 2: Payment & Hardware", "tasks": ["Stripe Terminal integration", "Receipt printer", "Offline fallback"], "effort_days": 40},
    {"phase": "Phase 3: Kitchen System", "tasks": ["Kitchen display", "Order queue", "Status tracking", "Notifications"], "effort_days": 30},
    {"phase": "Phase 4: Testing", "tasks": ["On-site hardware testing", "UAT", "Deployment to kiosks"], "effort_days": 20}
  ],
  "team_composition": ["1 Full-stack Developer", "1 Frontend Developer"],
  "assumptions": ["Stripe Terminal SDK is stable", "Menu data managed in existing POS system"],
  "risks": [
    {"description": "Payment terminal hardware compatibility issues", "impact": "medium"},
    {"description": "On-site testing logistics may cause delays", "impact": "low"}
  ],
  "questions": ["How many kiosk locations at launch?", "Is the menu managed in a POS or needs a CMS?"],
  "notes": "Hardware integration with payment terminals and receipt printers required on-site testing. Kitchen display sync was straightforward with websockets."
}'

post "Data Analytics Platform" '{
  "name": "Data Analytics Platform",
  "description": "Business intelligence platform with data pipeline ingestion from multiple sources, ETL processing, interactive dashboards, scheduled reports, anomaly detection, and user-defined KPI tracking.",
  "modules": ["Data Pipeline", "ETL Processing", "Dashboard Builder", "Scheduled Reports", "Anomaly Detection", "KPI Tracking"],
  "integrations": ["Apache Airflow", "CSV/API/DB Connectors"],
  "requirements": ["Support for 100+ concurrent dashboard users", "Sub-second dashboard loads"],
  "tech_stack": ["React", "Python", "FastAPI", "ClickHouse", "Redis", "Docker"],
  "duration_days": 100,
  "effort_person_days": 300,
  "complexity": "high",
  "constraints": [],
  "implementation_plan": [
    {"phase": "Phase 1: Data Ingestion", "tasks": ["Pipeline framework", "CSV/API/DB connectors", "Airflow integration", "Schema detection"], "effort_days": 70},
    {"phase": "Phase 2: ETL & Storage", "tasks": ["ETL processing engine", "ClickHouse schema design", "Data transformation", "Scheduling"], "effort_days": 60},
    {"phase": "Phase 3: Dashboards", "tasks": ["Dashboard builder", "Chart components", "Interactive filters", "Pre-aggregated views"], "effort_days": 80},
    {"phase": "Phase 4: Advanced Features", "tasks": ["Scheduled reports", "Anomaly detection", "KPI tracking", "Alerts"], "effort_days": 60},
    {"phase": "Phase 5: Performance & Launch", "tasks": ["Performance optimization", "Load testing", "Documentation", "Deployment"], "effort_days": 30}
  ],
  "team_composition": ["2 Backend Developers", "1 Frontend Developer", "1 Data Engineer"],
  "assumptions": ["Data sources have stable schemas", "ClickHouse is appropriate for query patterns"],
  "risks": [
    {"description": "Data pipeline reliability with diverse sources", "impact": "high"},
    {"description": "Dashboard performance with large datasets", "impact": "medium"}
  ],
  "questions": ["What data sources need connectors at launch?", "Expected data volume per day?"],
  "notes": "Data pipeline reliability and connector error handling were the hardest parts. Dashboard rendering performance required optimization with pre-aggregated materialized views."
}'

echo ""
echo "Seeding complete. Total projects:"
if [ -n "$SEED_AUTH_TOKEN" ]; then
  curl -s "$API" -H "X-Seed-Token: $SEED_AUTH_TOKEN" | "$PYTHON_BIN" -c "import sys,json; print(len(json.load(sys.stdin)))"
else
  curl -s "$API" | "$PYTHON_BIN" -c "import sys,json; print(len(json.load(sys.stdin)))"
fi
