package com.navnirman.admin;

import com.navnirman.user.*;
import com.navnirman.subscription.*;
import com.navnirman.payment.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminManagementController {
    private final AppUserRepository users;
    private final SubscriptionRepository subscriptions;
    private final PaymentOrderRepository payments;

    public AdminManagementController(AppUserRepository users,
            SubscriptionRepository subscriptions, PaymentOrderRepository payments) {
        this.users = users;
        this.subscriptions = subscriptions;
        this.payments = payments;
    }

    @GetMapping("/users")
    public List<UserAdminRow> users() {
        return users.findAllByRoleOrderByCreatedAtDesc(Role.CUSTOMER).stream()
            .map(u -> new UserAdminRow(u.getId(), u.getFullName(), u.getEmail(),
                u.getMobileNumber(), u.getRole().name(), u.isEnabled(), u.getCreatedAt()))
            .toList();
    }

    @GetMapping("/subscriptions")
    @Transactional(readOnly = true)
    public List<SubscriptionAdminRow> subscriptions() {
        return subscriptions.findAllByOrderByCreatedAtDesc().stream()
            .map(s -> new SubscriptionAdminRow(s.getId(), s.getUser().getFullName(),
                s.getUser().getEmail(), s.getPlan().getName(), s.getStatus().name(),
                s.getStartsAt(), s.getEndsAt(), s.isActiveAt(Instant.now())))
            .toList();
    }

    @GetMapping("/analytics")
    public AnalyticsResponse analytics() {
        long customers = users.countByRole(Role.CUSTOMER);
        long activeSubs = subscriptions.countByStatus(SubscriptionStatus.ACTIVE);
        long paidOrders = payments.countByStatus(PaymentStatus.PAID);
        long failedOrders = payments.countByStatus(PaymentStatus.FAILED);
        long paidRevenuePaise = payments.findAllByOrderByCreatedAtDesc().stream()
            .filter(p -> p.getStatus() == PaymentStatus.PAID)
            .mapToLong(PaymentOrder::getAmountPaise).sum();
        return new AnalyticsResponse(customers, activeSubs, paidOrders, failedOrders,
            paidRevenuePaise);
    }

    public record UserAdminRow(Long id, String fullName, String email,
        String mobileNumber, String role, boolean enabled, Instant createdAt) {}
    public record SubscriptionAdminRow(Long id, String fullName, String email,
        String planName, String status, Instant startsAt, Instant endsAt, boolean active) {}
    public record AnalyticsResponse(long totalCustomers, long activeSubscriptions,
        long paidOrders, long failedOrders, long revenuePaise) {}
}
