package com.example.counter.service;

import com.example.counter.service.model.FreeGameTable;
import com.example.counter.service.model.RegisterTable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class TablesService {
    private final List<RegisterTable> registerTables = new ArrayList<>();
    private final List<FreeGameTable> freeGameTables = new ArrayList<>();

    public synchronized RegisterTable createRegister(String name) {
        String id = UUID.randomUUID().toString();
        String code = shortCode();
        RegisterTable t = new RegisterTable(id, name, code, Instant.now());
        registerTables.add(t);
        return t;
    }

    public synchronized boolean joinRegister(String code) {
        return registerTables.stream().anyMatch(t -> t.code().equalsIgnoreCase(code));
    }

    public synchronized FreeGameTable createFreeGame(String name, int players, String notes) {
        String id = UUID.randomUUID().toString();
        String code = shortCode();
        FreeGameTable t = new FreeGameTable(id, name, Math.max(0, players), notes == null ? "" : notes, code, Instant.now());
        freeGameTables.add(t);
        return t;
    }

    public synchronized boolean joinFreeGame(String code) {
        return freeGameTables.stream().anyMatch(t -> t.code().equalsIgnoreCase(code));
    }

    public synchronized List<RegisterTable> listRegister() {
        return Collections.unmodifiableList(new ArrayList<>(registerTables));
    }

    public synchronized List<FreeGameTable> listFreeGame() {
        return Collections.unmodifiableList(new ArrayList<>(freeGameTables));
    }

    private String shortCode() {
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}

