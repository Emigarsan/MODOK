package com.example.counter.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

@Service
public class CounterService {
    private final AtomicInteger counter = new AtomicInteger();

    public int getCurrentValue() {
        return counter.get();
    }

    public int increment(int amount) {
        return counter.addAndGet(amount);
    }

    public int decrement(int amount) {
        return counter.addAndGet(-amount);
    }

    public int reset(int value) {
        counter.set(value);
        return counter.get();
    }
}
