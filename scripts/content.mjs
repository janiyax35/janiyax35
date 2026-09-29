/* Everything the static SVGs say. Mirrors js/data.js on janith.qzz.io —
   edit here, then run `node scripts/build.mjs` to redraw assets/. */

export const profile = {
  name: ["JANITH", "DESHAN"],
  line: "Cybersecurity Undergraduate · SLIIT · BSc (Hons) IT, Cyber Security",
  status: "available for internships & collaborations",
  location: "homagama, sri lanka · utc+5:30",
  site: "janith.qzz.io",
  focus: ["penetration testing", "network security", "secure app development", "ai-integrated systems"]
};

export const links = {
  portfolio: "https://janith.qzz.io",
  lab: "https://janith.qzz.io/lab.html",
  cases: "https://janith.qzz.io/#cases",
  linkedin: "https://linkedin.com/in/janithdeshan",
  email: "mailto:janithmihijaya123@gmail.com",
  coffee: "https://www.buymeacoffee.com/janiyax",
  ctf: "https://ctf.janith.qzz.io"
};

/* $ nmap -sV → skills as open services */
export const scan = [
  ["22/tcp", "pentest", "Kali · Metasploit · Burp Suite · Nmap"],
  ["53/tcp", "network-sec", "VLANs · OSPF · VPN · Wireshark · Packet Tracer"],
  ["443/tcp", "secure-dev", "Spring Boot · Next.js · Node.js · Flask · OWASP"],
  ["1883/tcp", "iot", "Arduino · C++ · IoT sensors"],
  ["3306/tcp", "databases", "MySQL · MongoDB · Supabase · Firebase · SQLite"],
  ["5000/tcp", "code", "Python · Java · C/C++ · JavaScript/TypeScript · Bash"],
  ["8080/tcp", "ai-systems", "Gemini API · MCP · TensorFlow · Keras"],
  ["8443/tcp", "devsecops", "GitHub Actions · Docker · Semgrep · Gitleaks · Trivy"],
  ["31337/tcp", "elite", "TryHackMe · top 7% global"]
];

/* four featured case files (the full nine live on the portfolio) */
export const cases = [
  {
    file: "case-sentinel", id: "CASE-001", type: "CTF platform · offsec",
    title: "Operation Silent Dawn: Sentinel CTF",
    summary: "A custom CTF platform and six-stage incident-response challenge across forensics, OSINT, web, network, crypto and reverse engineering.",
    stack: ["Node.js", "Supabase", "RLS", "HMAC-SHA256"],
    metric: ["6", "stages · 6 domains"], live: true, private: true,
    href: "https://janith.qzz.io/#cases"
  },
  {
    file: "case-nodegoat", id: "CASE-002", type: "DevSecOps · AppSec",
    title: "NodeGoat DevSecOps Pipeline",
    summary: "OWASP NodeGoat secured end to end: a STRIDE threat model, four OWASP Top 10 vulnerabilities exploited and fixed, and four CI security gates.",
    stack: ["Express", "MongoDB", "Actions", "Semgrep", "Trivy"],
    metric: ["4", "vulns fixed · 4 gates"], private: true,
    href: "https://janith.qzz.io/#cases"
  },
  {
    file: "case-kapruka", id: "CASE-003", type: "AI · agents · MCP",
    title: "Kapruka AI Shopping Agent",
    summary: "Multi-modal shopping assistant using Gemini 2.5 Flash over the Model Context Protocol for conversational product search and comparison.",
    stack: ["Next.js 15", "TypeScript", "AI SDK", "MCP"],
    metric: ["700+", "national entrants"],
    href: "https://github.com/janiyax35/kapruka-shopping-agent"
  },
  {
    file: "case-network", id: "CASE-004", type: "network security",
    title: "Enterprise Network Architecture",
    summary: "Secure three-floor enterprise network: VLAN segmentation across six departments, OSPF routing, VPN and centralized firewalls.",
    stack: ["Packet Tracer", "OSPF", "VLANs", "VPN"],
    metric: ["75+", "hosts segmented"],
    href: "https://github.com/janiyax35/Enterprise-Network-Architecture-Design"
  }
];

export const education = [
  { when: "2024 – 2028", status: "in progress", t: "BSc (Hons) IT – Cyber Security", o: "SLIIT, Malabe", d: "Year 3 · Semester 1", now: true },
  { when: "2023", status: "passed", t: "G.C.E. Advanced Level", o: "Mahanama College, Colombo 03", d: "Technology stream" },
  { when: "2020", status: "passed", t: "G.C.E. Ordinary Level", o: "Mahanama College, Colombo 03", d: "" }
];

export const thmPaths = [
  { n: "Pre Security (Legacy)", done: true, d: "Feb 2026" },
  { n: "AI Security", done: false, d: "in progress" },
  { n: "Cyber Security 101", done: false, d: "in progress" }
];

/* newest first */
export const certs = [
  { t: "Hacker Holidays Completion Certificate", tag: "THM", d: "Aug 2026" },
  { t: "Introduction to Cybersecurity", tag: "CISCO", d: "Aug 2026" },
  { t: "Kapruka Agent Challenge 2026: Participation (Builder)", tag: "KAPRUKA", d: "Jul 2026" },
  { t: "loveatfirstbreach", tag: "THM", d: "Feb 2026" },
  { t: "Google Cloud Arcade Badges: Level 1–3", tag: "GCP", d: "2025" },
  { t: "Networking Basics", tag: "CISCO", d: "in progress", wip: true }
];

export const sections = {
  whoami: ["01", "whoami", "cat profile.yml"],
  arsenal: ["02", "arsenal", "nmap -sV janith"],
  cases: ["03", "case files", "ls ~/cases"],
  intel: ["04", "intel", "git log --certs"],
  telemetry: ["05", "telemetry", "./scan --live"],
  handshake: ["06", "handshake", "ssh janith@janith.qzz.io"]
};
