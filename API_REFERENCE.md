# Portfolix Compass - AI/ML API Reference

## Base URL
```
http://localhost:5000/api/aiml
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

---

## 1. Salary Prediction
**POST** `/salary/predict`

Predict salary adjustment based on employee data.

### Request
```json
{
  "employeeId": "emp001",
  "currentSalary": 500000,
  "experience": 5,
  "performanceRating": 4.5,
  "designation": "Senior Developer",
  "marketRate": 650000,
  "companyGrowth": 15,
  "inflationRate": 5.5
}
```

### Response
```json
{
  "success": true,
  "prediction": "AI-generated salary analysis..."
}
```

---

## 2. Offer Letter Generation
**POST** `/documents/offer-letter`

Generate professional offer letter.

### Request
```json
{
  "name": "John Doe",
  "position": "Product Manager",
  "department": "Product",
  "salary": 900000,
  "joiningDate": "2025-01-15",
  "location": "Kochi",
  "benefits": "Health Insurance, PF, Gratuity"
}
```

### Response
```json
{
  "success": true,
  "offerLetter": "[Professional offer letter content]"
}
```

---

## 3. Salary Slip Generation
**POST** `/documents/salary-slip`

Generate salary slip summary.

### Request
```json
{
  "name": "Jane Smith",
  "designation": "Senior Developer",
  "department": "Engineering",
  "basicSalary": 400000,
  "da": 100000,
  "hra": 80000,
  "grossSalary": 580000,
  "incomeTax": 45000,
  "professionalTax": 2500,
  "pf": 30000,
  "totalDeductions": 77500,
  "netSalary": 502500,
  "month": "December 2025"
}
```

### Response
```json
{
  "success": true,
  "slip": "[Salary slip summary]"
}
```

---

## 4. Compensation Parity Analysis
**POST** `/compensation/parity-analysis`

Analyze compensation equity within department.

### Request
```json
{
  "employees": [
    {"id": "emp001", "salary": 500000, "experience": 5, "gender": "M"},
    {"id": "emp002", "salary": 480000, "experience": 5, "gender": "F"}
  ]
}
```

### Response
```json
{
  "success": true,
  "analysis": "[Compensation parity findings and recommendations]"
}
```

---

## 5. Market Benchmarking
**POST** `/compensation/market-benchmark`

Benchmark salary against market rates.

### Request
```json
{
  "role": "Senior Developer",
  "location": "Kochi",
  "experience": 5
}
```

### Response
```json
{
  "success": true,
  "benchmark": "[Market salary data and percentile analysis]"
}
```

---

## 6. Tax Optimization Strategy
**POST** `/tax/optimize-strategy`

Provide tax optimization recommendations (Kerala-specific).

### Request
```json
{
  "employeeId": "emp001",
  "annualSalary": 1200000,
  "age": 35,
  "professionalTaxAmount": 12500,
  "taxRegime": "Old",
  "investments": "PPF, Mutual Funds"
}
```

### Response
```json
{
  "success": true,
  "strategy": "[Tax optimization recommendations and expected savings]"
}
```

---

## 7. Compliance Check
**POST** `/compliance/check`

Check payroll compliance requirements for Kerala organizations.

### Request
```json
{
  "organizationId": "org001",
  "name": "Your Company",
  "employeeCount": 50,
  "industry": "IT"
}
```

### Response
```json
{
  "success": true,
  "compliance": "[Compliance checklist with deadlines]"
}
```

---

## 8. Anomaly Detection
**POST** `/payroll/detect-anomalies`

Detect payroll anomalies and potential fraud.

### Request
```json
{
  "employees": [
    {
      "employeeId": "emp001",
      "salary": 500000,
      "lastSalary": 500000,
      "overtimePay": 0
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "anomalies": "[List of detected anomalies with risk levels]"
}
```

---

## 9. Employee Insights
**POST** `/employee/insights`

Generate comprehensive employee insights.

### Request
```json
{
  "employeeId": "emp001",
  "careerHistory": [...],
  "performanceData": [...],
  "salaryProgression": [...]
}
```

### Response
```json
{
  "success": true,
  "insights": "[Career progression analysis and recommendations]"
}
```

---

## 10. Performance Recommendations
**POST** `/employee/performance-recommendations`

Generate performance-based HR recommendations.

### Request
```json
{
  "employeeId": "emp001",
  "performanceRating": 4.5,
  "skills": ["JavaScript", "React", "Node.js"],
  "yearsInRole": 3
}
```

### Response
```json
{
  "success": true,
  "recommendations": "[Promotion eligibility, training needs, career path]"
}
```

---

## 11. Bulk Payroll Analysis
**POST** `/payroll/bulk-analysis`

Analyze bulk payroll data for insights.

### Request
```json
{
  "payrollList": [
    {
      "employeeId": "emp001",
      "grossSalary": 500000,
      "netSalary": 400000,
      "department": "Engineering"
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "analysis": "[Cost breakdown, trends, optimization opportunities]"
}
```

---

## 12. Health Check
**GET** `/health`

Check AI/ML service health status.

### Response
```json
{
  "success": true,
  "status": "operational",
  "service": "AI/ML with Gemini",
  "features": [
    "Salary Prediction",
    "Document Generation",
    "Compensation Analytics",
    "Tax Optimization",
    "Anomaly Detection",
    "Employee Insights",
    "Compliance Checking",
    "Market Benchmarking",
    "Bulk Analysis"
  ],
  "timestamp": "2025-12-02T21:00:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Service error message"
}
```

---

**Documentation Version:** 1.0.0  
**Last Updated:** December 2, 2025  
**Status:** Production Ready
