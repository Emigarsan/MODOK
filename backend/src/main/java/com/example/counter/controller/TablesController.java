package com.example.counter.controller;

import com.example.counter.service.TablesService;
import com.example.counter.service.model.FreeGameTable;
import com.example.counter.service.model.RegisterTable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tables")
@CrossOrigin(origins = "*")
public class TablesController {
    private final TablesService tablesService;

    public TablesController(TablesService tablesService) {
        this.tablesService = tablesService;
    }

    @PostMapping("/register/create")
    public ResponseEntity<RegisterTable> createRegister(@RequestBody Map<String, Object> payload) {
        String name = String.valueOf(payload.getOrDefault("name", "Mesa"));
        return ResponseEntity.ok(tablesService.createRegister(name));
    }

    @PostMapping("/register/join")
    public ResponseEntity<Map<String, Object>> joinRegister(@RequestBody Map<String, Object> payload) {
        String code = String.valueOf(payload.getOrDefault("code", ""));
        boolean ok = tablesService.joinRegister(code);
        return ResponseEntity.ok(Map.of("ok", ok));
    }

    @PostMapping("/freegame/create")
    public ResponseEntity<FreeGameTable> createFreeGame(@RequestBody Map<String, Object> payload) {
        String name = String.valueOf(payload.getOrDefault("name", "Mesa Libre"));
        int players = ((Number) payload.getOrDefault("players", 0)).intValue();
        String notes = String.valueOf(payload.getOrDefault("notes", ""));
        return ResponseEntity.ok(tablesService.createFreeGame(name, players, notes));
    }

    @PostMapping("/freegame/join")
    public ResponseEntity<Map<String, Object>> joinFreeGame(@RequestBody Map<String, Object> payload) {
        String code = String.valueOf(payload.getOrDefault("code", ""));
        boolean ok = tablesService.joinFreeGame(code);
        return ResponseEntity.ok(Map.of("ok", ok));
    }
}

