package com.example.desk_ai.configuration;

import com.example.desk_ai.entity.Category;
import com.example.desk_ai.entity.Department;
import com.example.desk_ai.entity.KnowledgeBase;
import com.example.desk_ai.entity.Ticket;
import com.example.desk_ai.repository.CategoryRepository;
import com.example.desk_ai.repository.DepartmentRepository;
import com.example.desk_ai.repository.KnowledgeBaseRepository;
import com.example.desk_ai.repository.TicketRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final CategoryRepository categoryRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final TicketRepository ticketRepository;

    public DataInitializer(
            DepartmentRepository departmentRepository,
            CategoryRepository categoryRepository,
            KnowledgeBaseRepository knowledgeBaseRepository,
            TicketRepository ticketRepository) {
        this.departmentRepository = departmentRepository;
        this.categoryRepository = categoryRepository;
        this.knowledgeBaseRepository = knowledgeBaseRepository;
        this.ticketRepository = ticketRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (departmentRepository.count() == 0) {
            departmentRepository.saveAll(List.of(
                new Department(null, "IT Support", "General IT support and troubleshooting.", "itsupport@deskai.com"),
                new Department(null, "Hardware Support", "Handles hardware devices and peripherals.", "hardware@deskai.com"),
                new Department(null, "Software Support", "Handles software installation and application issues.", "software@deskai.com"),
                new Department(null, "Network Support", "Handles Wi-Fi, LAN, VPN, and network connectivity.", "network@deskai.com"),
                new Department(null, "Database Support", "Handles database administration and connectivity.", "database@deskai.com"),
                new Department(null, "Server Support", "Handles Windows/Linux servers and infrastructure.", "server@deskai.com"),
                new Department(null, "Email Support", "Handles Outlook, Microsoft 365, Gmail, and Exchange issues.", "email@deskai.com"),
                new Department(null, "Security Support", "Handles authentication, passwords, MFA, and security incidents.", "security@deskai.com"),
                new Department(null, "Human Resources", "Handles recruitment and employee management.", "hr@deskai.com"),
                new Department(null, "Finance", "Handles accounting and financial operations.", "finance@deskai.com"),
                new Department(null, "Sales", "Handles sales and customer acquisition.", "sales@deskai.com"),
                new Department(null, "Marketing", "Handles marketing and branding activities.", "marketing@deskai.com"),
                new Department(null, "Administration", "Handles office administration.", "admin@deskai.com"),
                new Department(null, "Information Technology", "General IT department.", "it@deskai.com"),
                new Department(null, "Operations", "Handles day-to-day business operations.", "operations@deskai.com"),
                new Department(null, "Customer Support", "Handles customer service operations.", "customersupport@deskai.com")
            ));
        }

        // 2. Seed Categories
        if (categoryRepository.count() == 0) {
            Category cIt = new Category(null, "IT", "Technical & Hardware Support", true);
            Category cHr = new Category(null, "HR", "Personnel & Policies", true);
            Category cFin = new Category(null, "Finance", "Accounting & Expenses", true);
            Category cSales = new Category(null, "Sales", "Sales Tools & CRM", true);
            Category cOps = new Category(null, "Ops", "Operations & Facilities", true);

            categoryRepository.saveAll(List.of(cIt, cHr, cFin, cSales, cOps));
        }

        // 3. Seed Knowledge Base Articles
        if (knowledgeBaseRepository.count() == 0) {
            KnowledgeBase kb1 = new KnowledgeBase();
            kb1.setTitle("Fixing Corporate VPN Disconnection Issues on Windows 11");
            kb1.setSummary("Step-by-step resolution guide for resolving intermittent VPN disconnects and DNS resolution failures.");
            kb1.setContent(
                "1. Open Settings -> Network & Internet -> Advanced Network Settings.\n" +
                "2. Select Network Reset and click Reset Now.\n" +
                "3. Restart your laptop and launch GlobalProtect / Cisco AnyConnect.\n" +
                "4. Clear DNS cache in Command Prompt using: ipconfig /flushdns\n" +
                "5. Ensure split-tunneling is enabled under Adapter settings."
            );
            kb1.setKeywords("vpn, network, connection, timeout, windows11, dns");
            kb1.setCreatedAt(LocalDateTime.now().minusDays(3));

            KnowledgeBase kb2 = new KnowledgeBase();
            kb2.setTitle("Self-Service Password Reset & MFA Re-Authentication");
            kb2.setSummary("How to safely reset your SSO domain password and configure Authenticator app token generator.");
            kb2.setContent(
                "1. Navigate to https://sso.desk.ai/reset-password\n" +
                "2. Enter your work email and verify via SMS OTP code.\n" +
                "3. Create a new password containing at least 12 characters (uppercase, lowercase, number, symbol).\n" +
                "4. Scan the QR code in Microsoft Authenticator app to refresh your 2FA token."
            );
            kb2.setKeywords("password, reset, sso, mfa, authentication, security");
            kb2.setCreatedAt(LocalDateTime.now().minusDays(5));

            KnowledgeBase kb3 = new KnowledgeBase();
            kb3.setTitle("Monthly Expense Reimbursement & Claim Guidelines");
            kb3.setSummary("Process and deadlines for submitting business expenses, travel receipts, and meal allowances.");
            kb3.setContent(
                "1. Log in to the Finance Portal at https://finance.desk.ai\n" +
                "2. Upload itemized PDF receipts for all claims above $25.\n" +
                "3. Select cost center code assigned by your department manager.\n" +
                "4. Claims submitted before the 20th of each month are processed in the current payroll cycle."
            );
            kb3.setKeywords("finance, expense, reimbursement, claims, receipts, payroll");
            kb3.setCreatedAt(LocalDateTime.now().minusDays(7));

            knowledgeBaseRepository.saveAll(List.of(kb1, kb2, kb3));
        }

        // 4. Seed Sample Tickets
        if (ticketRepository.count() == 0) {
            Department itDept = departmentRepository.findAll().stream()
                    .filter(d -> d.getDepartmentName().contains("IT"))
                    .findFirst().orElse(null);

            Department hrDept = departmentRepository.findAll().stream()
                    .filter(d -> d.getDepartmentName().contains("Human"))
                    .findFirst().orElse(null);

            Category itCat = categoryRepository.findAll().stream()
                    .filter(c -> c.getCategoryName().equalsIgnoreCase("IT"))
                    .findFirst().orElse(null);

            Category hrCat = categoryRepository.findAll().stream()
                    .filter(c -> c.getCategoryName().equalsIgnoreCase("HR"))
                    .findFirst().orElse(null);

            Ticket t1 = new Ticket();
            t1.setTicketNumber("TKT-1001");
            t1.setTitle("VPN connection drops continuously when working remotely");
            t1.setDescription("My GlobalProtect VPN drops every 10 minutes when connected from home Wi-Fi. IP address renewal fails.");
            t1.setStatus("OPEN");
            t1.setPriority("HIGH");
            t1.setDepartment(itDept);
            t1.setCategory(itCat);
            t1.setCreatedAt(LocalDateTime.now().minusHours(4));
            t1.setDuplicateScore(0.0);

            Ticket t2 = new Ticket();
            t2.setTicketNumber("TKT-1002");
            t2.setTitle("Annual Health Insurance Benefit Enrollment Clarification");
            t2.setDescription("Need assistance adding dependent family members to the dental insurance plan before deadline.");
            t2.setStatus("IN_PROGRESS");
            t2.setPriority("MEDIUM");
            t2.setDepartment(hrDept);
            t2.setCategory(hrCat);
            t2.setCreatedAt(LocalDateTime.now().minusDays(1));
            t2.setDuplicateScore(0.0);

            Ticket t3 = new Ticket();
            t3.setTicketNumber("TKT-1003");
            t3.setTitle("Monitor Display Flicker on Dual-Screen Docking Station");
            t3.setDescription("Secondary DELL 27-inch monitor blinks intermittently when plugged via DisplayPort dock.");
            t3.setStatus("RESOLVED");
            t3.setPriority("LOW");
            t3.setResolution("Replaced faulty DisplayPort cable and updated USB-C Dock firmware to v1.04.");
            t3.setDepartment(itDept);
            t3.setCategory(itCat);
            t3.setCreatedAt(LocalDateTime.now().minusDays(2));
            t3.setResolvedAt(LocalDateTime.now().minusHours(5));
            t3.setDuplicateScore(0.0);

            ticketRepository.saveAll(List.of(t1, t2, t3));
        }
    }
}
