package com.navnirman.payment;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "razorpay_webhook_events")
public class RazorpayWebhookEvent {

    @Id
    @Column(name = "event_id", nullable = false, length = 100)
    private String eventId;

    @Column(name = "event_type", nullable = false, length = 80)
    private String eventType;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "received_at", nullable = false, updatable = false)
    private Instant receivedAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    protected RazorpayWebhookEvent() {}

    public RazorpayWebhookEvent(String eventId, String eventType) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.status = "RECEIVED";
        this.receivedAt = Instant.now();
    }

    public void markProcessed() {
        this.status = "PROCESSED";
        this.processedAt = Instant.now();
    }

    public void markIgnored() {
        this.status = "IGNORED";
        this.processedAt = Instant.now();
    }
}
