package com.navnirman.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RazorpayWebhookEventRepository extends JpaRepository<RazorpayWebhookEvent, String> {

    boolean existsByEventId(String eventId);

    @Modifying
    @Query(value = "INSERT IGNORE INTO razorpay_webhook_events "
            + "(event_id, event_type, status, received_at) "
            + "VALUES (:eventId, :eventType, 'RECEIVED', CURRENT_TIMESTAMP(6))",
            nativeQuery = true)
    int insertIfAbsent(@Param("eventId") String eventId,
                       @Param("eventType") String eventType);
}
