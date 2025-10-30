package com.example.counter.service.model;

import java.time.Instant;

public record RegisterTable(String id, String name, String code, Instant createdAt) {}

