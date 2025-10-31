package com.example.counter.service.model;

import java.time.Instant;
import java.util.List;

public record FreeGameTable(
        String id,
        int tableNumber,
        String name,
        int players,
        List<FreeGamePlayerInfo> playersInfo,
        String code,
        Instant createdAt
) {}

