package com.example.counter.service.model;

import java.time.Instant;

public record FreeGameTable(String id, String name, int players, String notes, String code, Instant createdAt) {}

