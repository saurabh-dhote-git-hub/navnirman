package com.navnirman.subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;
public interface SubscriptionRepository extends JpaRepository<Subscription,Long>{
 Optional<Subscription> findFirstByUser_EmailIgnoreCaseAndStatusOrderByEndsAtDesc(String email,SubscriptionStatus status);
 List<Subscription> findByUser_EmailIgnoreCaseOrderByCreatedAtDesc(String email);
 List<Subscription> findAllByOrderByCreatedAtDesc();
 long countByStatus(SubscriptionStatus status);
 boolean existsByUser_EmailIgnoreCaseAndStatusAndStartsAtLessThanEqualAndEndsAtGreaterThan(String email,SubscriptionStatus status,Instant now,Instant end);
 @Modifying(clearAutomatically = true, flushAutomatically = true)
 @Query("update Subscription s set s.status = :expired where s.status = :active and s.endsAt <= :now")
 int expireEndedSubscriptions(@Param("active") SubscriptionStatus active,
                              @Param("expired") SubscriptionStatus expired,
                              @Param("now") Instant now);
}
