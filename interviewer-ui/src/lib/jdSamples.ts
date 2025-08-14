export type JDTemplate = { id: string; title: string; content: string };

export const JD_TEMPLATES: JDTemplate[] = [
  {
    id: "backend-go",
    title: "Backend Engineer, Go (Sample)",
    content: `We are looking for a Backend Engineer with strong Go experience...
Responsibilities:
- Design and build HTTP services in Go
- Postgres, Redis, AWS, Docker
- Testing, observability, CI/CD

Requirements:
- 3+ years backend experience (Go preferred)
- SQL, schema design, performance tuning
- Familiarity with distributed systems & queues

Nice to have:
- gRPC, OpenAPI, Terraform, Kubernetes`
  }
];

export const getJDTemplate = (id: string) =>
  JD_TEMPLATES.find(t => t.id === id) || null;
