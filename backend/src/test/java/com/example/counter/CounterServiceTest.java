package com.example.counter;

import com.example.counter.service.CounterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CounterServiceTest {

    private CounterService counterService;

    @BeforeEach
    void setUp() {
        counterService = new CounterService();
        counterService.reset(0);
    }

    @Test
    void incrementIncreasesValue() {
        int updated = counterService.increment(5);
        assertThat(updated).isEqualTo(5);
        assertThat(counterService.getCurrentValue()).isEqualTo(5);
    }

    @Test
    void decrementDecreasesValue() {
        counterService.increment(10);
        int updated = counterService.decrement(3);
        assertThat(updated).isEqualTo(7);
        assertThat(counterService.getCurrentValue()).isEqualTo(7);
    }
}
