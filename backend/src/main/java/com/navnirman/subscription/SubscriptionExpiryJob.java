package com.navnirman.subscription;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Marks elapsed subscriptions as EXPIRED. Entitlement checks also compare endsAt to now. */
@Component
public class SubscriptionExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionExpiryJob.class);
    private final SubscriptionService subscriptions;

    public SubscriptionExpiryJob(SubscriptionService subscriptions) {
        this.subscriptions = subscriptions;
    }

    @Scheduled(fixedDelayString = "${app.subscriptions.expiry-check-delay-ms:60000}", initialDelay = 10000)
    public void expireEndedSubscriptions() {
        int expired = subscriptions.expireEndedSubscriptions(Instant.now());
        if (expired > 0) {
            log.info("Marked {} subscription(s) as expired", expired);
        }
    }
}
