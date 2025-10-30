package com.example.counter;

import com.example.counter.service.CounterService;
import com.example.counter.service.model.CounterState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CounterServiceTest {

    private CounterService counterService;

    @BeforeEach
    void setUp() {
        counterService = new CounterService();
    }

    @Test
    void primaryCounterCanIncreaseAndDecrease() {
        CounterState afterIncrement = counterService.incrementPrimary(5);
        assertThat(afterIncrement.primary()).isEqualTo(105);

        CounterState afterDecrement = counterService.decrementPrimary(8);
        assertThat(afterDecrement.primary()).isEqualTo(97);

        CounterState afterLargeDecrement = counterService.decrementPrimary(500);
        assertThat(afterLargeDecrement.primary()).isZero();
    }

    @Test
    void initialValuesMatchConfiguredDefaults() {
        CounterState initial = counterService.getState();

        assertThat(initial.primary()).isEqualTo(100);
        assertThat(initial.secondary()).isEqualTo(28);
        assertThat(initial.tertiary()).isEqualTo(120);
    }

    @Test
    void decrementingSecondaryAlsoReducesTertiary() {
        counterService.resetSecondary(4);
        counterService.resetTertiary(10);

        CounterState updated = counterService.decrementSecondary(3);

        assertThat(updated.secondary()).isEqualTo(1);
        assertThat(updated.tertiary()).isEqualTo(7);
    }

    @Test
    void reachingZeroOnSecondaryAdvancesImageSequence() {
        counterService.resetSecondary(1);
        counterService.resetTertiary(10);

        CounterState updated = counterService.decrementSecondary(1);

        assertThat(updated.secondary()).isEqualTo(28);
        assertThat(updated.secondaryImageIndex()).isEqualTo(1);
        assertThat(updated.tertiary()).isEqualTo(9);
    }

    @Test
    void tertiaryDoesNotDropBelowZero() {
        counterService.resetTertiary(1);

        CounterState updated = counterService.decrementSecondary(5);

        assertThat(updated.tertiary()).isZero();
    }

    @Test
    void tertiaryOnlyDropsForActualSecondaryDecrements() {
        counterService.resetSecondary(2);
        counterService.resetTertiary(10);

        CounterState updated = counterService.decrementSecondary(5);

        assertThat(updated.secondary()).isEqualTo(28);
        assertThat(updated.tertiary()).isEqualTo(8);
        assertThat(updated.secondaryImageIndex()).isEqualTo(1);
    }

    @Test
    void tertiaryUnaffectedWhenSecondaryAlreadyZero() {
        counterService.resetSecondary(0);
        counterService.resetTertiary(10);

        CounterState updated = counterService.decrementSecondary(5);

        assertThat(updated.secondary()).isZero();
        assertThat(updated.tertiary()).isEqualTo(10);
    }
}
